export type ChallengeStatus = 'pending' | 'active' | 'finished' | 'rejected'
export type ChallengeEffectiveStatus = ChallengeStatus

export type Challenge = {
  id: string
  title: string
  description: string
  created_by: string
  area_id: string | null
  status: ChallengeStatus
  proposed_start_date: string | null
  proposed_end_date: string | null
  start_date: string | null
  end_date: string | null
  approved_by: string | null
  approved_at: string | null
  published_at: string | null
  rejection_reason: string | null
  result_summary: string | null
  created_at: string
  updated_at: string
}

export type ChallengeVote = {
  id: string
  challenge_id: string
  user_id: string
  created_at: string
}

export type ChallengeComment = {
  id: string
  challenge_id: string
  user_id: string
  content: string
  created_at: string
  updated_at: string
}

export type ChallengeMetrics = {
  votes: number
  comments: number
  participants: number
}

export type ChallengeListItem = Challenge & {
  effective_status: ChallengeEffectiveStatus
  metrics: ChallengeMetrics
  voted_by_me: boolean
}

export type ChallengeFilter = {
  status?: 'all' | 'active' | 'finished' | 'mine' | ChallengeStatus
  areaId?: string | null
  dateFrom?: string | null
  dateTo?: string | null
}

export type ChallengeCreateInput = {
  title: string
  description: string
  created_by: string
  area_id?: string | null
  proposed_start_date?: string | null
  proposed_end_date?: string | null
}

export type ChallengeUpdateInput = Partial<
  Pick<
    Challenge,
    | 'title'
    | 'description'
    | 'area_id'
    | 'status'
    | 'proposed_start_date'
    | 'proposed_end_date'
    | 'start_date'
    | 'end_date'
    | 'approved_by'
    | 'approved_at'
    | 'published_at'
    | 'rejection_reason'
    | 'result_summary'
  >
>
