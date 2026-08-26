import { Badge } from '@/components/ui/badge'
import { SectionCard, SectionCardBody, SectionCardHeader } from '@/components/SectionCard'
import { Target } from 'lucide-react'
import { CHALLENGE_IMPACT_LABEL } from '../constants'
import { dateLabel } from '../utils'
import type { ChallengeListItem } from '../types'

export function ChallengeAboutSection({
  challenge,
  areaName,
}: {
  challenge: ChallengeListItem
  areaName?: string | null
}) {
  const impactLabels = challenge.impacts.map((impact) => {
    if (impact === 'other' && challenge.other_impact?.trim()) {
      return challenge.other_impact.trim()
    }
    return CHALLENGE_IMPACT_LABEL[impact]
  })

  return (
    <SectionCard>
      <SectionCardHeader title="Sobre este Challenge" icon={Target} />
      <SectionCardBody className="grid gap-3 sm:grid-cols-2">
        <AboutItem label="Área" value={areaName ?? 'Sin área específica'} />
        <AboutItem
          label="Pilar"
          value={challenge.strategic_pillar?.nombre ?? 'Sin pilar asociado'}
        />
        <AboutItem
          label="Busca mejorar"
          value={impactLabels.length > 0 ? impactLabels.join(' · ') : 'Sin definir'}
          className="sm:col-span-2"
        />
        {challenge.success_criteria?.trim() ? (
          <AboutItem
            label="Criterio de éxito"
            value={challenge.success_criteria.trim()}
            className="sm:col-span-2"
          />
        ) : null}
        <AboutItem
          label="Cierre"
          value={dateLabel(challenge.end_date ?? challenge.proposed_end_date)}
        />
        {challenge.question?.trim() ? (
          <AboutItem label="Pregunta" value={challenge.question.trim()} className="sm:col-span-2" />
        ) : null}
      </SectionCardBody>
    </SectionCard>
  )
}

function AboutItem({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{value}</p>
    </div>
  )
}

export function ChallengeMetaBadges({
  challenge,
  areaName,
}: {
  challenge: ChallengeListItem
  areaName?: string | null
}) {
  const impactLabels = challenge.impacts.slice(0, 3).map((impact) => {
    if (impact === 'other' && challenge.other_impact?.trim()) return challenge.other_impact.trim()
    return CHALLENGE_IMPACT_LABEL[impact]
  })

  return (
    <div className="flex flex-wrap gap-1.5">
      {challenge.strategic_pillar ? (
        <Badge variant="outline" className="border-primary/25 bg-primary/5 text-[10px]">
          {challenge.strategic_pillar.nombre}
        </Badge>
      ) : null}
      {impactLabels.map((label) => (
        <Badge key={label} variant="secondary" className="text-[10px]">
          {label}
        </Badge>
      ))}
      {areaName ? (
        <Badge variant="outline" className="text-[10px] text-muted-foreground">
          {areaName}
        </Badge>
      ) : null}
    </div>
  )
}
