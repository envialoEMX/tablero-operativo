import { Bell, CheckCircle2, Menu, Timer, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { SECTION_SPACING } from '@/lib/spacing'
import {
  CtaTrustRow,
  DemoWindow,
  Eyebrow,
  LandingShell,
  Logo,
  PrimaryCTA,
  SecondaryCTA,
  SectionLead,
} from './ProductUI'
import { LandingGridPattern, LandingOrbitRings } from './ProductVisual'
import { StatusToken, StatusTokenMark } from './StatusToken'

const nav = [
  ['Producto', '#producto'],
  ['Cómo funciona', '#como-funciona'],
  ['Indicadores', '#indicadores'],
  ['IA', '#ia'],
] as const

export function ProductNav() {
  const [open, setOpen] = useState(false)
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <LandingShell className="flex h-14 items-center justify-between sm:h-16">
        <div className="flex items-center gap-3">
          <Logo />
          <StatusTokenMark className="hidden opacity-50 sm:inline-flex" />
        </div>
        <nav className="hidden items-center gap-6 md:flex" aria-label="Navegación principal">
          {nav.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="hidden md:block">
          <PrimaryCTA className="h-10 min-h-10" glow />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-xl border-border/70 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </LandingShell>
      {open ? (
        <nav className="border-t border-border/50 bg-card p-4 md:hidden">
          {nav.map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block border-b border-border/40 py-3 text-sm font-semibold text-foreground"
            >
              {label}
            </a>
          ))}
          <div className="mt-4">
            <PrimaryCTA className="w-full" />
          </div>
        </nav>
      ) : null}
    </header>
  )
}

function HeroProduct() {
  const columns = [
    {
      name: 'HOY',
      dot: 'bg-primary',
      cards: [
        ['Validar propuesta comercial', 'AM', 'Alta'],
        ['Confirmar alcance con cliente', 'JR', 'Media'],
      ],
    },
    {
      name: 'EN SEGUIMIENTO',
      dot: 'bg-violet-500',
      cards: [
        ['Resolver bloqueo de entrega', 'LC', 'Crítica'],
        ['Actualizar indicadores', 'MP', 'Media'],
      ],
    },
    {
      name: 'POR VERIFICAR',
      dot: 'bg-emerald-500',
      cards: [['Evidencia de cierre Q3', 'AR', 'Alta']],
    },
  ]

  return (
    <div className="relative mx-auto w-full max-w-3xl lg:translate-x-4">
      <LandingOrbitRings className="-z-10 opacity-60" />
      <DemoWindow className="relative z-10 shadow-xl shadow-primary/5 ring-1 ring-border/50" title="Tablero operativo">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wider text-primary">
              Operación comercial
            </p>
            <p className="text-sm font-semibold text-foreground">Compromisos del equipo</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <i className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
            </span>
            <Button type="button" size="sm" className="h-7 rounded-lg px-2.5 text-[10px] font-semibold">
              + Acción
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 bg-muted/25 p-3 sm:gap-3 sm:p-4">
          {columns.map((col) => (
            <div key={col.name}>
              <div className="mb-2 flex items-center gap-1.5">
                <i className={cn('h-1.5 w-1.5 rounded-full', col.dot)} />
                <span className="text-[7px] font-semibold tracking-wider text-muted-foreground sm:text-[9px]">
                  {col.name}
                </span>
              </div>
              <div className="space-y-2">
                {col.cards.map(([title, owner, priority], i) => (
                  <div
                    key={title}
                    className={cn(
                      'rounded-xl border bg-card p-2 shadow-sm sm:p-3',
                      priority === 'Crítica'
                        ? 'border-l-2 border-border/60 border-l-destructive'
                        : 'border-border/60'
                    )}
                  >
                    <p className="line-clamp-2 text-[8px] font-semibold leading-snug text-foreground sm:text-[11px]">
                      {title}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-[7px] font-bold text-background">
                        {owner}
                      </span>
                      <span className="text-[7px] text-muted-foreground">{i + 12} Sep</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DemoWindow>

      {/* Mini métricas flotantes — 2 KPIs del dashboard */}
      <div className="absolute -bottom-10 -left-2 z-20 hidden w-[13.5rem] space-y-2 sm:block">
        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] text-muted-foreground">Confiabilidad (ICO)</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">89%</p>
            </div>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-[89%] rounded-full bg-emerald-500" />
          </div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/12 text-amber-700 dark:text-amber-300">
              <Timer className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[9px] text-muted-foreground">Tiempo prom. rojos</p>
              <p className="text-lg font-semibold tabular-nums text-foreground">
                4.2 <span className="text-xs font-medium text-muted-foreground">días</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-5 right-6 z-20 hidden items-center gap-2 rounded-full border border-border/60 bg-foreground px-3 py-2 text-background shadow-lg sm:flex">
        <UserRound className="h-3.5 w-3.5" />
        <span className="text-[9px] font-semibold">Ana actualizó una acción</span>
        <i className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
      </div>
    </div>
  )
}

export function ProductHero() {
  return (
    <>
      <ProductNav />
      <section
        id="inicio"
        className={cn(
          'relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/30',
          SECTION_SPACING.hero
        )}
      >
        <LandingGridPattern className="opacity-50" />
        <div
          className="pointer-events-none absolute right-6 top-24 hidden opacity-[0.12] lg:block"
          aria-hidden
        >
          <div className="flex flex-col gap-3">
            <StatusToken color="red" size="md" pulse={false} />
            <StatusToken color="yellow" size="md" pulse={false} />
            <StatusToken color="green" size="md" pulse={false} />
          </div>
        </div>
        <LandingShell>
          <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div className="relative overflow-hidden rounded-[1.75rem] border border-border/60 bg-gradient-to-br from-card via-card to-emerald-500/[0.04] p-5 shadow-lg sm:p-7">
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-primary/10 blur-3xl"
                aria-hidden
              />
              <div className="relative">
                <Eyebrow tokenColor="blue">Sistema de gestión operativa</Eyebrow>
                <h1 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                  Construye una cultura de ejecución{' '}
                  <span className="bg-gradient-to-r from-emerald-600 to-primary bg-clip-text text-transparent">
                    visible, medible y responsable.
                  </span>
                </h1>
                <SectionLead>
                  SCRUMBAN ayuda a equipos operativos a mejorar su comunicación, dar seguimiento
                  con trazabilidad, medir KPIs y convertir pendientes dispersos en compromisos claros.
                </SectionLead>
                <div className="mt-7">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <PrimaryCTA glow />
                    <SecondaryCTA href="#como-funciona">Ver cómo funciona</SecondaryCTA>
                  </div>
                  <CtaTrustRow />
                </div>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {['Responsables claros', 'Seguimiento trazable', 'KPIs visibles', 'Menos chats dispersos', 'Decisiones con datos'].map((chip) => (
                    <Badge
                      key={chip}
                      variant="outline"
                      className="rounded-full border-border/60 bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {chip}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <HeroProduct />
          </div>
        </LandingShell>
      </section>
    </>
  )
}
