import { supabase } from '@/lib/supabase/client'
import type {
  Challenge,
  ChallengeComment,
  ChallengeCreateInput,
  ChallengeFilter,
  ChallengeListItem,
  ChallengeMetrics,
  ChallengeStatus,
  ChallengeUpdateInput,
  ChallengeVote,
} from '../types'

const CHALLENGES_TABLE = 'challenges'
const VOTES_TABLE = 'challenge_votes'
const COMMENTS_TABLE = 'challenge_comments'
const CHALLENGE_SELECT =
  'id,title,description,created_by,area_id,status,proposed_start_date,proposed_end_date,start_date,end_date,approved_by,approved_at,published_at,rejection_reason,result_summary,created_at,updated_at'
const COMMENT_SELECT = 'id,challenge_id,user_id,content,created_at,updated_at'

function todayYmd() {
  return new Date().toISOString().slice(0, 10)
}

function effectiveStatus(challenge: Challenge, today = todayYmd()): ChallengeStatus {
  if (challenge.status === 'active' && challenge.end_date && challenge.end_date < today) return 'finished'
  if (challenge.status === 'active' && challenge.start_date && challenge.start_date > today) return 'pending'
  return challenge.status
}

export function isChallengeOpen(challenge: Challenge, today = todayYmd()): boolean {
  return (
    challenge.status === 'active' &&
    (!challenge.start_date || challenge.start_date <= today) &&
    (!challenge.end_date || challenge.end_date >= today)
  )
}

function normalizeChallenge(input: ChallengeCreateInput | ChallengeUpdateInput) {
  const next: Record<string, unknown> = { ...input }
  if (typeof next.title === 'string') next.title = next.title.trim()
  if (typeof next.description === 'string') next.description = next.description.trim()
  for (const key of ['area_id', 'proposed_start_date', 'proposed_end_date', 'start_date', 'end_date', 'rejection_reason', 'result_summary'] as const) {
    if (typeof next[key] === 'string') next[key] = next[key].trim() || null
  }
  return next
}

function escapePostgrestLikeTerm(term: string): string {
  return term.replace(/[%_]/g, (match) => `\\${match}`).replace(/[,()]/g, ' ')
}

async function metricsByChallengeIds(ids: string[]): Promise<Record<string, ChallengeMetrics>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  const metrics: Record<string, ChallengeMetrics> = {}
  for (const id of uniqueIds) metrics[id] = { votes: 0, comments: 0, participants: 0 }
  if (uniqueIds.length === 0) return metrics

  const [{ data: votes, error: votesError }, { data: comments, error: commentsError }] = await Promise.all([
    supabase.from(VOTES_TABLE).select('challenge_id,user_id').in('challenge_id', uniqueIds),
    supabase.from(COMMENTS_TABLE).select('challenge_id,user_id').in('challenge_id', uniqueIds),
  ])
  if (votesError) throw votesError
  if (commentsError) throw commentsError

  const participants = new Map<string, Set<string>>()
  for (const id of uniqueIds) participants.set(id, new Set())

  for (const row of (votes ?? []) as Array<{ challenge_id: string; user_id: string }>) {
    metrics[row.challenge_id].votes += 1
    participants.get(row.challenge_id)?.add(row.user_id)
  }
  for (const row of (comments ?? []) as Array<{ challenge_id: string; user_id: string }>) {
    metrics[row.challenge_id].comments += 1
    participants.get(row.challenge_id)?.add(row.user_id)
  }
  for (const [id, users] of participants.entries()) {
    metrics[id].participants = users.size
  }
  return metrics
}

async function uniqueParticipantCountByChallengeIds(ids: string[]): Promise<number> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (uniqueIds.length === 0) return 0

  const [{ data: votes, error: votesError }, { data: comments, error: commentsError }] = await Promise.all([
    supabase.from(VOTES_TABLE).select('user_id').in('challenge_id', uniqueIds),
    supabase.from(COMMENTS_TABLE).select('user_id').in('challenge_id', uniqueIds),
  ])
  if (votesError) throw votesError
  if (commentsError) throw commentsError

  const users = new Set<string>()
  for (const row of (votes ?? []) as Array<{ user_id: string }>) users.add(row.user_id)
  for (const row of (comments ?? []) as Array<{ user_id: string }>) users.add(row.user_id)
  return users.size
}

async function votesByMe(ids: string[], currentUserId?: string | null): Promise<Set<string>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!currentUserId || uniqueIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from(VOTES_TABLE)
    .select('challenge_id')
    .eq('user_id', currentUserId)
    .in('challenge_id', uniqueIds)
  if (error) throw error
  return new Set(((data ?? []) as Array<{ challenge_id: string }>).map((row) => row.challenge_id))
}

async function enrichChallenges(rows: Challenge[], currentUserId?: string | null): Promise<ChallengeListItem[]> {
  const ids = rows.map((row) => row.id)
  const [metrics, voted] = await Promise.all([metricsByChallengeIds(ids), votesByMe(ids, currentUserId)])
  return rows.map((challenge) => ({
    ...challenge,
    effective_status: effectiveStatus(challenge),
    metrics: metrics[challenge.id] ?? { votes: 0, comments: 0, participants: 0 },
    voted_by_me: voted.has(challenge.id),
  }))
}

