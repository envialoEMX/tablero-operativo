/**
 * Argumento ejecutivo: dolor vs resultado con SCRUMBAN.
 * Cifras de ejemplo — validar con negocio antes de publicar.
 */
export function ExecutiveCaseSplit() {
  return (
    <div className="grid overflow-hidden rounded-2xl border border-border/60 md:grid-cols-2">
      <div className="flex flex-col justify-center bg-muted/40 p-8 md:p-10">
        <span className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
          Sin visibilidad
        </span>
        <p className="mt-3 text-lg leading-relaxed text-foreground/90">
          Un compromiso lleva 6 días atrasado. Nadie te avisó porque nadie lo vio como riesgo — hasta
          que se convierte en el problema que explicas en el comité.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Te enteras en la junta. Reaccionas, no diriges.
        </p>
      </div>
      <div className="flex flex-col justify-center bg-foreground p-8 text-background md:p-10">
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-400">
          Con SCRUMBAN
        </span>
        <p className="mt-3 text-lg leading-relaxed">
          El mismo compromiso se marca en rojo el día 2. Tu tablero te lo muestra antes de que sea una
          junta de crisis.
        </p>
        <p className="mt-4 text-sm text-background/70">
          Intervienes a tiempo. Diriges, no reaccionas.
        </p>
      </div>
    </div>
  )
}
