import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Rejilla sutil de fondo (producto vivo, estilo SaaS premium). */
export function LandingGridPattern({ className }: { className?: string }) {
  return (
    <div
      className={cn('pointer-events-none absolute inset-0', className)}
      style={{
        backgroundImage: `
          linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px),
          linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse 85% 70% at 50% 40%, black 20%, transparent 75%)',
      }}
      aria-hidden
    />
  )
}

/** Anillos orbitales decorativos (hub de módulos). */
export function LandingOrbitRings({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 flex items-center justify-center', className)} aria-hidden>
      <div className="h-[min(520px,90vw)] w-[min(520px,90vw)] rounded-full border border-primary/10" />
      <div className="absolute h-[min(380px,70vw)] w-[min(380px,70vw)] rounded-full border border-primary/15" />
      <div className="absolute h-[min(240px,50vw)] w-[min(240px,50vw)] rounded-full border border-dashed border-primary/20" />
    </div>
  )
}

/** Etiqueta técnica de módulo (OPS·KPI·001). */
export function ModuleMetaBadge({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-md border border-emerald-500/25 bg-emerald-500/[0.07] px-2 py-0.5',
        'text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-300',
        className
      )}
    >
      {code}
    </span>
  )
}

/** Núcleo operativo SCRUMBAN (motivo tipo “elemento” anclado al semáforo). */
export function OperationalCoreBadge({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative flex aspect-square w-28 flex-col items-center justify-center rounded-2xl',
        'border border-emerald-500/30 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white shadow-lg shadow-emerald-900/25',
        className
      )}
    >
      <span className="absolute left-2.5 top-2.5 text-[10px] font-bold opacity-80">OPS</span>
      <span className="text-3xl font-black tracking-tight">SB</span>
      <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.2em] opacity-90">
        SCRUMBAN
      </span>
      <span className="absolute bottom-2.5 flex gap-1">
        <i className="h-1.5 w-1.5 rounded-full bg-red-400" />
        <i className="h-1.5 w-1.5 rounded-full bg-amber-300" />
        <i className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
      </span>
    </div>
  )
}

export function ModuleFeatureCard({
  icon: Icon,
  code,
  title,
  description,
  footer,
  className,
}: {
  icon: LucideIcon
  code: string
  title: string
  description: string
  footer?: ReactNode
  className?: string
}) {
  return (
    <article
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border border-emerald-500/20 bg-card p-5',
        'shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-emerald-500/35 hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <ModuleMetaBadge code={code} />
      </div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      {footer ? <div className="mt-4 border-t border-border/50 pt-4">{footer}</div> : null}
    </article>
  )
}

/** Pills de etapas de flujo (Kanban / pipeline). */
export function WorkflowStagePills({
  stages,
}: {
  stages: readonly { step: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {stages.map((stage) => (
        <span
          key={stage.step}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] px-2 py-1 text-[10px] font-semibold text-foreground"
        >
          <span className="text-emerald-600 dark:text-emerald-400">{stage.step}</span>
          {stage.label}
        </span>
      ))}
    </div>
  )
}

/** Panel CTA premium (gradiente oscuro, estilo referencia Nexo). */
export function PremiumCtaPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[1.75rem] border border-emerald-800/40 sm:rounded-[2rem]',
        'bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-950',
        'px-6 py-12 text-center shadow-2xl shadow-emerald-950/30 sm:px-10 sm:py-14',
        className
      )}
    >
      <LandingGridPattern className="opacity-[0.18]" />
      <div
        className="pointer-events-none absolute -left-20 top-0 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-teal-400/10 blur-3xl"
        aria-hidden
      />
      <div className="relative">{children}</div>
    </div>
  )
}

/** Badge de estado en listas (ROJO / BLOQUEADO / EN CURSO). */
export function StatusPill({
  tone,
  children,
}: {
  tone: 'red' | 'amber' | 'green' | 'neutral'
  children: ReactNode
}) {
  const tones = {
    red: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-200',
    amber: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200',
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
    neutral: 'border-border/60 bg-muted/50 text-muted-foreground',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        tones[tone]
      )}
    >
      {children}
    </span>
  )
}
