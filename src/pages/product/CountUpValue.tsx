import { cn } from '@/lib/utils'
import { useCountUp, useCountUpDecimal } from '@/hooks/useCountUp'

export function CountUpInteger({
  target,
  suffix = '',
  className,
}: {
  target: number
  suffix?: string
  className?: string
}) {
  const { ref, value } = useCountUp(target)
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {value}
      {suffix}
    </span>
  )
}

export function CountUpDecimal({
  target,
  suffix = '',
  className,
}: {
  target: number
  suffix?: string
  className?: string
}) {
  const { ref, value } = useCountUpDecimal(target)
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      {value.toFixed(1)}
      {suffix}
    </span>
  )
}
