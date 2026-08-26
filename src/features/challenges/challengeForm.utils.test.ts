import { describe, expect, it } from 'vitest'
import {
  buildChallengeDescription,
  challengeToFormValues,
  toChallengeCreatePayload,
  validateChallengeForm,
  type ChallengeFormValues,
} from './challengeForm.utils'

const baseForm = (): ChallengeFormValues => ({
  title: 'Reducir retrabajos documentales',
  context: 'En operaciones detectamos entregas incompletas por falta de evidencias.',
  question: '¿Cómo podemos reducir entregas incompletas por documentación faltante?',
  impacts: ['quality', 'time'],
  other_impact: '',
  area_id: null,
  strategic_pillar_id: null,
  audience_type: 'organization',
  audience_area_id: null,
  audience_area_ids: [],
  success_criteria: '',
  proposed_start_date: '2026-09-01',
  proposed_end_date: '2026-09-18',
  start_date: '',
  end_date: '',
  result_summary: '',
})

describe('validateChallengeForm', () => {
  it('acepta un challenge para toda la organización', () => {
    expect(validateChallengeForm(baseForm()).ok).toBe(true)
  })

  it('requiere al menos un impacto', () => {
    const result = validateChallengeForm({ ...baseForm(), impacts: [] })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/impacto/i)
  })

  it('requiere other_impact cuando se selecciona Otro', () => {
    const result = validateChallengeForm({
      ...baseForm(),
      impacts: ['other'],
      other_impact: '',
    })
    expect(result.ok).toBe(false)
  })

  it('requiere un área para audiencia single_area', () => {
    const result = validateChallengeForm({
      ...baseForm(),
      audience_type: 'single_area',
      audience_area_id: null,
    })
    expect(result.ok).toBe(false)
  })

  it('requiere al menos dos áreas para audiencia multiple_areas', () => {
    const result = validateChallengeForm({
      ...baseForm(),
      audience_type: 'multiple_areas',
      audience_area_ids: ['area-1'],
    })
    expect(result.ok).toBe(false)
  })

  it('acepta audiencia de varias áreas con mínimo 2', () => {
    const result = validateChallengeForm({
      ...baseForm(),
      audience_type: 'multiple_areas',
      audience_area_ids: ['area-1', 'area-2'],
    })
    expect(result.ok).toBe(true)
  })

  it('permite criterio de éxito vacío', () => {
    expect(validateChallengeForm({ ...baseForm(), success_criteria: '' }).ok).toBe(true)
  })

  it('permite pilar estratégico nulo', () => {
    expect(validateChallengeForm({ ...baseForm(), strategic_pillar_id: null }).ok).toBe(true)
  })

  it('requiere inicio y cierre del periodo', () => {
    const result = validateChallengeForm({
      ...baseForm(),
      proposed_start_date: '',
      proposed_end_date: '',
    })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.message).toMatch(/periodo/i)
  })
})

describe('buildChallengeDescription', () => {
  it('combina contexto y pregunta para compatibilidad legacy', () => {
    expect(
      buildChallengeDescription('Contexto del problema.', '¿Cómo lo resolvemos?')
    ).toBe('Contexto del problema.\n\n¿Cómo lo resolvemos?')
  })
})

describe('toChallengeCreatePayload', () => {
  it('incluye impacts y audiencia en el payload', () => {
    const payload = toChallengeCreatePayload(
      {
        ...baseForm(),
        audience_type: 'multiple_areas',
        audience_area_ids: ['a1', 'a2'],
      },
      'user-1'
    )
    expect(payload.created_by).toBe('user-1')
    expect(payload.impacts).toEqual(['quality', 'time'])
    expect(payload.audience_type).toBe('multiple_areas')
    expect(payload.audience_area_ids).toEqual(['a1', 'a2'])
    expect(payload.description).toContain('entregas incompletas')
  })
})

describe('challengeToFormValues', () => {
  it('usa organization como audiencia por defecto en registros históricos', () => {
    const values = challengeToFormValues({
      id: '1',
      title: 'Legacy',
      description: 'Descripción histórica',
      context: null,
      question: null,
      created_by: 'u1',
      area_id: null,
      strategic_pillar_id: null,
      success_criteria: null,
      audience_type: 'organization',
      audience_area_id: null,
      other_impact: null,
      status: 'finished',
      proposed_start_date: null,
      proposed_end_date: null,
      start_date: null,
      end_date: null,
      approved_by: null,
      approved_at: null,
      published_at: null,
      rejection_reason: null,
      result_summary: null,
      created_at: '',
      updated_at: '',
      effective_status: 'finished',
      metrics: { votes: 0, comments: 0, participants: 0 },
      voted_by_me: false,
      impacts: [],
      audience_area_ids: [],
    })
    expect(values.audience_type).toBe('organization')
    expect(values.context).toBe('Descripción histórica')
  })
})
