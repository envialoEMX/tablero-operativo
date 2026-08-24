import { useEffect, useState } from 'react'
import { useInView } from './useInView'

export function useCountUp(target: number, duration = 1200, threshold = 0.4) {
  const { ref, inView } = useInView(threshold)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])

  return { ref, value, inView }
}

/** Contador con un decimal (ej. 4.2 días). */
export function useCountUpDecimal(target: number, duration = 1200, threshold = 0.4) {
  const { ref, inView } = useInView(threshold)
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased * 10) / 10)
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [inView, target, duration])

  return { ref, value, inView }
}
