import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DemoRequestDialog } from './DemoRequestDialog'

type DemoRequestContextValue = {
  openDemoRequest: () => void
}

const DemoRequestContext = createContext<DemoRequestContextValue | null>(null)

export function DemoRequestProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const openDemoRequest = useCallback(() => setOpen(true), [])

  const value = useMemo(() => ({ openDemoRequest }), [openDemoRequest])

  return (
    <DemoRequestContext.Provider value={value}>
      {children}
      <DemoRequestDialog open={open} onOpenChange={setOpen} />
    </DemoRequestContext.Provider>
  )
}

export function useDemoRequest() {
  const context = useContext(DemoRequestContext)
  if (!context) {
    throw new Error('useDemoRequest debe usarse dentro de DemoRequestProvider')
  }
  return context
}
