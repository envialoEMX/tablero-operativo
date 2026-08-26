import type { ChallengeAudienceType, ChallengeImpactType } from './types'

export const CHALLENGE_IMPACT_OPTIONS: Array<{
  value: ChallengeImpactType
  label: string
}> = [
  { value: 'time', label: 'Tiempo' },
  { value: 'cost', label: 'Costo' },
  { value: 'customer', label: 'Cliente' },
  { value: 'quality', label: 'Calidad' },
  { value: 'productivity', label: 'Productividad' },
  { value: 'culture', label: 'Cultura' },
  { value: 'other', label: 'Otro' },
]

export const CHALLENGE_IMPACT_LABEL: Record<ChallengeImpactType, string> = Object.fromEntries(
  CHALLENGE_IMPACT_OPTIONS.map((option) => [option.value, option.label])
) as Record<ChallengeImpactType, string>

export const CHALLENGE_AUDIENCE_OPTIONS: Array<{
  value: ChallengeAudienceType
  label: string
  hint: string
}> = [
  {
    value: 'organization',
    label: 'Toda la organización',
    hint: 'Visible para todos los usuarios activos.',
  },
  {
    value: 'single_area',
    label: 'Área específica',
    hint: 'Solo miembros de un área pueden ver y participar.',
  },
  {
    value: 'multiple_areas',
    label: 'Varias áreas',
    hint: 'Selecciona al menos dos áreas destinatarias.',
  },
]

export const CHALLENGE_AUDIENCE_LABEL: Record<ChallengeAudienceType, string> = Object.fromEntries(
  CHALLENGE_AUDIENCE_OPTIONS.map((option) => [option.value, option.label])
) as Record<ChallengeAudienceType, string>

export const CHALLENGE_SUPPORT_TOOLTIP =
  'Tu apoyo indica que consideras importante que la organización atienda este reto.'

export const CHALLENGE_SUPPORT_LABEL = 'Considero importante'

export const CHALLENGE_SUPPORT_LABEL_ACTIVE = 'Retirar apoyo'

export const CHALLENGE_SUCCESS_CRITERIA_HINT =
  'Define un resultado observable que permita saber si la solución realmente funcionó.'

export const CHALLENGE_SUCCESS_CRITERIA_EXAMPLES = [
  'Reducir tiempos.',
  'Disminuir errores.',
  'Incrementar satisfacción.',
  'Eliminar retrabajos.',
] as const
