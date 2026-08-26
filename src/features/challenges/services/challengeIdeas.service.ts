import { getSignedUrlEvidencia, uploadEvidenciaFile } from '@/services/evidenciaStorage.service'
import { supabase } from '@/lib/supabase/client'
import type {
  ChallengeIdea,
  ChallengeIdeaAttachment,
  ChallengeIdeaComment,
  ChallengeIdeaCommentListItem,
  ChallengeIdeaCommentSort,
  ChallengeIdeaCreateInput,
  ChallengeIdeaListItem,
  ChallengeIdeaMetrics,
  ChallengeIdeaSort,
  ChallengeIdeaUpdateInput,
  ChallengeReportReason,
} from '../types'

const IDEAS_TABLE = 'challenge_ideas'
const IDEA_VOTES_TABLE = 'challenge_idea_votes'
const IDEA_COMMENTS_TABLE = 'challenge_idea_comments'
const COMMENT_VOTES_TABLE = 'challenge_idea_comment_votes'
const ATTACHMENTS_TABLE = 'challenge_idea_attachments'
const REPORTS_TABLE = 'challenge_content_reports'

const IDEA_SELECT =
  'id,challenge_id,author_user_id,title,description,expected_contribution,status,selected_by,selected_at,moderation_status,duplicate_of_idea_id,created_at,updated_at'
const COMMENT_SELECT =
  'id,idea_id,user_id,parent_comment_id,content,moderation_status,created_at,updated_at'
const ATTACHMENT_SELECT =
  'id,idea_id,storage_path,file_name,content_type,uploaded_by,created_at'

function normalizeIdea(input: ChallengeIdeaCreateInput | ChallengeIdeaUpdateInput) {
  const next: Record<string, unknown> = { ...input }
  for (const key of ['title', 'description', 'expected_contribution'] as const) {
    if (typeof next[key] === 'string') next[key] = (next[key] as string).trim() || null
  }
  if (typeof next.duplicate_of_idea_id === 'string') next.duplicate_of_idea_id = next.duplicate_of_idea_id.trim() || null
  return next
}

function escapePostgrestLikeTerm(term: string): string {
  return term.replace(/[%_]/g, (match) => `\\${match}`).replace(/[,()]/g, ' ')
}

async function ideaMetricsByIds(ids: string[]): Promise<Record<string, ChallengeIdeaMetrics>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  const metrics: Record<string, ChallengeIdeaMetrics> = {}
  for (const id of uniqueIds) metrics[id] = { votes: 0, comments: 0, participants: 0 }
  if (uniqueIds.length === 0) return metrics

  const [{ data: votes, error: votesError }, { data: comments, error: commentsError }] = await Promise.all([
    supabase.from(IDEA_VOTES_TABLE).select('idea_id,user_id').in('idea_id', uniqueIds),
    supabase.from(IDEA_COMMENTS_TABLE).select('idea_id,user_id,moderation_status').in('idea_id', uniqueIds),
  ])
  if (votesError) throw votesError
  if (commentsError) throw commentsError

  const participants = new Map<string, Set<string>>()
  for (const id of uniqueIds) participants.set(id, new Set())

  for (const vote of (votes ?? []) as Array<{ idea_id: string; user_id: string }>) {
    metrics[vote.idea_id].votes += 1
    participants.get(vote.idea_id)?.add(vote.user_id)
  }
  for (const comment of (comments ?? []) as Array<{ idea_id: string; user_id: string; moderation_status: string }>) {
    if (comment.moderation_status === 'visible') metrics[comment.idea_id].comments += 1
    participants.get(comment.idea_id)?.add(comment.user_id)
  }
  for (const [id, users] of participants.entries()) metrics[id].participants = users.size
  return metrics
}

async function ideaVotesByMe(ids: string[], currentUserId?: string | null): Promise<Set<string>> {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  if (!currentUserId || uniqueIds.length === 0) return new Set()
  const { data, error } = await supabase
    .from(IDEA_VOTES_TABLE)
    .select('idea_id')
    .eq('user_id', currentUserId)
    .in('idea_id', uniqueIds)
  if (error) throw error
  return new Set(((data ?? []) as Array<{ idea_id: string }>).map((row) => row.idea_id))
}

async function enrichIdeas(rows: ChallengeIdea[], currentUserId?: string | null): Promise<ChallengeIdeaListItem[]> {
  const ids = rows.map((row) => row.id)
  const [metrics, voted] = await Promise.all([
    ideaMetricsByIds(ids),
    ideaVotesByMe(ids, currentUserId),
  ])
  return rows.map((idea) => ({
    ...idea,
    metrics: metrics[idea.id] ?? { votes: 0, comments: 0, participants: 0 },
    voted_by_me: voted.has(idea.id),
  }))
}

