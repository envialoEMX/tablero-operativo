import { AIDemo, DashboardDemo, ProductInAction } from './ProductDemos'
import { DemoRequestProvider } from './DemoRequestContext'
import { LandingSeoHead } from './LandingSeoHead'
import { CloseSection, CultureShiftSection, MidPageCTA, MoreCapabilitiesSection, ProblemSection } from './ProductSections'
import { ProductHero } from './ProductHero'
import { LandingShell, Logo } from './ProductUI'

export function ProductLandingPage() {
  return (
    <DemoRequestProvider>
      <LandingSeoHead />
      <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/20">
        <ProductHero />
        <main className="overflow-x-hidden">
          <ProblemSection />
          <CultureShiftSection />
          <ProductInAction />
          <DashboardDemo />
          <MidPageCTA />
          <AIDemo />
          <MoreCapabilitiesSection />
          <CloseSection />
        </main>
        <footer className="border-t border-border/60 bg-foreground py-8 text-background">
          <LandingShell className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <Logo light />
            <p className="text-xs text-background/60">
              Gestión operativa visible, medible y verificable.
            </p>
            <a
              href="/login"
              className="text-xs font-semibold text-background/70 transition-colors hover:text-background"
            >
              Iniciar sesión
            </a>
          </LandingShell>
        </footer>
      </div>
    </DemoRequestProvider>
  )
}
