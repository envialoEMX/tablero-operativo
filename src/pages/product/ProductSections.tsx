import {
  BarChart3,
  CheckCircle2,
  Columns3,
  Mail,
  MessageCircle,
  Target,
  Users,
} from 'lucide-react'
import { AccionPriorityBadge } from '@/features/operations/components/AccionPriorityBadge'
import { useInView } from '@/hooks/useInView'
import { cn } from '@/lib/utils'
import {
  CtaTrustRow,
  DemoAdvisorCTA,
  Eyebrow,
  LandingCard,
  LandingSection,
  LandingShell,
  PrimaryCTA,
  SectionLead,
  SectionTitle,
} from './ProductUI'
import { CountUpInteger } from './CountUpValue'
import { PremiumCtaPanel } from './ProductVisual'
import { StatusToken } from './StatusToken'
import { LANDING_SEO } from './landingSeo'
import { LandingSectionSeo } from './LandingSeoHead'

function ChaosToOrderVisual() {
  const { ref, inView } = useInView(0.35)

  const chaosMessages = [
    {
      channel: 'WhatsApp',
      Icon: MessageCircle,
      tint: 'border-emerald-500/30 bg-emerald-500/[0.07]',
      rotate: '-rotate-2',
      offset: 'translate-x-1 -translate-y-1',
      text: '¿Ya validaron la propuesta con Finanzas?',
      meta: 'Hoy · 09:14',
    },
    {
      channel: 'Correo',
      Icon: Mail,
      tint: 'border-sky-500/30 bg-sky-500/[0.07]',
      rotate: 'rotate-1',
      offset: 'translate-x-3 translate-y-2',
      text: 'Fwd: pendiente de evidencia de cierre Q3…',
      meta: 'Ayer · 18:42',
    },
    {
      channel: 'Slack',
      Icon: MessageCircle,
      tint: 'border-violet-500/30 bg-violet-500/[0.07]',
      rotate: 'rotate-2',
      offset: '-translate-x-1 translate-y-4',
      text: '@ana ¿quién tiene el bloqueo de entrega?',
      meta: 'Hoy · 10:02',
    },
  ] as const

  return (
    <div ref={ref} className="relative mx-auto w-full max-w-md lg:mx-0">
      <div
        className={cn(
          'relative min-h-[280px] transition-all duration-700 ease-out',
          inView ? 'pointer-events-none scale-95 opacity-0' : 'scale-100 opacity-100'
        )}
        aria-hidden={inView}
      >
        {chaosMessages.map((msg, index) => (
          <div
            key={msg.channel}
            className={cn(
              'absolute left-0 right-0 rounded-xl border p-3 shadow-sm backdrop-blur-sm transition-all duration-500',
              msg.tint,
              msg.rotate,
              msg.offset,
              !inView && 'opacity-100'
            )}
            style={{ top: `${index * 4.25}rem`, zIndex: index + 1 }}
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              <msg.Icon className="h-3.5 w-3.5" />
              {msg.channel}
              <span className="ml-auto font-medium normal-case tracking-normal">{msg.meta}</span>
            </div>
            <p className="mt-2 text-sm font-medium leading-snug text-foreground">{msg.text}</p>
          </div>
        ))}
      </div>

      <div
        className={cn(
          'absolute inset-0 flex items-center transition-all duration-700 ease-out',
          inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        )}
      >
        <LandingCard className="w-full border-primary/25 p-0 shadow-md ring-1 ring-primary/10">
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-2.5">
            <StatusToken color="green" label="Acción visible" />
            <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">AC-1042</span>
          </div>
          <div className="space-y-3 p-4">
            <div className="flex items-start gap-2">
              <AccionPriorityBadge prioridad="Alta" compact className="mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-foreground">
                  Validar propuesta con Finanzas
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ana Martínez · Hoy 18:00 · Evidencia requerida
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
              <div className="rounded-lg border border-border/60 bg-muted/20 px-2 py-2">
                <p className="font-semibold text-foreground">Responsable</p>
                <p className="mt-0.5 text-muted-foreground">Asignado</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 px-2 py-2">
                <p className="font-semibold text-foreground">Fecha</p>
                <p className="mt-0.5 text-muted-foreground">Compromiso</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/20 px-2 py-2">
                <p className="font-semibold text-foreground">Estado</p>
                <p className="mt-0.5 text-muted-foreground">En seguimiento</p>
              </div>
            </div>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              De chat disperso → compromiso trazable
            </p>
          </div>
        </LandingCard>
      </div>
    </div>
  )
}