function sortIdeas(items: ChallengeIdeaListItem[], sort: ChallengeIdeaSort) {
  return [...items].sort((a, b) => {
    if (sort === 'comments') return b.metrics.comments - a.metrics.comments || b.metrics.votes - a.metrics.votes
    if (sort === 'recent') return b.created_at.localeCompare(a.created_at)
    return b.metrics.votes - a.metrics.votes || b.metrics.comments - a.metrics.comments
  })
}

async function commentVotesByIds(ids: string[], currentUserId?: string | null) {
  const uniqueIds = [...new Set(ids.filter(Boolean))]
  const counts: Record<string, number> = {}
  for (const id of uniqueIds) counts[id] = 0
  if (uniqueIds.length === 0) return { counts, voted: new Set<string>() }

  const { data, error } = await supabase
    .from(COMMENT_VOTES_TABLE)
    .select('comment_id,user_id')
    .in('comment_id', uniqueIds)
  if (error) throw error

  const voted = new Set<string>()
  for (const row of (data ?? []) as Array<{ comment_id: string; user_id: string }>) {
    counts[row.comment_id] += 1
    if (currentUserId && row.user_id === currentUserId) voted.add(row.comment_id)
  }
  return { counts, voted }
}

function sortComments(items: ChallengeIdeaCommentListItem[], sort: ChallengeIdeaCommentSort) {
  return [...items].sort((a, b) => {
    if (sort === 'recent') return b.created_at.localeCompare(a.created_at)
    if (sort === 'oldest') return a.created_at.localeCompare(b.created_at)
    return b.votes - a.votes || b.created_at.localeCompare(a.created_at)
  })
}

