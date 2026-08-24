import { useCallback, useEffect, useRef, useState } from 'react'

/** Resalta el índice del bloque más visible (scrollytelling). */
export function useScrollSpy(count: number, enabled = true, threshold = 0.45) {
  const [activeIndex, setActiveIndex] = useState(0)
  const elementsRef = useRef<(HTMLDivElement | null)[]>([])

  const setRef = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      elementsRef.current[index] = node
    },
    []
  )

  useEffect(() => {
    if (!enabled) return

    const elements = elementsRef.current.filter(Boolean) as HTMLDivElement[]
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!best) return
        const index = elements.indexOf(best.target as HTMLDivElement)
        if (index >= 0) setActiveIndex(index)
      },
      { threshold, rootMargin: '-15% 0px -25% 0px' }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [count, enabled, threshold])

  return { setRef, activeIndex }
}
