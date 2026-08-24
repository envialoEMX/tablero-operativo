import { cn } from '@/lib/utils'

export type StatusColor = 'red' | 'yellow' | 'green' | 'blue'

interface StatusTokenProps {
  color?: StatusColor
  label?: string
  size?: 'sm' | 'md'
  /** Marca de agua sutil (nav / decoración). */
  watermark?: boolean
  className?: string
  pulse?: boolean
}

const COLOR_MAP: Record<StatusColor, string> = {
  red: 'bg-red-500',
  yellow: 'bg-amber-400',
  green: 'bg-emerald-500',
  blue: 'bg-blue-600',
}

/** Semáforo operativo — motivo visual recurrente de la landing SCRUMBAN. */
export function StatusToken({
  color = 'blue',
  label,
  size = 'sm',
  watermark = false,
  className,
  pulse = true,
}: StatusTokenProps) {
  const dimension = size === 'sm' ? 'h-2 w-2' : 'h-3 w-3'

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        watermark && 'pointer-events-none select-none opacity-40',
        className
      )}
    >
      <span
        className={cn(
          'shrink-0 rounded-full',
          dimension,
          COLOR_MAP[color],
          pulse && 'animate-pulse'
        )}
        aria-hidden
      />
      {label ? (
        <span
          className={cn(
            'text-[11px] font-semibold uppercase tracking-wider',
            watermark ? 'text-muted-foreground' : 'text-primary'
          )}
        >
          {label}
        </span>
      ) : null}
    </span>
  )
}

/** Trio semáforo como marca de agua (rojo · amarillo · verde). */
export function StatusTokenMark({ className }: { className?: string }) {
  return (
    <span
      className={cn('inline-flex items-center gap-1', className)}
      aria-hidden
      title="Semáforo operativo"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-red-500/70" />
      <span className="h-1.5 w-1.5 rounded-full bg-amber-400/70" />
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70" />
    </span>
  )
}
