import { supabase } from '@/lib/supabase/client'
import { strategicPillarsService } from './strategicPillars.service'
import type {
  Challenge,
  ChallengeComment,
  ChallengeCreateInput,
  ChallengeFilter,
  ChallengeImpactType,
  ChallengeListItem,
  ChallengeMetrics,
  ChallengeStatus,
  ChallengeSupportVote,
  ChallengeUpdateInput,
} from '../types'

const CHALLENGES_TABLE = 'challenges'
const VOTES_TABLE = 'challenge_votes'
const COMMENTS_TABLE = 'challenge_comments'
const IMPACTS_TABLE = 'challenge_impacts'
const AUDIENCE_TABLE = 'challenge_audience_areas'
const IDEAS_TABLE = 'challenge_ideas'

const CHALLENGE_SELECT =
  'id,title,description,context,question,created_by,area_id,strategic_pillar_id,success_criteria,audience_type,audience_area_id,other_impact,status,proposed_start_date,proposed_end_date,start_date,end_date,approved_by,approved_at,published_at,rejection_reason,result_summary,created_at,updated_at'

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

function normalizeChallengeRow(input: ChallengeCreateInput | ChallengeUpdateInput) {
  const next: Record<string, unknown> = { ...input }
  for (const key of ['title', 'context', 'question', 'description', 'success_criteria', 'other_impact'] as const) {
    if (typeof next[key] === 'string') next[key] = (next[key] as string).trim()
  }
  for (const key of [
    'area_id',
    'strategic_pillar_id',
    'audience_area_id',
    'proposed_start_date',
    'proposed_end_date',
    'start_date',
    'end_date',
    'rejection_reason',
    'result_summary',
  ] as const) {
    if (typeof next[key] === 'string') next[key] = (next[key] as string).trim() || null
  }
  delete next.impacts
  delete next.audience_area_ids
  return next
}

async function syncChallengeImpacts(challengeId: string, impacts: ChallengeImpactType[]) {
  const { error: deleteError } = await supabase.from(IMPACTS_TABLE).delete().eq('challenge_id', challengeId)
  if (deleteError) throw deleteError
  if (impacts.length === 0) return
  const { error } = await supabase.from(IMPACTS_TABLE).insert(
    impacts.map((impact_type) => ({ challenge_id: challengeId, impact_type }))
  )
  if (error) throw error
}

async function syncChallengeAudienceAreas(challengeId: string, areaIds: string[]) {
  const { error: deleteError } = await supabase.from(AUDIENCE_TABLE).delete().eq('challenge_id', challengeId)
  if (deleteError) throw deleteError
  if (areaIds.length === 0) return
  const { error } = await supabase.from(AUDIENCE_TABLE).insert(
    areaIds.map((area_id) => ({ challenge_id: challengeId, area_id }))
  )
  if (error) throw error
}

async function impactsByChallengeIds(ids: string[]): Promise<Record<string, ChallengeImpactType[]>> {
  const map: Record<string, ChallengeImpactType[]> = {}
  for (const id of ids) map[id] = []
  if (ids.length === 0) return map
  const { data, error } = await supabase
    .from(IMPACTS_TABLE)
    .select('challenge_id,impact_type')
    .in('challenge_id', ids)
  if (error) throw error
  for (const row of (data ?? []) as Array<{ challenge_id: string; impact_type: ChallengeImpactType }>) {
    map[row.challenge_id]?.push(row.impact_type)
  }
  return map
}

async function audienceAreasByChallengeIds(ids: string[]): Promise<Record<string, string[]>> {
  const map: Record<string, string[]> = {}
  for (const id of ids) map[id] = []
  if (ids.length === 0) return map
  const { data, error } = await supabase
    .from(AUDIENCE_TABLE)
    .select('challenge_id,area_id')
    .in('challenge_id', ids)
  if (error) throw error
  for (const row of (data ?? []) as Array<{ challenge_id: string; area_id: string }>) {
    map[row.challenge_id]?.push(row.area_id)
  }
  return map
}

