import type { IncomingMessage, ServerResponse } from 'node:http'

type DemoRequestBody = {
  name?: string
  email?: string
  company?: string
  teamSize?: string
  need?: string
}

type JsonResponse = {
  status(code: number): JsonResponse
  json(payload: unknown): void
}

type VercelRequestLike = IncomingMessage & {
  body?: unknown
  method?: string
}

const NEED_LABELS: Record<string, string> = {
  visibilidad: 'Visibilidad para dirección',
  seguimiento: 'Seguimiento de compromisos',
  indicadores: 'Indicadores / OKRs',
  comunicacion: 'Comunicación entre equipos',
}

const TEAM_LABELS: Record<string, string> = {
  '1-15': '1–15 personas',
  '16-50': '16–50 personas',
  '51-200': '51–200 personas',
  '200+': '200+ personas',
}

const VALID_TEAM = new Set(Object.keys(TEAM_LABELS))
const VALID_NEED = new Set(Object.keys(NEED_LABELS))

function parseBody(req: VercelRequestLike): DemoRequestBody {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body) as DemoRequestBody
    } catch {
      return {}
    }
  }
  if (req.body && typeof req.body === 'object') {
    return req.body as DemoRequestBody
  }
  return {}
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default async function handler(req: VercelRequestLike, res: ServerResponse & JsonResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = parseBody(req)
  const name = body.name?.trim() ?? ''
  const email = body.email?.trim() ?? ''
  const company = body.company?.trim() ?? ''
  const teamSize = body.teamSize ?? ''
  const need = body.need ?? ''

  if (!name || !email || !company || !VALID_TEAM.has(teamSize) || !VALID_NEED.has(need)) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' })
  }

  const text = [
    'Solicitud de demo SCRUMBAN',
    '',
    `Nombre: ${name}`,
    `Email: ${email}`,
    `Empresa: ${company}`,
    `Equipo: ${TEAM_LABELS[teamSize]}`,
    `Necesidad: ${NEED_LABELS[need]}`,
    '',
    `Enviado: ${new Date().toISOString()}`,
  ].join('\n')

  const resendKey = process.env.RESEND_API_KEY
  const to = process.env.DEMO_REQUEST_TO ?? 'demo@scrumban.mx'

  if (resendKey) {
    const from = process.env.DEMO_REQUEST_FROM ?? 'SCRUMBAN <onboarding@resend.dev>'
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: email,
        subject: `Demo SCRUMBAN — ${company}`,
        text,
      }),
    })

    if (!emailRes.ok) {
      console.error('[demo-request] Resend error:', await emailRes.text())
      return res.status(502).json({ error: 'No se pudo enviar la solicitud' })
    }
  } else {
    console.log('[demo-request]', text)
  }

  return res.status(200).json({ ok: true })
}
