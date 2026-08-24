import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  challengeCommentsService,
  challengesService,
} from '../services/challenges.service'
import type {
  Challenge,
  ChallengeCreateInput,
  ChallengeFilter,
  ChallengeUpdateInput,
} from '../types'

const KEY = ['challenges'] as const
const COMMENTS_KEY = ['challengeComments'] as const

function filterKey(filter: ChallengeFilter = {}) {
  return [
    filter.status ?? 'all',
    filter.areaId ?? '',
    filter.dateFrom ?? '',
    filter.dateTo ?? '',
  ]
}

function invalidateChallenges(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: KEY, refetchType: 'active' })
}

export function useChallenges(filter: ChallengeFilter = {}, currentUserId?: string | null) {
  return useQuery({
    queryKey: [...KEY, ...filterKey(filter), currentUserId ?? null],
    queryFn: () => challengesService.list(filter, currentUserId),
    staleTime: 30_000,
  })
}

export function useChallenge(id: string | null | undefined, currentUserId?: string | null) {
  return useQuery({
    queryKey: [...KEY, 'detail', id, currentUserId ?? null],
    queryFn: () => challengesService.getById(id!, currentUserId),
    enabled: Boolean(id),
    retry: false,
  })
}

export function useChallengeComments(challengeId: string | null | undefined) {
  return useQuery({
    queryKey: [...COMMENTS_KEY, challengeId],
    queryFn: () => challengeCommentsService.list(challengeId!),
    enabled: Boolean(challengeId),
    staleTime: 30_000,
  })
}

export function useChallengeUniqueParticipantCount(challengeIds: string[]) {
  return useQuery({
    queryKey: [...KEY, 'uniqueParticipants', [...challengeIds].sort().join(',')],
    queryFn: () => challengesService.uniqueParticipantCount(challengeIds),
    enabled: challengeIds.length > 0,
    staleTime: 30_000,
  })
}

export function useCreateChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: ChallengeCreateInput) => challengesService.create(input),
    onSuccess: () => invalidateChallenges(qc),
  })
}

export function useUpdateChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ChallengeUpdateInput }) =>
      challengesService.update(id, input),
    onSuccess: (challenge) => {
      qc.invalidateQueries({ queryKey: [...KEY, 'detail', challenge.id], refetchType: 'active' })
      invalidateChallenges(qc)
    },
  })
}

export function useApproveChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, approvedBy, startDate, endDate }: { id: string; approvedBy: string; startDate: string; endDate: string }) =>
      challengesService.approve(id, { approvedBy, startDate, endDate }),
    onSuccess: (challenge) => {
      qc.invalidateQueries({ queryKey: [...KEY, 'detail', challenge.id], refetchType: 'active' })
      invalidateChallenges(qc)
    },
  })
}

export function useRejectChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      challengesService.reject(id, { reason }),
    onSuccess: (challenge) => {
      qc.invalidateQueries({ queryKey: [...KEY, 'detail', challenge.id], refetchType: 'active' })
      invalidateChallenges(qc)
    },
  })
}

export function useFinishChallenge() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, resultSummary }: { id: string; resultSummary?: string | null }) =>
      challengesService.finish(id, resultSummary),
    onSuccess: (challenge) => {
      qc.invalidateQueries({ queryKey: [...KEY, 'detail', challenge.id], refetchType: 'active' })
      invalidateChallenges(qc)
    },
  })
}

export function useToggleChallengeVote(currentUserId?: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ challenge }: { challenge: Challenge & { voted_by_me?: boolean } }) => {
      if (!currentUserId) throw new Error('Inicia sesion para votar.')
      if (challenge.voted_by_me) {
        await challengesService.unvote(challenge.id, currentUserId)
      } else {
        await challengesService.vote(challenge.id, currentUserId)
      }
    },
    onSuccess: (_result, { challenge }) => {
      qc.invalidateQueries({ queryKey: [...KEY, 'detail', challenge.id], refetchType: 'active' })
      invalidateChallenges(qc)
    },
  })
}

export function useCreateChallengeComment(challengeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { challenge_id: string; user_id: string; content: string }) =>
      challengeCommentsService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COMMENTS_KEY, challengeId] })
      qc.invalidateQueries({ queryKey: [...KEY, 'detail', challengeId], refetchType: 'active' })
      invalidateChallenges(qc)
    },
  })
}

export function useUpdateChallengeComment(challengeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      challengeCommentsService.update(id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COMMENTS_KEY, challengeId] })
      invalidateChallenges(qc)
    },
  })
}

export function useDeleteChallengeComment(challengeId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => challengeCommentsService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...COMMENTS_KEY, challengeId] })
      qc.invalidateQueries({ queryKey: [...KEY, 'detail', challengeId], refetchType: 'active' })
      invalidateChallenges(qc)
    },
  })
}
