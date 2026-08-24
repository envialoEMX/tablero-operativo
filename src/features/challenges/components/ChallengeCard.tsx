import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MessageSquare, ThumbsUp, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/constants'
import { cn } from '@/lib/utils'
import type { ChallengeListItem } from '../types'
import {
  CHALLENGE_STATUS_BADGE,
  CHALLENGE_STATUS_LABEL,
  dateLabel,
  daysRemaining,
  userInitials,
} from '../utils'

type ChallengeCardProps = {
  challenge: ChallengeListItem
  creatorName: string
  areaName?: string | null
}

export function ChallengeCard({ challenge, creatorName, areaName }: ChallengeCardProps) {
  const remaining = daysRemaining(challenge)
  const status = challenge.effective_status
  return (
    <article className="group flex min-h-64 flex-col rounded-xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-border hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Badge variant="outline" className={cn('mb-3', CHALLENGE_STATUS_BADGE[status])}>
            {CHALLENGE_STATUS_LABEL[status]}
          </Badge>
          <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground">
            {challenge.title}
          </h2>
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {userInitials(creatorName)}
        </div>
      </div>

      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {challenge.description}
      </p>

      <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Cierre {dateLabel(challenge.end_date ?? challenge.proposed_end_date)}
        </span>
        <span className="font-medium text-foreground">
          {status === 'active'
            ? `${remaining} dia${remaining === 1 ? '' : 's'} restante${remaining === 1 ? '' : 's'}`
            : areaName || 'Comunidad'}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Metric icon={<ThumbsUp className="h-3.5 w-3.5" aria-hidden />} value={challenge.metrics.votes} label="votos" />
        <Metric icon={<MessageSquare className="h-3.5 w-3.5" aria-hidden />} value={challenge.metrics.comments} label="comentarios" />
        <Metric icon={<Users className="h-3.5 w-3.5" aria-hidden />} value={challenge.metrics.participants} label="participantes" />
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-5">
        <div className="min-w-0 text-xs text-muted-foreground">
          <p className="truncate">Creado por {creatorName}</p>
          <p>Publicado {dateLabel(challenge.published_at?.slice(0, 10) ?? challenge.start_date)}</p>
        </div>
        <Button asChild size="sm" className="shrink-0">
          <Link to={`${ROUTES.CHALLENGES}/${challenge.id}`}>
            {status === 'active' ? 'Participar' : 'Ver resultado'}
          </Link>
        </Button>
      </div>
    </article>
  )
}

function Metric({
  icon,
  value,
  label,
}: {
  icon: ReactNode
  value: number
  label: string
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/25 px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {icon}
      <span className="tabular-nums text-foreground">{value}</span>
      {label}
    </span>
  )
}