async function metricsByChallengeIds(ids: string[]): Promise<Record<string, ChallengeMetrics>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  const metrics: Record<string, ChallengeMetrics> = {}
  for (const id of uniqueIds) metrics[id] = { votes: 0, comments: 0, participants: 0, ideas: 0, ideaVotes: 0, ideaComments: 0 }
  if (uniqueIds.length === 0) return metrics

  const [
    { data: votes, error: votesError },
    { data: comments, error: commentsError },
    { data: ideas, error: ideasError },
  ] = await Promise.all([
    supabase.from(VOTES_TABLE).select('challenge_id,user_id').in('challenge_id', uniqueIds),
    supabase.from(COMMENTS_TABLE).select('challenge_id,user_id').in('challenge_id', uniqueIds),
    supabase
      .from(IDEAS_TABLE)
      .select('id,challenge_id,author_user_id,moderation_status,challenge_idea_votes(user_id),challenge_idea_comments(user_id,moderation_status)')
      .in('challenge_id', uniqueIds),
  ])
  if (votesError) throw votesError
  if (commentsError) throw commentsError
  if (ideasError) throw ideasError

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
  for (const idea of (ideas ?? []) as Array<{
    challenge_id: string
    author_user_id: string
    moderation_status: string
    challenge_idea_votes?: Array<{ user_id: string }>
    challenge_idea_comments?: Array<{ user_id: string; moderation_status: string }>
  }>) {
    if (idea.moderation_status !== 'visible') continue
    const metric = metrics[idea.challenge_id]
    metric.ideas = (metric.ideas ?? 0) + 1
    participants.get(idea.challenge_id)?.add(idea.author_user_id)
    for (const vote of idea.challenge_idea_votes ?? []) {
      metric.ideaVotes = (metric.ideaVotes ?? 0) + 1
      participants.get(idea.challenge_id)?.add(vote.user_id)
    }
    for (const comment of idea.challenge_idea_comments ?? []) {
      if (comment.moderation_status !== 'visible') continue
      metric.ideaComments = (metric.ideaComments ?? 0) + 1
      participants.get(idea.challenge_id)?.add(comment.user_id)
    }
  }
  for (const [id, users] of participants.entries()) {
    metrics[id].participants = users.size
  }
  return metrics
}

async function uniqueParticipantCountByChallengeIds(ids: string[]): Promise<number> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (uniqueIds.length === 0) return 0

  const [
    { data: votes, error: votesError },
    { data: comments, error: commentsError },
    { data: ideas, error: ideasError },
  ] = await Promise.all([
    supabase.from(VOTES_TABLE).select('user_id').in('challenge_id', uniqueIds),
    supabase.from(COMMENTS_TABLE).select('user_id').in('challenge_id', uniqueIds),
    supabase
      .from(IDEAS_TABLE)
      .select('author_user_id,challenge_idea_votes(user_id),challenge_idea_comments(user_id)')
      .in('challenge_id', uniqueIds),
  ])
  if (votesError) throw votesError
  if (commentsError) throw commentsError
  if (ideasError) throw ideasError

  const users = new Set<string>()
  for (const row of (votes ?? []) as Array<{ user_id: string }>) users.add(row.user_id)
  for (const row of (comments ?? []) as Array<{ user_id: string }>) users.add(row.user_id)
  for (const idea of (ideas ?? []) as Array<{
    author_user_id: string
    challenge_idea_votes?: Array<{ user_id: string }>
    challenge_idea_comments?: Array<{ user_id: string }>
  }>) {
    users.add(idea.author_user_id)
    for (const vote of idea.challenge_idea_votes ?? []) users.add(vote.user_id)
    for (const comment of idea.challenge_idea_comments ?? []) users.add(comment.user_id)
  }
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

function escapePostgrestLikeTerm(term: string): string {
  return term.replace(/[%_]/g, (match) => `\\${match}`).replace(/[,()]/g, ' ')
}

