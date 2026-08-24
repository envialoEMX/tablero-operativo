import { useMemo, useState } from 'react'
import { AlertCircle, Lightbulb, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard, SectionCardBody } from '@/components/SectionCard'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/features/users/hooks/useCurrentUser'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useAreas } from '@/features/catalogs/hooks/useAreas'
import { ChallengeCard } from '../components/ChallengeCard'
import { ChallengeFormDialog } from '../components/ChallengeFormDialog'
import { useChallenges } from '../hooks/useChallenges'
import type { ChallengeFilter } from '../types'

const filters: Array<{ key: NonNullable<ChallengeFilter['status']>; label: string }> = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Activos' },
  { key: 'finished', label: 'Finalizados' },
  { key: 'mine', label: 'Mis Challenges' },
]

export function ChallengesPage() {
  const { data: currentUser } = useCurrentUser()
  const { data: users = [] } = useUsers({ activo: true })
  const { data: areas = [] } = useAreas({ activo: true })
  const [status, setStatus] = useState<NonNullable<ChallengeFilter['status']>>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: challenges = [], isLoading, isError, error, refetch } = useChallenges(
    { status },
    currentUser?.id
  )

  const userNames = useMemo(() => {
    const map: Record<string, string> = {}
    if (currentUser?.id) map[currentUser.id] = currentUser.nombre
    for (const user of users) map[user.id] = user.nombre
    return map
  }, [currentUser?.id, currentUser?.nombre, users])

  const areaNames = useMemo(() => {
    const map: Record<string, string> = {}
    for (const area of areas) map[area.id] = area.nombre
    return map
  }, [areas])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col space-y-6 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-6">
      <header className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
              Comunidad e innovacion
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Challenges
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Participa en los retos de mejora de la organizacion, comparte tu perspectiva y ayuda a construir mejores soluciones.
            </p>
          </div>
          <Button type="button" className="h-10 gap-1.5 shadow-sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Proponer Challenge
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatus(item.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                status === item.key
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-background/70 text-muted-foreground hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {isError ? (
        <SectionCard>
          <SectionCardBody className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" aria-hidden />
            <p className="text-sm font-semibold">No se pudieron cargar los Challenges.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Revisa permisos o conexion.'}
            </p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              Reintentar
            </Button>
          </SectionCardBody>
        </SectionCard>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-64 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      ) : challenges.length === 0 ? (
        <SectionCard>
          <SectionCardBody className="flex min-h-80 flex-col items-center justify-center gap-3 text-center">
            <Lightbulb className="h-10 w-10 text-muted-foreground/60" aria-hidden />
            <div>
              <p className="text-base font-semibold text-foreground">Aun no hay Challenges para este filtro</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Propone un reto concreto para abrir conversacion y validar si genera participacion.
              </p>
            </div>
            <Button type="button" onClick={() => setDialogOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" aria-hidden />
              Proponer Challenge
            </Button>
          </SectionCardBody>
        </SectionCard>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <Badge variant="secondary" className="tabular-nums">
              {challenges.length} challenge{challenges.length === 1 ? '' : 's'}
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {challenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                creatorName={userNames[challenge.created_by] ?? 'Usuario'}
                areaName={challenge.area_id ? areaNames[challenge.area_id] : null}
              />
            ))}
          </div>
        </>
      )}

      <ChallengeFormDialog
        open={dialogOpen}
        currentUserId={currentUser?.id}
        areas={areas}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
