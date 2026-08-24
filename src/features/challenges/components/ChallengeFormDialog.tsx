import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Lightbulb, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Area } from '@/features/catalogs/types/catalogs.types'
import {
  useCreateChallenge,
  useUpdateChallenge,
} from '../hooks/useChallenges'
import type { ChallengeListItem } from '../types'

const NO_AREA = '__none__'
const TEXTAREA_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60'

type ChallengeFormDialogProps = {
  open: boolean
  challenge?: ChallengeListItem | null
  currentUserId?: string | null
  areas: Area[]
  adminMode?: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: (challengeId?: string) => void
}

export function ChallengeFormDialog({
  open,
  challenge = null,
  currentUserId,
  areas,
  adminMode,
  onOpenChange,
  onSaved,
}: ChallengeFormDialogProps) {
  const createChallenge = useCreateChallenge()
  const updateChallenge = useUpdateChallenge()
  const isEdit = Boolean(challenge)
  const [form, setForm] = useState({
    title: '',
    description: '',
    area_id: NO_AREA,
    proposed_start_date: '',
    proposed_end_date: '',
    start_date: '',
    end_date: '',
    result_summary: '',
  })

  useEffect(() => {
    if (!open) return
    setForm({
      title: challenge?.title ?? '',
      description: challenge?.description ?? '',
      area_id: challenge?.area_id ?? NO_AREA,
      proposed_start_date: challenge?.proposed_start_date ?? '',
      proposed_end_date: challenge?.proposed_end_date ?? '',
      start_date: challenge?.start_date ?? '',
      end_date: challenge?.end_date ?? '',
      result_summary: challenge?.result_summary ?? '',
    })
  }, [challenge, open])

  const isPending = createChallenge.isPending || updateChallenge.isPending
  const sortedAreas = useMemo(
    () => [...areas].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [areas]
  )

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const title = form.title.trim()
    const description = form.description.trim()
    const proposedEnd = form.proposed_end_date || form.end_date
    if (!title || title.length < 5) {
      toast.error('Agrega un titulo de al menos 5 caracteres.')
      return
    }
    if (title.length > 120) {
      toast.error('El titulo debe tener maximo 120 caracteres.')
      return
    }
    if (description.length < 20) {
      toast.error('La descripcion debe explicar el problema y contexto.')
      return
    }
    if (!isEdit && !proposedEnd) {
      toast.error('Agrega una fecha de cierre propuesta.')
      return
    }
    if (!currentUserId) {
      toast.error('No se pudo resolver tu usuario.')
      return
    }

    const common = {
      title,
      description,
      area_id: form.area_id === NO_AREA ? null : form.area_id,
      proposed_start_date: form.proposed_start_date || null,
      proposed_end_date: form.proposed_end_date || null,
      ...(adminMode
        ? {
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            result_summary: form.result_summary.trim() || null,
          }
        : {}),
    }

    try {
      if (challenge) {
        const saved = await updateChallenge.mutateAsync({ id: challenge.id, input: common })
        toast.success('Challenge actualizado')
        onSaved?.(saved.id)
      } else {
        const saved = await createChallenge.mutateAsync({
          ...common,
          created_by: currentUserId,
        })
        toast.success('Challenge enviado para aprobacion')
        onSaved?.(saved.id)
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el challenge.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" aria-hidden />
            {isEdit ? 'Editar Challenge' : 'Proponer Challenge'}
          </DialogTitle>
          <DialogDescription>
            Comparte un reto claro para que la organizacion pueda participar con votos y comentarios.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <Field label="Titulo" htmlFor="challenge-title" hint="Maximo 120 caracteres.">
            <Input
              id="challenge-title"
              value={form.title}
              onChange={(event) => setField('title', event.target.value)}
              maxLength={120}
              placeholder="Ej. Como reducimos el tiempo de respuesta al cliente"
            />
          </Field>

          <Field
            label="Descripcion"
            htmlFor="challenge-description"
            hint="Incluye problema, contexto y que buscas obtener de la participacion."
          >
            <textarea
              id="challenge-description"
              value={form.description}
              onChange={(event) => setField('description', event.target.value)}
              rows={6}
              className={TEXTAREA_CLASS}
              placeholder="Describe el reto, por que importa y que tipo de ideas o perspectiva necesitas del equipo."
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Area relacionada" htmlFor="challenge-area">
              <Select value={form.area_id} onValueChange={(value) => setField('area_id', value)}>
                <SelectTrigger id="challenge-area">
                  <SelectValue placeholder="Selecciona area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_AREA}>Sin area especifica</SelectItem>
                  {sortedAreas.map((area) => (
                    <SelectItem key={area.id} value={area.id}>
                      {area.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Inicio propuesto" htmlFor="challenge-proposed-start" hint="Opcional.">
              <Input
                id="challenge-proposed-start"
                type="date"
                value={form.proposed_start_date}
                onChange={(event) => setField('proposed_start_date', event.target.value)}
              />
            </Field>
            <Field label="Cierre propuesto" htmlFor="challenge-proposed-end">
              <Input
                id="challenge-proposed-end"
                type="date"
                value={form.proposed_end_date}
                onChange={(event) => setField('proposed_end_date', event.target.value)}
              />
            </Field>
          </div>

          {adminMode ? (
            <div className="grid gap-4 rounded-xl border border-border/60 bg-muted/20 p-4 sm:grid-cols-2">
              <Field label="Inicio publicado" htmlFor="challenge-start">
                <Input
                  id="challenge-start"
                  type="date"
                  value={form.start_date}
                  onChange={(event) => setField('start_date', event.target.value)}
                />
              </Field>
              <Field label="Cierre publicado" htmlFor="challenge-end">
                <Input
                  id="challenge-end"
                  type="date"
                  value={form.end_date}
                  onChange={(event) => setField('end_date', event.target.value)}
                />
              </Field>
              <Field label="Conclusion / Resultado" htmlFor="challenge-result" className="sm:col-span-2">
                <textarea
                  id="challenge-result"
                  value={form.result_summary}
                  onChange={(event) => setField('result_summary', event.target.value)}
                  rows={4}
                  className={cn(TEXTAREA_CLASS, 'bg-background')}
                  placeholder="Resultado o conclusion al cerrar el challenge."
                />
              </Field>
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="gap-1.5">
              <Send className="h-4 w-4" aria-hidden />
              {isEdit ? 'Guardar' : 'Enviar a aprobacion'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  )
}