async function enrichChallenges(rows: Challenge[], currentUserId?: string | null): Promise<ChallengeListItem[]> {
  const ids = rows.map((row) => row.id)
  const pillarIds = rows.map((row) => row.strategic_pillar_id).filter(Boolean) as string[]
  const [metrics, voted, impactsMap, audienceMap, pillarMap] = await Promise.all([
    metricsByChallengeIds(ids),
    votesByMe(ids, currentUserId),
    impactsByChallengeIds(ids),
    audienceAreasByChallengeIds(ids),
    strategicPillarsService.mapByIds(pillarIds),
  ])

  return rows.map((challenge) => ({
    ...challenge,
    effective_status: effectiveStatus(challenge),
    metrics: metrics[challenge.id] ?? { votes: 0, comments: 0, participants: 0, ideas: 0, ideaVotes: 0, ideaComments: 0 },
    voted_by_me: voted.has(challenge.id),
    impacts: impactsMap[challenge.id] ?? [],
    audience_area_ids: audienceMap[challenge.id] ?? [],
    strategic_pillar: challenge.strategic_pillar_id
      ? pillarMap[challenge.strategic_pillar_id] ?? null
      : null,
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
    if (term) {
      q = q.or(
        `title.ilike.%${escapePostgrestLikeTerm(term)}%,description.ilike.%${escapePostgrestLikeTerm(term)}%,question.ilike.%${escapePostgrestLikeTerm(term)}%`
      )
    }
    q = q.order('created_at', { ascending: false })
    const { data, error } = await q
    if (error) throw error
    return enrichChallenges((data ?? []) as Challenge[], currentUserId)
  },

  async getById(id: string, currentUserId?: string | null): Promise<ChallengeListItem> {
    const { data, error } = await supabase.from(CHALLENGES_TABLE).select(CHALLENGE_SELECT).eq('id', id).maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se encontró el challenge o no tienes permiso para verlo.')
    const [item] = await enrichChallenges([data as Challenge], currentUserId)
    return item
  },

  async create(input: ChallengeCreateInput): Promise<Challenge> {
    const { impacts, audience_area_ids, ...rowInput } = input
    const row = normalizeChallengeRow(rowInput)
    const { data, error } = await supabase
      .from(CHALLENGES_TABLE)
      .insert({ ...row, status: 'pending' })
      .select(CHALLENGE_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('El challenge se guardó, pero no se pudo leer con tu perfil.')
    const challenge = data as Challenge
    await syncChallengeImpacts(challenge.id, impacts)
    if (input.audience_type === 'multiple_areas') {
      await syncChallengeAudienceAreas(challenge.id, audience_area_ids ?? [])
    }
    return challenge
  },

  async update(id: string, input: ChallengeUpdateInput): Promise<Challenge> {
    const { impacts, audience_area_ids, ...rowInput } = input
    const row = normalizeChallengeRow(rowInput)
    const { data, error } = await supabase
      .from(CHALLENGES_TABLE)
      .update(row)
      .eq('id', id)
      .select(CHALLENGE_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo actualizar el challenge.')
    const challenge = data as Challenge
    if (impacts) await syncChallengeImpacts(id, impacts)
    if (audience_area_ids !== undefined || input.audience_type === 'multiple_areas') {
      await syncChallengeAudienceAreas(id, audience_area_ids ?? [])
    }
    if (input.audience_type && input.audience_type !== 'multiple_areas') {
      await syncChallengeAudienceAreas(id, [])
    }
    return challenge
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

  async vote(challengeId: string, userId: string): Promise<ChallengeSupportVote> {
    const { data, error } = await supabase
      .from(VOTES_TABLE)
      .insert({ challenge_id: challengeId, user_id: userId })
      .select('id,challenge_id,user_id,created_at')
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo registrar tu apoyo.')
    return data as ChallengeSupportVote
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