export function ProblemSection() {
  const items = [
    ['Información dispersa', 'Cada área trabaja con una versión distinta de lo que ocurre.', 'Se pierde contexto'],
    ['Compromisos ambiguos', 'Responsables, fechas y siguientes pasos no quedan claros.', 'Se retrasa la ejecución'],
    ['Decisiones tardías', 'Bloqueos y KPIs llegan cuando el problema ya escaló.', 'Aumenta el costo de reaccionar'],
  ]

  return (
    <LandingSection
      id="problema"
      surface="muted"
      spacing="standard"
      withGrid
      seoDescription={LANDING_SEO.sections.problema.description}
    >
      <LandingShell>
        <div className="mx-auto max-w-3xl text-center">
            <Eyebrow tokenColor="red">El costo de operar a ciegas</Eyebrow>
            <SectionTitle>Cuando cada área trabaja de forma distinta, la operación pierde coordinación.</SectionTitle>
            <SectionLead className="mx-auto">
              Cuando el seguimiento vive en chats, juntas y memoria, el equipo invierte más tiempo
              buscando información que resolviendo problemas.
            </SectionLead>
        </div>

        <LandingCard className="mx-auto mt-9 max-w-6xl p-5 shadow-md ring-1 ring-border/30 sm:p-7">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <div className="order-2 lg:order-1">
              <ChaosToOrderVisual />
            </div>
            <div className="order-1 lg:order-2">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Lo que parece falta de seguimiento termina afectando la ejecución
              </p>
              <ul className="grid gap-2.5 lg:grid-cols-1">
              {items.map(([title, copy, impact], index) => (
                <li key={title} className="flex gap-3 rounded-xl border border-border/50 bg-muted/20 p-3.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-red-500/10 text-[10px] font-bold tabular-nums text-red-600">
                    0{index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{copy}</p>
                    <p className="mt-1.5 text-[11px] font-semibold text-red-600">Impacto: {impact}</p>
                  </div>
                </li>
              ))}
              </ul>
              <div className="mt-5 rounded-xl border border-primary/20 bg-primary/[0.06] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Lo que cambia con SCRUMBAN
                </p>
                <p className="mt-2 text-sm font-semibold leading-relaxed text-foreground sm:text-base">
                  Una sola forma de comunicar, asignar, actualizar, desbloquear y medir convierte
                  el seguimiento en una capacidad de toda la organización.
                </p>
              </div>
            </div>
          </div>
        </LandingCard>
      </LandingShell>
    </LandingSection>
  )
}

const cultureBefore = [
  'Chats y solicitudes dispersas',
  'Juntas sin acuerdos trazables',
  'Responsables ambiguos',
  'KPIs manuales o tardíos',
]

const cultureAfter = [
  'Solicitudes centralizadas',
  'Compromisos visibles',
  'Responsables y fechas claras',
  'KPIs conectados a la ejecución',
]

export function CultureShiftSection() {
  return (
    <LandingSection
      id="cultura"
      surface="base"
      spacing="tight"
      seoDescription={LANDING_SEO.sections.cultura.description}
    >
      <LandingShell className="max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tokenColor="green">Cambio cultural</Eyebrow>
          <SectionTitle>De seguimiento informal a ejecución medible.</SectionTitle>
          <SectionLead className="mx-auto">
            SCRUMBAN instala una forma compartida de comunicar, comprometer, actualizar y medir.
          </SectionLead>
        </div>
        <div className="mt-9 grid overflow-hidden rounded-2xl border border-border/60 shadow-md md:grid-cols-2">
          <div className="bg-muted/35 p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Antes</p>
            <div className="mt-5 space-y-3">
              {cultureBefore.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-foreground p-6 text-background sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">Con SCRUMBAN</p>
            <div className="mt-5 space-y-3">
              {cultureAfter.map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-6 text-center text-base font-semibold text-foreground">
          Cuando todos ven lo mismo, el equipo comunica mejor y la operación aprende.
        </p>
      </LandingShell>
    </LandingSection>
  )
}

const comparisonRows = [
  ['Tarea', 'Solicitud con responsable'],
  ['Estado', 'Seguimiento y evidencia'],
  ['Vencimiento', 'Causa y trazabilidad'],
  ['Problema', 'Bloqueo y escalamiento'],
  ['Cierre', 'Verificación'],
  ['Actividad', 'Métricas de cumplimiento'],
]

export function ComparisonSection() {
  return (
    <LandingSection surface="base" spacing="tight">
      <LandingShell className="max-w-5xl">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tokenColor="blue">Por qué no es otro Kanban</Eyebrow>
          <SectionTitle>Un Kanban organiza tareas. SCRUMBAN gestiona compromisos.</SectionTitle>
        </div>
        <LandingCard className="mt-10 overflow-hidden shadow-md ring-1 ring-border/40">
          <div className="grid grid-cols-2 border-b border-border/50 bg-muted/30 px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
            <span>Kanban tradicional</span>
            <span className="text-primary">SCRUMBAN</span>
          </div>
          {comparisonRows.map(([left, right]) => (
            <div
              key={left}
              className="grid grid-cols-2 border-t border-border/40 px-5 py-3.5 text-sm transition-colors hover:bg-muted/40"
            >
              <span className="pr-4 text-muted-foreground">{left}</span>
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <CheckCircle2 className="hidden h-4 w-4 shrink-0 text-emerald-600 sm:block" />
                {right}
              </span>
            </div>
          ))}
        </LandingCard>
      </LandingShell>
    </LandingSection>
  )
}

export function MidPageCTA() {
  return (
    <section id="diagnostico" className="border-b border-border/60 bg-foreground py-8 text-background">
      <LandingSectionSeo description={LANDING_SEO.sections.diagnostico.description} />
      <LandingShell className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            Visibilidad aplicada a tu operación
          </p>
          <h2 className="mt-2 text-balance text-xl font-semibold sm:text-2xl">
            Descubre dónde estás perdiendo seguimiento hoy.
          </h2>
        </div>
        <PrimaryCTA dark className="shrink-0">
          Agendar diagnóstico
        </PrimaryCTA>
      </LandingShell>
    </section>
  )
}

const extraCapabilities = [
  { icon: MessageCircle, code: 'COM·001', title: 'Comunicación operativa', copy: 'Menos mensajes sueltos. Más contexto compartido.' },
  { icon: Users, code: 'MGT·002', title: 'Gestión de compromisos', copy: 'Cada pendiente tiene dueño, fecha y siguiente paso.' },
  { icon: Columns3, code: 'TRZ·003', title: 'Trazabilidad y evidencia', copy: 'Qué pasó, cuándo pasó y quién participó.' },
  { icon: BarChart3, code: 'KPI·004', title: 'KPIs operativos', copy: 'Mide cómo opera el equipo, no solo cuántas tareas mueve.' },
  { icon: Target, code: 'DIR·005', title: 'Dirección y decisiones', copy: 'Riesgos y prioridades visibles antes de que escalen.' },
] as const

export function MoreCapabilitiesSection() {
  return (
    <LandingSection
      id="capacidades"
      surface="muted"
      spacing="tight"
      withGrid
      seoDescription={LANDING_SEO.sections.capacidades.description}
    >
      <LandingShell className="max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tokenColor="green">Capacidades conectadas</Eyebrow>
          <SectionTitle>
            Un sistema operativo para comunicar, ejecutar, medir y mejorar.
          </SectionTitle>
          <SectionLead className="mx-auto">
            No son módulos aislados. Cada capacidad alimenta el mismo ciclo de ejecución.
          </SectionLead>
        </div>

        <div className="relative mt-9 -mx-3 sm:mx-0">
          <div
            className="flex gap-3 overflow-x-auto scroll-smooth px-3 pb-2 snap-x snap-mandatory md:grid md:grid-cols-2 md:overflow-visible md:snap-none md:px-0 lg:grid-cols-5"
            aria-label="Módulos del sistema"
          >
            {extraCapabilities.map((cap) => {
              const Icon = cap.icon
              return (
                <div
                  key={cap.code}
                  className="w-[260px] shrink-0 snap-start rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md md:w-auto"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="mt-4 min-w-0">
                    <p className="text-sm font-semibold leading-snug text-foreground">{cap.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{cap.copy}</p>
                    <p className="mt-3 text-[9px] font-semibold tabular-nums tracking-wide text-muted-foreground">
                      {cap.code}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </LandingShell>
    </LandingSection>
  )
}

const closeStats = [
  { value: 89, prefix: '', suffix: '%', label: 'ICO del periodo' },
  { value: 1, prefix: '< ', suffix: ' día', label: 'Para detectar un retraso crítico' },
  { value: 18, prefix: '', suffix: '', label: 'Acciones que requieren atención hoy' },
] as const

export function CloseSection() {
  return (
    <>
      <LandingSection
        id="cierre"
        surface="inverse"
        spacing="standard"
        reveal
        seoDescription={LANDING_SEO.sections.cierre.description}
      >
        <LandingShell className="max-w-6xl text-center">
          <div className="flex justify-center">
            <Eyebrow dark tokenColor="green">
              El resultado para Dirección
            </Eyebrow>
          </div>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-background sm:text-4xl lg:text-5xl">
            Una organización que comunica mejor,
            <br />
            <span className="text-primary">cumple, aprende y mejora.</span>
          </h2>
          <div className="mt-12 grid gap-10 border-t border-background/15 pt-10 sm:grid-cols-3 sm:gap-6">
            {closeStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold tabular-nums tracking-tight text-background sm:text-5xl">
                  {stat.prefix}
                  <CountUpInteger target={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-3 text-sm leading-relaxed text-background/65">{stat.label}</p>
              </div>
            ))}
          </div>
        </LandingShell>
      </LandingSection>

      <LandingSection surface="base" spacing="tight" reveal withGrid>
        <LandingShell className="max-w-4xl">
          <PremiumCtaPanel>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
              Disponible · Demo personalizada
            </p>
            <h2 className="mt-4 text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Tu operación ya genera información. Conviértela en cultura de ejecución.
            </h2>
            <SectionLead dark className="mx-auto mt-4 max-w-2xl text-emerald-50/75">
              Ayuda a tu equipo a comunicarse mejor, dar seguimiento con claridad y tomar
              decisiones con KPIs visibles.
            </SectionLead>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <PrimaryCTA dark glow className="bg-foreground text-background hover:bg-foreground/90" />
              <DemoAdvisorCTA className="border-white/20 bg-white text-foreground hover:bg-white/90" />
            </div>
            <CtaTrustRow
              dark
              className="mt-5 justify-center text-emerald-200/70"
              items={['Demo personalizada', 'Sin compromiso', 'Onboarding acompañado']}
            />
          </PremiumCtaPanel>
        </LandingShell>
      </LandingSection>
    </>
  )
}
