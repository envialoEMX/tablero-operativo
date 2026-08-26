import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { challengeIdeasService } from '../services/challengeIdeas.service'
import type {
  ChallengeIdeaCommentSort,
  ChallengeIdeaCreateInput,
  ChallengeIdeaListItem,
  ChallengeIdeaSort,
  ChallengeIdeaUpdateInput,
  ChallengeReportReason,
} from '../types'

const IDEAS_KEY = ['challengeIdeas'] as const
const COMMENTS_KEY = ['challengeIdeaComments'] as const
const ATTACHMENTS_KEY = ['challengeIdeaAttachments'] as const

function invalidateChallengeIdeas(qc: ReturnType<typeof useQueryClient>, challengeId?: string | null) {
  qc.invalidateQueries({ queryKey: IDEAS_KEY, refetchType: 'active' })
  if (challengeId) qc.invalidateQueries({ queryKey: ['challenges', 'detail', challengeId], refetchType: 'active' })
}

export function useChallengeIdeas(
  challengeId: string | null | undefined,
  options: { search?: string; sort?: ChallengeIdeaSort; includeHidden?: boolean } = {},
  currentUserId?: string | null
) {
  return useQuery({
    queryKey: [...IDEAS_KEY, 'list', challengeId, options.search ?? '', options.sort ?? 'top', options.includeHidden ?? false, currentUserId ?? null],
    queryFn: () => challengeIdeasService.list(challengeId!, options, currentUserId),
    enabled: Boolean(challengeId),
    staleTime: 30_000,
  })
}

export function useChallengeIdea(ideaId: string | null | undefined, currentUserId?: string | null) {
  return useQuery({
    queryKey: [...IDEAS_KEY, 'detail', ideaId, currentUserId ?? null],
    queryFn: () => challengeIdeasService.getById(ideaId!, currentUserId),
    enabled: Boolean(ideaId),
    retry: false,
  })
}

export function useChallengeIdeaAttachments(ideaId: string | null | undefined) {
  return useQuery({
    queryKey: [...ATTACHMENTS_KEY, ideaId],
    queryFn: () => challengeIdeasService.attachments(ideaId!),
    enabled: Boolean(ideaId),
    staleTime: 60_000,
  })
}

export function useCreateChallengeIdea(challengeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ input, file }: { input: ChallengeIdeaCreateInput; file?: File | null }) =>
      challengeIdeasService.create(input, file),
    onSuccess: () => invalidateChallengeIdeas(qc, challengeId),
  })
}

export function useUpdateChallengeIdea(challengeId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ChallengeIdeaUpdateInput }) =>
      challengeIdeasService.update(id, input),
    onSuccess: (idea) => {
      qc.invalidateQueries({ queryKey: [...IDEAS_KEY, 'detail', idea.id], refetchType: 'active' })
      invalidateChallengeIdeas(qc, challengeId ?? idea.challenge_id)
    },
  })
}

export function useToggleChallengeIdeaVote(currentUserId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ idea }: { idea: ChallengeIdeaListItem }) => {
      if (!currentUserId) throw new Error('Inicia sesion para apoyar una idea.')
      if (idea.author_user_id === currentUserId) throw new Error('No puedes apoyar tu propia propuesta.')
      if (idea.voted_by_me) await challengeIdeasService.unvote(idea.id, currentUserId)
      else await challengeIdeasService.vote(idea.id, currentUserId)
    },
    onMutate: async ({ idea }) => {
      const listPrefix = [...IDEAS_KEY, 'list', idea.challenge_id]
      await qc.cancelQueries({ queryKey: listPrefix })
      const snapshots = qc.getQueriesData<ChallengeIdeaListItem[]>({ queryKey: listPrefix })
      for (const [key, items] of snapshots) {
        if (!items) continue
        qc.setQueryData<ChallengeIdeaListItem[]>(key, items.map((item) => {
          if (item.id !== idea.id) return item
          const delta = item.voted_by_me ? -1 : 1
          return {
            ...item,
            voted_by_me: !item.voted_by_me,
            metrics: { ...item.metrics, votes: Math.max(0, item.metrics.votes + delta) },
          }
        }))
      }
      return { snapshots }
    },
    onError: (_error, _vars, context) => {
      for (const [key, value] of context?.snapshots ?? []) qc.setQueryData(key, value)
    },
    onSettled: (_result, _error, { idea }) => {
      qc.invalidateQueries({ queryKey: [...IDEAS_KEY, 'detail', idea.id], refetchType: 'active' })
      invalidateChallengeIdeas(qc, idea.challenge_id)
    },
  })
}

export function useChallengeIdeaComments(
  ideaId: string | null | undefined,
  sort: ChallengeIdeaCommentSort,
  currentUserId?: string | null
) {
  return useQuery({
    queryKey: [...COMMENTS_KEY, ideaId, sort, currentUserId ?? null],
    queryFn: () => challengeIdeasService.comments(ideaId!, sort, currentUserId),
    enabled: Boolean(ideaId),
    staleTime: 30_000,
  })
}

export function useCreateChallengeIdeaComment(ideaId: string, challengeId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { idea_id: string; user_id: string; content: string; parent_comment_id?: string | null }) =>
      challengeIdeasService.createComment(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COMMENTS_KEY, ideaId] })
      qc.invalidateQueries({ queryKey: [...IDEAS_KEY, 'detail', ideaId], refetchType: 'active' })
      invalidateChallengeIdeas(qc, challengeId)
    },
  })
}

export function useUpdateChallengeIdeaComment(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      challengeIdeasService.updateComment(id, content),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...COMMENTS_KEY, ideaId] }),
  })
}

export function useModerateChallengeIdeaComment(ideaId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, moderation_status }: { id: string; moderation_status: 'visible' | 'hidden' }) =>
      challengeIdeasService.setCommentModerationStatus(id, moderation_status),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...COMMENTS_KEY, ideaId] }),
  })
}

export function useToggleChallengeIdeaCommentVote(currentUserId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ commentId, voted }: { ideaId: string; commentId: string; voted: boolean }) => {
      if (!currentUserId) throw new Error('Inicia sesion para apoyar un comentario.')
      if (voted) await challengeIdeasService.unvoteComment(commentId, currentUserId)
      else await challengeIdeasService.voteComment(commentId, currentUserId)
    },
    onSettled: (_result, _error, { ideaId }) => {
      qc.invalidateQueries({ queryKey: [...COMMENTS_KEY, ideaId] })
    },
  })
}

export function useReportChallengeContent() {
  return useMutation({
    mutationFn: (input: {
      reporter_user_id: string
      challenge_id: string
      idea_id?: string | null
      comment_id?: string | null
      reason: ChallengeReportReason
      details?: string | null
    }) => challengeIdeasService.report(input),
  })
}