export const challengeIdeasService = {
  async list(
    challengeId: string,
    options: { search?: string; sort?: ChallengeIdeaSort; includeHidden?: boolean } = {},
    currentUserId?: string | null
  ): Promise<ChallengeIdeaListItem[]> {
    let q = supabase.from(IDEAS_TABLE).select(IDEA_SELECT).eq('challenge_id', challengeId)
    if (!options.includeHidden) q = q.eq('moderation_status', 'visible')
    const term = options.search?.trim()
    if (term) {
      const safe = escapePostgrestLikeTerm(term)
      q = q.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
    q = q.order('created_at', { ascending: false })
    const { data, error } = await q
    if (error) throw error
    return sortIdeas(await enrichIdeas((data ?? []) as ChallengeIdea[], currentUserId), options.sort ?? 'top')
  },

  async getById(ideaId: string, currentUserId?: string | null): Promise<ChallengeIdeaListItem> {
    const { data, error } = await supabase.from(IDEAS_TABLE).select(IDEA_SELECT).eq('id', ideaId).maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se encontro la idea o no tienes permiso para verla.')
    const [idea] = await enrichIdeas([data as ChallengeIdea], currentUserId)
    return idea
  },

  async create(input: ChallengeIdeaCreateInput, file?: File | null): Promise<ChallengeIdea> {
    const { data, error } = await supabase
      .from(IDEAS_TABLE)
      .insert({ ...normalizeIdea(input), status: 'active', moderation_status: 'visible' })
      .select(IDEA_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('La idea se guardo, pero no se pudo leer con tu perfil.')
    const idea = data as ChallengeIdea
    if (file) await this.attachFile(idea.id, input.author_user_id, file)
    return idea
  },

  async update(id: string, input: ChallengeIdeaUpdateInput): Promise<ChallengeIdea> {
    const { data, error } = await supabase
      .from(IDEAS_TABLE)
      .update(normalizeIdea(input))
      .eq('id', id)
      .select(IDEA_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo actualizar la idea.')
    return data as ChallengeIdea
  },

  async vote(ideaId: string, userId: string): Promise<void> {
    const { error } = await supabase.from(IDEA_VOTES_TABLE).insert({ idea_id: ideaId, user_id: userId })
    if (error) throw error
  },

  async unvote(ideaId: string, userId: string): Promise<void> {
    const { error } = await supabase.from(IDEA_VOTES_TABLE).delete().eq('idea_id', ideaId).eq('user_id', userId)
    if (error) throw error
  },

  async selectIdea(ideaId: string, selectedBy: string): Promise<ChallengeIdea> {
    return this.update(ideaId, { status: 'selected', selected_by: selectedBy, selected_at: new Date().toISOString() })
  },

  async setModerationStatus(ideaId: string, moderation_status: 'visible' | 'hidden'): Promise<ChallengeIdea> {
    return this.update(ideaId, { moderation_status })
  },

  async markDuplicate(ideaId: string, originalIdeaId: string | null): Promise<ChallengeIdea> {
    return this.update(ideaId, { duplicate_of_idea_id: originalIdeaId })
  },

  async attachments(ideaId: string): Promise<ChallengeIdeaAttachment[]> {
    const { data, error } = await supabase.from(ATTACHMENTS_TABLE).select(ATTACHMENT_SELECT).eq('idea_id', ideaId)
    if (error) throw error
    return (data ?? []) as ChallengeIdeaAttachment[]
  },

  async attachFile(ideaId: string, userId: string, file: File): Promise<ChallengeIdeaAttachment> {
    const uploaded = await uploadEvidenciaFile(`challenges/ideas/${ideaId}`, file)
    const { data, error } = await supabase
      .from(ATTACHMENTS_TABLE)
      .insert({
        idea_id: ideaId,
        storage_path: uploaded.storage_path,
        file_name: uploaded.file_name,
        content_type: file.type || null,
        uploaded_by: userId,
      })
      .select(ATTACHMENT_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo registrar el adjunto.')
    return data as ChallengeIdeaAttachment
  },

  signedAttachmentUrl(storagePath: string) {
    return getSignedUrlEvidencia(storagePath)
  },

  async comments(
    ideaId: string,
    sort: ChallengeIdeaCommentSort = 'useful',
    currentUserId?: string | null
  ): Promise<ChallengeIdeaCommentListItem[]> {
    const { data, error } = await supabase
      .from(IDEA_COMMENTS_TABLE)
      .select(COMMENT_SELECT)
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: true })
    if (error) throw error

    const comments = (data ?? []) as ChallengeIdeaComment[]
    const { counts, voted } = await commentVotesByIds(comments.map((comment) => comment.id), currentUserId)
    const byId = new Map<string, ChallengeIdeaCommentListItem>()
    const roots: ChallengeIdeaCommentListItem[] = []

    for (const comment of comments) {
      byId.set(comment.id, {
        ...comment,
        votes: counts[comment.id] ?? 0,
        voted_by_me: voted.has(comment.id),
        replies: [],
      })
    }
    for (const item of byId.values()) {
      if (item.parent_comment_id) {
        byId.get(item.parent_comment_id)?.replies.push(item)
      } else {
        roots.push(item)
      }
    }
    for (const item of roots) item.replies = sortComments(item.replies, 'oldest')
    return sortComments(roots, sort)
  },

  async createComment(input: { idea_id: string; user_id: string; content: string; parent_comment_id?: string | null }) {
    const { data, error } = await supabase
      .from(IDEA_COMMENTS_TABLE)
      .insert({
        idea_id: input.idea_id,
        user_id: input.user_id,
        content: input.content.trim(),
        parent_comment_id: input.parent_comment_id ?? null,
      })
      .select(COMMENT_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo publicar el comentario.')
    return data as ChallengeIdeaComment
  },

  async updateComment(id: string, content: string): Promise<ChallengeIdeaComment> {
    const { data, error } = await supabase
      .from(IDEA_COMMENTS_TABLE)
      .update({ content: content.trim() })
      .eq('id', id)
      .select(COMMENT_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo actualizar el comentario.')
    return data as ChallengeIdeaComment
  },

  async setCommentModerationStatus(id: string, moderation_status: 'visible' | 'hidden'): Promise<ChallengeIdeaComment> {
    const { data, error } = await supabase
      .from(IDEA_COMMENTS_TABLE)
      .update({ moderation_status })
      .eq('id', id)
      .select(COMMENT_SELECT)
      .maybeSingle()
    if (error) throw error
    if (!data) throw new Error('No se pudo moderar el comentario.')
    return data as ChallengeIdeaComment
  },

  async voteComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase.from(COMMENT_VOTES_TABLE).insert({ comment_id: commentId, user_id: userId })
    if (error) throw error
  },

  async unvoteComment(commentId: string, userId: string): Promise<void> {
    const { error } = await supabase.from(COMMENT_VOTES_TABLE).delete().eq('comment_id', commentId).eq('user_id', userId)
    if (error) throw error
  },

  async report(input: {
    reporter_user_id: string
    challenge_id: string
    idea_id?: string | null
    comment_id?: string | null
    reason: ChallengeReportReason
    details?: string | null
  }): Promise<void> {
    const { error } = await supabase.from(REPORTS_TABLE).insert({
      reporter_user_id: input.reporter_user_id,
      challenge_id: input.challenge_id,
      idea_id: input.idea_id ?? null,
      comment_id: input.comment_id ?? null,
      reason: input.reason,
      details: input.details?.trim() || null,
    })
    if (error) throw error
  },
}
