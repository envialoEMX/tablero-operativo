export type ChallengeStatus = 'pending' | 'active' | 'finished' | 'rejected'
export type ChallengeEffectiveStatus = ChallengeStatus
export type ChallengeIdeaStatus = 'active' | 'selected' | 'not_selected' | 'implemented' | 'archived'
export type ChallengeModerationStatus = 'visible' | 'hidden'
export type ChallengeIdeaSort = 'top' | 'comments' | 'recent'
export type ChallengeIdeaCommentSort = 'useful' | 'recent' | 'oldest'
export type ChallengeReportReason = 'inappropriate' | 'duplicate' | 'off_topic' | 'other'

export type ChallengeImpactType =
  | 'time'
  | 'cost'
  | 'customer'
  | 'quality'
  | 'productivity'
  | 'culture'
  | 'other'

export type ChallengeAudienceType = 'organization' | 'single_area' | 'multiple_areas'

export type StrategicPillar = {
  id: string
  code: string
  nombre: string
  descripcion: string | null
  sort_order: number
  activo: boolean
}

export type Challenge = {
  id: string
  title: string
  description: string
  context: string | null
  question: string | null
  created_by: string
  area_id: string | null
  strategic_pillar_id: string | null
  success_criteria: string | null
  audience_type: ChallengeAudienceType
  audience_area_id: string | null
  other_impact: string | null
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

/** Apoyo al problema — distinto de futuros votos de ideas/soluciones. */
export type ChallengeSupportVote = {
  id: string
  challenge_id: string
  user_id: string
  created_at: string
}

/** @deprecated Usar ChallengeSupportVote */
export type ChallengeVote = ChallengeSupportVote

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
  ideas?: number
  ideaVotes?: number
  ideaComments?: number
}

export type ChallengeListItem = Challenge & {
  effective_status: ChallengeEffectiveStatus
  metrics: ChallengeMetrics
  voted_by_me: boolean
  impacts: ChallengeImpactType[]
  audience_area_ids: string[]
  strategic_pillar?: Pick<StrategicPillar, 'id' | 'code' | 'nombre'> | null
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
  context: string
  question: string
  created_by: string
  area_id?: string | null
  strategic_pillar_id?: string | null
  success_criteria?: string | null
  audience_type: ChallengeAudienceType
  audience_area_id?: string | null
  audience_area_ids?: string[]
  impacts: ChallengeImpactType[]
  other_impact?: string | null
  proposed_start_date?: string | null
  proposed_end_date?: string | null
}

export type ChallengeUpdateInput = Partial<
  Pick<
    Challenge,
    | 'title'
    | 'description'
    | 'context'
    | 'question'
    | 'area_id'
    | 'strategic_pillar_id'
    | 'success_criteria'
    | 'audience_type'
    | 'audience_area_id'
    | 'other_impact'
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
> & {
  impacts?: ChallengeImpactType[]
  audience_area_ids?: string[]
}

export type ChallengeIdea = {
  id: string
  challenge_id: string
  author_user_id: string
  title: string
  description: string
  expected_contribution: string | null
  status: ChallengeIdeaStatus
  selected_by: string | null
  selected_at: string | null
  moderation_status: ChallengeModerationStatus
  duplicate_of_idea_id: string | null
  created_at: string
  updated_at: string
}

export type ChallengeIdeaMetrics = {
  votes: number
  comments: number
  participants: number
}

export type ChallengeIdeaListItem = ChallengeIdea & {
  metrics: ChallengeIdeaMetrics
  voted_by_me: boolean
}

export type ChallengeIdeaAttachment = {
  id: string
  idea_id: string
  storage_path: string
  file_name: string
  content_type: string | null
  uploaded_by: string | null
  created_at: string
}

export type ChallengeIdeaComment = {
  id: string
  idea_id: string
  user_id: string
  parent_comment_id: string | null
  content: string
  moderation_status: ChallengeModerationStatus
  created_at: string
  updated_at: string
}

export type ChallengeIdeaCommentListItem = ChallengeIdeaComment & {
  votes: number
  voted_by_me: boolean
  replies: ChallengeIdeaCommentListItem[]
}

export type ChallengeIdeaCreateInput = {
  challenge_id: string
  author_user_id: string
  title: string
  description: string
  expected_contribution?: string | null
}

export type ChallengeIdeaUpdateInput = Partial<
  Pick<
    ChallengeIdea,
    | 'title'
    | 'description'
    | 'expected_contribution'
    | 'status'
    | 'selected_by'
    | 'selected_at'
    | 'moderation_status'
    | 'duplicate_of_idea_id'
  >
>
