/** Metadescripciones de la landing SCRUMBAN — fuente única para `<head>` y JSON-LD. */
export const LANDING_SEO = {
  siteName: 'SCRUMBAN',
  title: 'SCRUMBAN | Gestión operativa visible y medible',
  description:
    'SCRUMBAN centraliza compromisos operativos con responsables, KPIs y trazabilidad. Visibilidad para dirección sin perseguir pendientes por chat.',
  keywords:
    'gestión operativa, kanban, compromisos, KPIs, OKR, tablero operativo, scrumban, visibilidad dirección',
  path: '/producto',
  sections: {
    inicio: {
      id: 'inicio',
      name: 'Cultura de ejecución visible',
      description:
        'Construye una cultura de ejecución visible, medible y responsable. Convierte pendientes dispersos en compromisos con dueño, fecha y KPIs conectados.',
    },
    problema: {
      id: 'problema',
      name: 'El costo de operar a ciegas',
      description:
        'Información dispersa, compromisos ambiguos y decisiones tardías erosionan la coordinación. SCRUMBAN unifica comunicación, asignación y seguimiento.',
    },
    cultura: {
      id: 'cultura',
      name: 'De seguimiento informal a ejecución medible',
      description:
        'Pasa de chats y juntas sin trazabilidad a solicitudes centralizadas, responsables claros y KPIs ligados a la operación diaria.',
    },
    producto: {
      id: 'como-funciona',
      name: 'Producto en acción',
      description:
        'Cada solicitud se convierte en compromiso gestionable: kanban con estados, responsable, evidencia y trazabilidad hasta verificación.',
    },
    indicadores: {
      id: 'indicadores',
      name: 'Valor para Dirección',
      description:
        'Atención inmediata, ICO, tiempos de cierre y OKRs en un tablero ejecutivo. Detecta retrasos y riesgos antes de la junta de crisis.',
    },
    diagnostico: {
      id: 'diagnostico',
      name: 'Diagnóstico operativo',
      description:
        'Identifica dónde pierde seguimiento tu operación hoy. Agenda un diagnóstico personalizado con el equipo SCRUMBAN.',
    },
    ia: {
      id: 'ia',
      name: 'Asistente IA operativo',
      description:
        'Ante un bloqueo, el asistente valida contexto, evidencia de cierre y próximos pasos con el mismo flujo del tablero real.',
    },
    capacidades: {
      id: 'capacidades',
      name: 'Capacidades conectadas',
      description:
        'Comunicación operativa, gestión de compromisos, trazabilidad, KPIs y visibilidad para dirección en un solo sistema integrado.',
    },
    cierre: {
      id: 'cierre',
      name: 'Resultado para Dirección',
      description:
        'Saber qué ocurre en la operación sin preguntarlo: visibilidad en tiempo real, intervención oportuna y confiabilidad en los compromisos.',
    },
  },
} as const

export type LandingSectionSeoKey = keyof typeof LANDING_SEO.sections

export function getLandingCanonicalUrl(path = LANDING_SEO.path) {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ?? 'https://scrumbanemx.vercel.app'
  return `${base}${path}`
}

export function getLandingSectionUrl(sectionId: string) {
  return `${getLandingCanonicalUrl()}#${sectionId}`
}