export const challengesService = {
  async list(filter: ChallengeFilter = {}, currentUserId?: string | null): Promise<ChallengeListItem[]> {
    let q = supabase.from(CHALLENGES_TABLE).select(CHALLENGE_SELECT)
    if (filter.status && !['all', 'active', 'finished', 'mine'].includes(filter.status)) {
      q = q.eq('status', filter.status)
    }
    if (filter.status === 'active') {
      q = q.eq('status', 'active').lte('start_date', todayYmd()).gte('end_date', todayYmd())
    }
    if (filter.status === 'finished') q = q.in('status', ['finished', 'active'])
    if (filter.status === 'mine' && currentUserId) q = q.eq('created_by', currentUserId)
    if (filter.areaId) q = q.eq('area_id', filter.areaId)
    if (filter.dateFrom) q = q.gte('created_at', `${filter.dateFrom}T00:00:00`)
    if (filter.dateTo) q = q.lte('created_at', `${filter.dateTo}T23:59:59`)
    q = q.order('created_at', { ascending: false })
    const { data, error } = await q
    if (error) throw error
    const enriched = await enrichChallenges((data ?? []) as Challenge[], currentUserId)
    if (filter.status === 'active') return enriched.filter((item) => item.effective_status === 'active')
    if (filter.status === 'finished') return enriched.filter((item) => item.effective_status === 'finished')
    return enriched
  },

  async searchPublic(search: string, currentUserId?: string | null): Promise<ChallengeListItem[]> {
    let q = supabase.from(CHALLENGES_TABLE).select(CHALLENGE_SELECT)
    const term = search.trim()
    if (term) q = q.or(`title.ilike.%${escapePostgrestLikeTerm(term)}%,description.ilike.%${escapePostgrestLikeTerm(term)}%`)
    q = q.order('created_at', { ascending: false })
    const { data, error } = await q
    if (error) throw error
    return enrichChallenges((data ?? []) as Challenge[], currentUserId)
  },

  async getById(id: string, currentUserId?: string | null): Promise<ChallengeListItem> {
    const { data, error } = await supabase.from(CHALLENGES_TABLE).select(CHALLENGE_SELECT).eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se encontro el challenge o no tienes permiso para verlo.')
    const [item] = await enrichChallenges([data as Challenge], currentUserId)
    return item
  },

  async create(input: ChallengeCreateInput): Promise<Challenge> {
    const { data, error } = await supabase
      .from(CHALLENGES_TABLE)
      .insert({ ...normalizeChallenge(input), status: 'pending' })
      .select(CHALLENGE_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('El challenge se guardo, pero no se pudo leer con tu perfil.')
    return data as Challenge
  },

  async update(id: string, input: ChallengeUpdateInput): Promise<Challenge> {
    const { data, error } = await supabase
      .from(CHALLENGES_TABLE)
      .update(normalizeChallenge(input))
      .eq('id', id)
      .select(CHALLENGE_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo actualizar el challenge.')
    return data as Challenge
  },

  async approve(id: string, input: { approvedBy: string; startDate: string; endDate: string }): Promise<Challenge> {
    return this.update(id, {
      status: 'active',
      start_date: input.startDate,
      end_date: input.endDate,
      approved_by: input.approvedBy,
      approved_at: new Date().toISOString(),
      published_at: new Date().toISOString(),
      rejection_reason: null,
    })
  },

  async reject(id: string, input: { reason: string }): Promise<Challenge> {
    return this.update(id, {
      status: 'rejected',
      rejection_reason: input.reason,
      approved_by: null,
      approved_at: null,
      published_at: null,
    })
  },

  async finish(id: string, resultSummary?: string | null): Promise<Challenge> {
    const input: ChallengeUpdateInput = {
      status: 'finished',
      end_date: todayYmd(),
    }
    if (resultSummary !== undefined) input.result_summary = resultSummary
    return this.update(id, input)
  },

  uniqueParticipantCount(challengeIds: string[]): Promise<number> {
    return uniqueParticipantCountByChallengeIds(challengeIds)
  },

  async vote(challengeId: string, userId: string): Promise<ChallengeVote> {
    const { data, error } = await supabase
      .from(VOTES_TABLE)
      .insert({ challenge_id: challengeId, user_id: userId })
      .select('id,challenge_id,user_id,created_at')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo registrar tu voto.')
    return data as ChallengeVote
  },

  async unvote(challengeId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from(VOTES_TABLE)
      .delete()
      .eq('challenge_id', challengeId)
      .eq('user_id', userId)
    if (error) throw error
  },
}

export const challengeCommentsService = {
  async list(challengeId: string): Promise<ChallengeComment[]> {
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .select(COMMENT_SELECT)
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as ChallengeComment[]
  },

  async create(input: { challenge_id: string; user_id: string; content: string }): Promise<ChallengeComment> {
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .insert({
        challenge_id: input.challenge_id,
        user_id: input.user_id,
        content: input.content.trim(),
      })
      .select(COMMENT_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo publicar el comentario.')
    return data as ChallengeComment
  },

  async update(id: string, content: string): Promise<ChallengeComment> {
    const { data, error } = await supabase
      .from(COMMENTS_TABLE)
      .update({ content: content.trim() })
      .eq('id', id)
      .select(COMMENT_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo actualizar el comentario.')
    return data as ChallengeComment
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from(COMMENTS_TABLE).delete().eq('id', id)
    if (error) throw error
  },
}
