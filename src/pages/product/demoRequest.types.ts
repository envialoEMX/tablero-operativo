import { z } from 'zod'

export const demoTeamSizeOptions = [
  { value: '1-15', label: '1–15 personas' },
  { value: '16-50', label: '16–50 personas' },
  { value: '51-200', label: '51–200 personas' },
  { value: '200+', label: '200+ personas' },
] as const

export const demoNeedOptions = [
  { value: 'visibilidad', label: 'Visibilidad para dirección' },
  { value: 'seguimiento', label: 'Seguimiento de compromisos' },
  { value: 'indicadores', label: 'Indicadores / OKRs' },
  { value: 'comunicacion', label: 'Comunicación entre equipos' },
] as const

export const demoRequestSchema = z.object({
  name: z.string().trim().min(2, 'Indica tu nombre'),
  email: z.string().trim().email('Email corporativo válido'),
  company: z.string().trim().min(2, 'Indica tu empresa'),
  teamSize: z.enum(['1-15', '16-50', '51-200', '200+']),
  need: z.enum(['visibilidad', 'seguimiento', 'indicadores', 'comunicacion']),
})

export type DemoRequestValues = z.infer<typeof demoRequestSchema>

export function demoNeedLabel(value: DemoRequestValues['need']) {
  return demoNeedOptions.find((option) => option.value === value)?.label ?? value
}

export function demoTeamSizeLabel(value: DemoRequestValues['teamSize']) {
  return demoTeamSizeOptions.find((option) => option.value === value)?.label ?? value
}

export function buildDemoMailto(values: DemoRequestValues) {
  const subject = encodeURIComponent(`Demo SCRUMBAN — ${values.company}`)
  const body = encodeURIComponent(
    [
      'Hola, me gustaría conocer SCRUMBAN.',
      '',
      `Nombre: ${values.name}`,
      `Email: ${values.email}`,
      `Empresa: ${values.company}`,
      `Tamaño del equipo: ${demoTeamSizeLabel(values.teamSize)}`,
      `Necesidad principal: ${demoNeedLabel(values.need)}`,
    ].join('\n')
  )
  return `mailto:demo@scrumban.mx?subject=${subject}&body=${body}`
}
