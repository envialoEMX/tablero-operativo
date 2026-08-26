import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { CalendarRange, Lightbulb, MapPin, Send, Target, Users } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { Area } from '@/features/catalogs/types/catalogs.types'
import {
  challengeToFormValues,
  toChallengeCreatePayload,
  toChallengeUpdatePayload,
  validateChallengeForm,
  type ChallengeFormValues,
} from '../challengeForm.utils'
import {
  CHALLENGE_SUCCESS_CRITERIA_EXAMPLES,
  CHALLENGE_SUCCESS_CRITERIA_HINT,
} from '../constants'
import { useCreateChallenge, useUpdateChallenge } from '../hooks/useChallenges'
import { useStrategicPillars } from '../hooks/useStrategicPillars'
import type { ChallengeAudienceType, ChallengeImpactType, ChallengeListItem } from '../types'
import { AudienceSelector } from './AudienceSelector'
import { ImpactChipSelector } from './ImpactChipSelector'

const NO_AREA = '__none__'
const NO_PILLAR = '__none__'
const TITLE_MAX = 120
const CONTEXT_MIN = 10
const QUESTION_MIN = 10

const TEXTAREA_CLASS =
  'min-h-[5.5rem] w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm leading-relaxed shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60'

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
  const { data: pillars = [] } = useStrategicPillars()
  const isEdit = Boolean(challenge)
  const [form, setForm] = useState<ChallengeFormValues>(() => challengeToFormValues(challenge))

  useEffect(() => {
    if (!open) return
    setForm(challengeToFormValues(challenge))
  }, [challenge, open])

  const isPending = createChallenge.isPending || updateChallenge.isPending
  const sortedAreas = useMemo(
    () => [...areas].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [areas]
  )

  const titleLength = form.title.length
  const contextLength = form.context.trim().length
  const questionLength = form.question.trim().length
  const showOtherImpact = form.impacts.includes('other')

  const setField = <K extends keyof ChallengeFormValues>(key: K, value: ChallengeFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const validation = validateChallengeForm(form)
    if (!validation.ok) {
      toast.error(validation.message)
      return
    }
    if (!currentUserId) {
      toast.error('No se pudo resolver tu usuario.')
      return
    }

    try {
      if (challenge) {
        const saved = await updateChallenge.mutateAsync({
          id: challenge.id,
          input: toChallengeUpdatePayload(form, { adminMode }),
        })
        toast.success('Challenge actualizado')
        onSaved?.(saved.id)
      } else {
        const saved = await createChallenge.mutateAsync(toChallengeCreatePayload(form, currentUserId))
        toast.success('Challenge enviado para aprobación')
        onSaved?.(saved.id)
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo guardar el challenge.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(92dvh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <div className="border-b border-border/60 bg-gradient-to-br from-muted/40 via-background to-primary/[0.05] px-5 py-4 sm:px-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Lightbulb className="h-4 w-4" aria-hidden />
              </span>
              {isEdit ? 'Editar Challenge' : 'Proponer Challenge'}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Define el problema, el impacto esperado y quién debería participar.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
            <FormSection
              title="Challenge"
              description="¿Qué queremos resolver?"
            >
              <Field
                label="Título"
                htmlFor="challenge-title"
                meta={
                  <span
                    className={cn(
                      'tabular-nums',
                      titleLength > TITLE_MAX - 15 ? 'text-amber-600' : 'text-muted-foreground'
                    )}
                  >
                    {titleLength}/{TITLE_MAX}
                  </span>
                }
              >
                <Input
                  id="challenge-title"
                  value={form.title}
                  onChange={(event) => setField('title', event.target.value)}
                  maxLength={TITLE_MAX}
                  className="h-10 rounded-lg"
                  placeholder="Ej. Entregas incompletas por documentación faltante"
                />
              </Field>

              <Field
                label="Contexto"
                htmlFor="challenge-context"
                meta={
                  <span
                    className={cn(
                      'tabular-nums',
                      contextLength >= CONTEXT_MIN ? 'text-emerald-600' : 'text-muted-foreground'
                    )}
                  >
                    {contextLength}/{CONTEXT_MIN} min.
                  </span>
                }
              >
                <textarea
                  id="challenge-context"
                  value={form.context}
                  onChange={(event) => setField('context', event.target.value)}
                  rows={3}
                  className={TEXTAREA_CLASS}
                  placeholder="Describe el problema y el contexto operativo."
                />
              </Field>

              <Field
                label="Pregunta del Challenge"
                htmlFor="challenge-question"
                meta={
                  <span
                    className={cn(
                      'tabular-nums',
                      questionLength >= QUESTION_MIN ? 'text-emerald-600' : 'text-muted-foreground'
                    )}
                  >
                    {questionLength}/{QUESTION_MIN} min.
                  </span>
                }
              >
                <textarea
                  id="challenge-question"
                  value={form.question}
                  onChange={(event) => setField('question', event.target.value)}
                  rows={2}
                  className={TEXTAREA_CLASS}
                  placeholder="Ej. ¿Cómo podemos reducir entregas incompletas por documentación faltante?"
                />
              </Field>
            </FormSection>

            <FormSection
              title="Impacto y alineación"
              description="¿Qué queremos mejorar y dónde se ubica el problema?"
              icon={Target}
            >
              <Field label="Impacto esperado" htmlFor="challenge-impacts">
                <ImpactChipSelector
                  value={form.impacts}
                  onChange={(impacts: ChallengeImpactType[]) => setField('impacts', impacts)}
                />
              </Field>

              {showOtherImpact ? (
                <Field label="Especifica el impacto" htmlFor="challenge-other-impact" required>
                  <Input
                    id="challenge-other-impact"
                    value={form.other_impact}
                    onChange={(event) => setField('other_impact', event.target.value)}
                    className="h-10 rounded-lg"
                    placeholder="Describe el impacto"
                  />
                </Field>
              ) : null}

              <Field label="Área relacionada" htmlFor="challenge-area" icon={MapPin} optional>
                <Select
                  value={form.area_id ?? NO_AREA}
                  onValueChange={(value) => setField('area_id', value === NO_AREA ? null : value)}
                >
                  <SelectTrigger id="challenge-area" className="h-10 rounded-lg">
                    <SelectValue placeholder="Selecciona área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_AREA}>Sin área específica</SelectItem>
                    {sortedAreas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Pilar estratégico" htmlFor="challenge-pillar" optional>
                <Select
                  value={form.strategic_pillar_id ?? NO_PILLAR}
                  onValueChange={(value) =>
                    setField('strategic_pillar_id', value === NO_PILLAR ? null : value)
                  }
                >
                  <SelectTrigger id="challenge-pillar" className="h-10 rounded-lg">
                    <SelectValue placeholder="Sin pilar asociado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_PILLAR}>Sin pilar asociado</SelectItem>
                    {pillars.map((pillar) => (
                      <SelectItem key={pillar.id} value={pillar.id}>
                        {pillar.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </FormSection>

            <FormSection
              title="Participación"
              description="¿Quién debería ver y participar?"
              icon={Users}
            >
              <AudienceSelector
                audienceType={form.audience_type}
                audienceAreaId={form.audience_area_id}
                audienceAreaIds={form.audience_area_ids}
                areas={areas}
                onAudienceTypeChange={(value: ChallengeAudienceType) => {
                  setField('audience_type', value)
                  if (value !== 'single_area') setField('audience_area_id', null)
                  if (value !== 'multiple_areas') setField('audience_area_ids', [])
                }}
                onSingleAreaChange={(areaId) => setField('audience_area_id', areaId)}
                onMultipleAreasChange={(areaIds) => setField('audience_area_ids', areaIds)}
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Inicio propuesto" htmlFor="challenge-proposed-start" required={!adminMode}>
                  <Input
                    id="challenge-proposed-start"
                    type="date"
                    value={form.proposed_start_date}
                    onChange={(event) => setField('proposed_start_date', event.target.value)}
                    className="h-10 rounded-lg"
                  />
                </Field>
                <Field label="Cierre propuesto" htmlFor="challenge-proposed-end" required={!adminMode}>
                  <Input
                    id="challenge-proposed-end"
                    type="date"
                    value={form.proposed_end_date}
                    onChange={(event) => setField('proposed_end_date', event.target.value)}
                    className="h-10 rounded-lg"
                    required={!isEdit && !adminMode}
                  />
                </Field>
              </div>
            </FormSection>

            <FormSection
              title="Resultado"
              description="¿Cómo sabremos si funcionó?"
              icon={CalendarRange}
            >
              <Field label="Criterio de éxito" htmlFor="challenge-success" optional>
                <textarea
                  id="challenge-success"
                  value={form.success_criteria}
                  onChange={(event) => setField('success_criteria', event.target.value)}
                  rows={2}
                  className={TEXTAREA_CLASS}
                  placeholder="Ej. Reducir 20% el tiempo de liberación de evidencias."
                />
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {CHALLENGE_SUCCESS_CRITERIA_HINT}{' '}
                  {CHALLENGE_SUCCESS_CRITERIA_EXAMPLES.slice(0, 2).join(' ')}
                </p>
              </Field>
            </FormSection>

            {adminMode ? (
              <FormSection title="Publicación" description="Fechas oficiales y cierre del reto.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Inicio publicado" htmlFor="challenge-start">
                    <Input
                      id="challenge-start"
                      type="date"
                      value={form.start_date}
                      onChange={(event) => setField('start_date', event.target.value)}
                      className="h-10 rounded-lg bg-background"
                    />
                  </Field>
                  <Field label="Cierre publicado" htmlFor="challenge-end">
                    <Input
                      id="challenge-end"
                      type="date"
                      value={form.end_date}
                      onChange={(event) => setField('end_date', event.target.value)}
                      className="h-10 rounded-lg bg-background"
                    />
                  </Field>
                </div>
                <Field label="Conclusión / Resultado" htmlFor="challenge-result">
                  <textarea
                    id="challenge-result"
                    value={form.result_summary}
                    onChange={(event) => setField('result_summary', event.target.value)}
                    rows={3}
                    className={cn(TEXTAREA_CLASS, 'min-h-[5rem] bg-background')}
                    placeholder="Resultado o conclusión al cerrar el challenge."
                  />
                </Field>
              </FormSection>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border/60 bg-muted/20 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button type="button" variant="outline" className="h-10 rounded-lg" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="h-10 gap-1.5 rounded-lg px-5">
              <Send className="h-4 w-4" aria-hidden />
              {isEdit ? 'Guardar cambios' : 'Enviar para aprobación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon?: typeof CalendarRange
  children: ReactNode
}) {
  return (
    <section className="space-y-3 rounded-xl border border-border/50 bg-card/50 p-4">
      <div className="flex items-start gap-2.5">
        {Icon ? (
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        ) : null}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Field({
  label,
  htmlFor,
  meta,
  optional,
  required,
  icon: Icon,
  children,
}: {
  label: string
  htmlFor: string
  meta?: ReactNode
  optional?: boolean
  required?: boolean
  icon?: typeof MapPin
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden /> : null}
          <Label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
            {optional ? (
              <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground/80">
                (opcional)
              </span>
            ) : null}
            {required ? <span className="ml-0.5 text-destructive">*</span> : null}
          </Label>
        </div>
        {meta ? <span className="shrink-0 text-[11px]">{meta}</span> : null}
      </div>
      {children}
    </div>
  )
}
