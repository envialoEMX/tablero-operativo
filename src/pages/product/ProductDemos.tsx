/**
 * Demos locales de la landing.
 * Todo el estado vive en memoria del componente: no llama servicios, no escribe
 * en Supabase, no toca el Kanban real ni guarda en localStorage/sessionStorage.
 */
import { useState, type FormEvent } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  AlertTriangle,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Clock,
  FileCheck,
  Filter,
  GripVertical,
  ListChecks,
  MoreVertical,
  PlayCircle,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SectionCard, SectionCardBody, SectionCardHeader } from '@/components/SectionCard'
import { AccionFormBlock } from '@/features/operations/components/form/AccionFormBlock'
import { AccionFormField } from '@/features/operations/components/AccionFormSection'
import { AccionPriorityBadge } from '@/features/operations/components/AccionPriorityBadge'
import { cn } from '@/lib/utils'
import { useCountUp } from '@/hooks/useCountUp'
import { CountUpDecimal, CountUpInteger } from './CountUpValue'
import {
  Eyebrow,
  LandingCard,
  LandingSection,
  LandingShell,
  SectionLead,
  SectionTitle,
} from './ProductUI'
import { ModuleMetaBadge, StatusPill } from './ProductVisual'
import { LANDING_SEO } from './landingSeo'

const owners = ['Ana Martínez', 'Juan Reyes', 'Laura Cruz'] as const
const priorities = [
  { value: 'Alta', dot: 'bg-destructive' },
  { value: 'Media', dot: 'bg-amber-500' },
  { value: 'Baja', dot: 'bg-emerald-500' },
] as const
const validations = ['Correo de validación', 'Evidencia adjunta', 'Checklist completo'] as const

type ColumnId = 'asignado' | 'seguimiento' | 'retraso' | 'hecho' | 'verificado'

type DemoCard = {
  id: string
  publicId: string
  title: string
  description: string
  owner: string
  ownerName: string
  date: string
  priority: 'Alta' | 'Media' | 'Baja'
  column: ColumnId
  validation: string
  checklist: { total: number; completed: number }
  ageLabel: string
}

const initialCards: DemoCard[] = [
  {
    id: '1',
    publicId: 'AC-1042',
    title: 'Validar propuesta con Finanzas',
    description:
      'Revisar condiciones comerciales y obtener validación formal de Finanzas antes de enviar al cliente.',
    owner: 'AM',
    ownerName: 'Ana Martínez',
    date: 'Hoy',
    priority: 'Alta',
    column: 'asignado',
    validation: 'Correo de validación',
    checklist: { total: 3, completed: 1 },
    ageLabel: 'Abierta hace 2 días',
  },
  {
    id: '2',
    publicId: 'AC-1048',
    title: 'Actualizar política de devoluciones',
    description:
      'Alinear la política con operaciones y publicar la versión vigente para el equipo comercial.',
    owner: 'JR',
    ownerName: 'Juan Reyes',
    date: '19 sep',
    priority: 'Media',
    column: 'asignado',
    validation: 'Checklist completo',
    checklist: { total: 2, completed: 0 },
    ageLabel: 'Abierta hace 1 día',
  },
  {
    id: '3',
    publicId: 'AC-1051',
    title: 'Revisar evidencia de entrega',
    description:
      'Confirmar que la evidencia adjunta cubre el criterio de cierre y deja trazabilidad del compromiso.',
    owner: 'LC',
    ownerName: 'Laura Cruz',
    date: '20 sep',
    priority: 'Baja',
    column: 'seguimiento',
    validation: 'Evidencia adjunta',
    checklist: { total: 4, completed: 2 },
    ageLabel: 'Abierta hace 3 días',
  },
  {
    id: '4',
    publicId: 'AC-1055',
    title: 'Confirmar cierre con cliente',
    description:
      'Validar aceptación del cliente y dejar registro de la confirmación para mover a verificado.',
    owner: 'MP',
    ownerName: 'Mario Pérez',
    date: '21 sep',
    priority: 'Media',
    column: 'hecho',
    validation: 'Correo de validación',
    checklist: { total: 2, completed: 2 },
    ageLabel: 'Abierta hace 4 días',
  },
  {
    id: '5',
    publicId: 'AC-1038',
    title: 'Renovar contrato con proveedor',
    description:
      'Fecha límite vencida; escalar con legal y obtener firma antes del cierre del mes.',
    owner: 'JR',
    ownerName: 'Juan Reyes',
    date: 'Vencida',
    priority: 'Alta',
    column: 'retraso',
    validation: 'Correo de validación',
    checklist: { total: 3, completed: 1 },
    ageLabel: 'Abierta hace 6 días',
  },
  {
    id: '6',
    publicId: 'AC-1031',
    title: 'Publicar reporte mensual',
    description:
      'Reporte operativo cerrado y verificado con evidencia adjunta en el tablero.',
    owner: 'LC',
    ownerName: 'Laura Cruz',
    date: '18 sep',
    priority: 'Baja',
    column: 'verificado',
    validation: 'Evidencia adjunta',
    checklist: { total: 2, completed: 2 },
    ageLabel: 'Cerrada hace 2 días',
  },
]

const columns: Array<{
  id: ColumnId
  title: string
  estadoLabel: string
  Icon: typeof Clock
  border: string
  bg: string
  iconClass: string
}> = [
  {
    id: 'asignado',
    title: 'Pendiente',
    estadoLabel: 'Pendiente',
    Icon: Clock,
    border: 'border-l-slate-400',
    bg: 'bg-slate-500/5',
    iconClass: 'text-slate-500',
  },
  {
    id: 'seguimiento',
    title: 'En ejecución',
    estadoLabel: 'En ejecución',
    Icon: PlayCircle,
    border: 'border-l-blue-400',
    bg: 'bg-blue-500/5',
    iconClass: 'text-blue-600',
  },
  {
    id: 'retraso',
    title: 'Retraso',
    estadoLabel: 'Retraso',
    Icon: AlertTriangle,
    border: 'border-l-orange-500',
    bg: 'bg-orange-500/5',
    iconClass: 'text-orange-600',
  },
  {
    id: 'hecho',
    title: 'Hecho',
    estadoLabel: 'Hecho',
    Icon: CheckCircle2,
    border: 'border-l-emerald-400',
    bg: 'bg-emerald-500/5',
    iconClass: 'text-emerald-600',
  },
  {
    id: 'verificado',
    title: 'Verificado',
    estadoLabel: 'Verificado',
    Icon: BadgeCheck,
    border: 'border-l-violet-400',
    bg: 'bg-violet-500/5',
    iconClass: 'text-violet-600',
  },
]

const estadoBadgeClass: Record<ColumnId, string> = {
  asignado: 'bg-slate-500/15 text-slate-800 dark:text-slate-200',
  seguimiento: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
  retraso: 'bg-orange-500/15 text-orange-800 dark:text-orange-200',
  hecho: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
  verificado: 'bg-violet-500/15 text-violet-800 dark:text-violet-200',
}

function DemoReadonlyValue({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 min-h-5 whitespace-pre-wrap break-words text-sm font-medium text-foreground">
        {value || <span className="text-muted-foreground">Sin dato</span>}
      </div>
    </div>
  )
}

const inputBase =
  'rounded-md border-input bg-background shadow-sm focus-visible:ring-1 focus-visible:ring-ring'

function formatDemoDueLabel(fecha: string, hora: string): string {
  if (!fecha) return hora || 'Sin fecha'
  const date = new Date(`${fecha}T12:00:00`)
  if (Number.isNaN(date.getTime())) return `${fecha} · ${hora}`
  const day = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  return `${day} · ${hora}`
}

function DemoCreateAccionForm({
  onCreate,
  created,
}: {
  created: boolean
  onCreate: (input: {
    title: string
    description: string
    ownerName: string
    priority: DemoCard['priority']
    dateLabel: string
    validation: string
  }) => void
}) {
  const [title, setTitle] = useState('Confirmar alcance y fecha de entrega con el cliente')
  const [description, setDescription] = useState(
    'Definir alcance, fecha compromiso y evidencia de validación con el cliente para cerrar sin ambigüedad.'
  )
  const [owner, setOwner] = useState<string>(owners[0])
  const [priority, setPriority] = useState<DemoCard['priority']>('Alta')
  const [fecha, setFecha] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 2)
    return d.toISOString().slice(0, 10)
  })
  const [hora, setHora] = useState('18:00')
  const [requiereEvidencia, setRequiereEvidencia] = useState(true)
  const [validation, setValidation] = useState<string>(validations[0])
  const [blocksOpen, setBlocksOpen] = useState({ principal: false, validacion: false })

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onCreate({
      title: title.trim() || 'Acción demo',
      description: description.trim(),
      ownerName: owner,
      priority,
      dateLabel: formatDemoDueLabel(fecha, hora),
      validation: requiereEvidencia ? validation : 'No requiere evidencia',
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-0 flex-col overflow-hidden"
      data-accion-form-mode="create"
    >
      <div className="shrink-0 border-b border-border/60 bg-card px-3 py-2.5 sm:px-4 sm:py-3">
        <h2 className="text-sm font-semibold leading-tight tracking-tight sm:text-base">Nueva acción</h2>
        <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
          Completa los datos para crear la acción
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain px-3 py-3 sm:space-y-4 sm:px-5 sm:py-4">
        <AccionFormBlock
          blockId="demo-block-principal"
          step={1}
          title="Información principal"
          subtitle="¿Qué se hará, quién lo hará y para cuándo?"
          icon={CalendarClock}
          expanded={blocksOpen.principal}
          onToggle={() => setBlocksOpen((b) => ({ ...b, principal: !b.principal }))}
          collapsedSummary={title}
        >
          <fieldset className="space-y-4">
            <AccionFormField label="Título de la acción" htmlFor="demo-titulo" required>
              <Input
                id="demo-titulo"
                value={title}
                maxLength={70}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej: Revisar informe mensual"
                className={cn(inputBase, 'h-10')}
              />
              <p className="text-xs text-muted-foreground">{title.length}/70</p>
            </AccionFormField>

            <AccionFormField label="Descripción" htmlFor="demo-descripcion" required>
              <textarea
                id="demo-descripcion"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={3}
                placeholder="Describe la acción: qué implica, qué buscas lograr y para qué."
                className={cn(
                  inputBase,
                  'flex min-h-[88px] w-full resize-y rounded-md border px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring'
                )}
              />
            </AccionFormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:items-start">
              <AccionFormField
                label="Responsable de ejecutar"
                htmlFor="demo-responsable"
                hint="Persona que ejecuta y cierra la acción."
                hintAsIcon
                required
              >
                <Select value={owner} onValueChange={setOwner}>
                  <SelectTrigger id="demo-responsable" className={cn(inputBase, 'h-10')}>
                    <SelectValue placeholder="Seleccionar responsable" />
                  </SelectTrigger>
                  <SelectContent>
                    {owners.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </AccionFormField>

              <AccionFormField
                label="Prioridad"
                htmlFor="demo-prioridad"
                hint="Urgencia según el catálogo O2C."
                hintAsIcon
                required
              >
                <div className="flex flex-wrap gap-2" id="demo-prioridad">
                  {priorities.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value)}
                      className={cn(
                        'rounded-md transition',
                        priority === item.value && 'ring-2 ring-primary/25'
                      )}
                    >
                      <AccionPriorityBadge
                        prioridad={item.value}
                        className={priority === item.value ? 'shadow-sm' : undefined}
                      />
                    </button>
                  ))}
                </div>
              </AccionFormField>
            </div>

            <AccionFormField label="Fecha y hora límite" htmlFor="demo-fecha" required>
              <div className="grid gap-2 min-[380px]:grid-cols-[minmax(0,1fr)_8.5rem]">
                <Input
                  id="demo-fecha"
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className={cn(inputBase, 'h-10')}
                />
                <Input
                  id="demo-hora"
                  type="time"
                  value={hora}
                  step={60}
                  onChange={(event) => setHora(event.target.value)}
                  className={cn(inputBase, 'h-10')}
                />
              </div>
            </AccionFormField>
          </fieldset>
        </AccionFormBlock>

        <AccionFormBlock
          blockId="demo-block-validacion"
          step={2}
          title="Evidencia y validación"
          subtitle="Opcional: define evidencia solo si hace falta comprobar el cierre."
          icon={FileCheck}
          expanded={blocksOpen.validacion}
          onToggle={() => setBlocksOpen((b) => ({ ...b, validacion: !b.validacion }))}
        >
          <label
            htmlFor="demo-requiere-evidencia"
            className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
          >
            <input
              id="demo-requiere-evidencia"
              type="checkbox"
              checked={requiereEvidencia}
              onChange={(event) => setRequiereEvidencia(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary focus:ring-2 focus:ring-ring focus:ring-offset-1"
            />
            <span className="min-w-0 space-y-0.5">
              <span className="block text-sm font-medium text-foreground">Requiere evidencia</span>
              <span className="block text-xs text-muted-foreground">
                Actívalo solo si el cierre debe comprobarse con un tipo de evidencia.
              </span>
            </span>
          </label>

          {requiereEvidencia ? (
            <AccionFormField
              label="¿Qué evidencia comprobará que se hizo?"
              htmlFor="demo-evidencia"
              required
            >
              <Select value={validation} onValueChange={setValidation}>
                <SelectTrigger id="demo-evidencia" className={cn(inputBase, 'h-10')}>
                  <SelectValue placeholder="Seleccionar evidencia" />
                </SelectTrigger>
                <SelectContent>
                  {validations.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </AccionFormField>
          ) : null}
        </AccionFormBlock>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border/70 bg-card/95 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-4">
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span
            className={cn(
              'text-xs font-semibold',
              created ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'
            )}
          >
            {created
              ? '✓ Solo en esta demo · No se guardó nada'
              : 'Interactiva · No crea acciones reales'}
          </span>
          <div className="flex items-center gap-2">
            <Button type="submit" className="h-10 rounded-lg px-4 font-semibold">
              Crear acción
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}

function KanbanCardFace({ card }: { card: DemoCard }) {
  return (
    <div className="scale-[1.02] cursor-grabbing rounded-xl border border-border/60 bg-card p-3 text-left shadow-xl ring-2 ring-primary/15">
      <div className="flex items-start gap-2 pr-1">
        <AccionPriorityBadge prioridad={card.priority} compact className="mt-0.5 max-w-[6.5rem] shrink-0" />
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{card.title}</p>
      </div>
      <p className="mt-1 truncate pl-[18px] text-xs text-muted-foreground">{card.ownerName}</p>
    </div>
  )
}

function DraggableCard({
  card,
  onOpen,
}: {
  card: DemoCard
  onOpen: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: { column: card.column },
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group transition-all duration-200 ease-out',
        isDragging ? 'z-20 opacity-30' : 'opacity-100'
      )}
    >
      <div className="flex items-start gap-0.5">
        <button
          type="button"
          className="mt-3 shrink-0 cursor-grab touch-none rounded-md p-0.5 text-muted-foreground hover:bg-muted/60 active:cursor-grabbing"
          aria-label="Arrastrar acción"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'rounded-xl border border-border/60 bg-card p-3 shadow-sm',
              'transition-all duration-200 hover:border-border hover:shadow-md'
            )}
          >
            <div className="flex items-start gap-1.5">
              <button
                type="button"
                onClick={() => onOpen(card.id)}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-start gap-2 pr-1">
                  <AccionPriorityBadge
                    prioridad={card.priority}
                    compact
                    className="mt-0.5 max-w-[6.5rem] shrink-0"
                  />
                  <p
                    className="line-clamp-2 text-sm font-medium leading-snug text-foreground"
                    title={card.title}
                  >
                    {card.title}
                  </p>
                </div>
                <p className="mt-1 truncate pl-[18px] text-xs text-muted-foreground">
                  <span>{card.ownerName}</span>
                  <span className="text-muted-foreground/50"> • </span>
                  <span className="font-medium tabular-nums text-foreground/80">
                    {card.checklist.completed}/{card.checklist.total}
                  </span>
                  <span className="text-muted-foreground/50"> • </span>
                  <span className="font-medium">{card.ageLabel.replace(/^Abierta\s+/i, '')}</span>
                </p>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 rounded-md text-muted-foreground hover:bg-muted/60"
                aria-label="Ver acción"
                onClick={() => onOpen(card.id)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DemoAccionDetailModal({
  card,
  onClose,
}: {
  card: DemoCard
  onClose: () => void
}) {
  const column = columns.find((item) => item.id === card.column)
  const estadoLabel = column?.estadoLabel ?? 'Pendiente'

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-end bg-foreground/40 p-0 backdrop-blur-sm sm:place-items-center sm:p-5"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Acción ${card.publicId}`}
        className={cn(
          'flex w-full max-w-none flex-col overflow-hidden border border-border/60 bg-card shadow-xl',
          'h-[min(92dvh,900px)] rounded-t-2xl sm:h-auto sm:max-h-[min(90dvh,900px)] sm:max-w-2xl sm:rounded-lg'
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0 border-b border-border/60 bg-card px-3 py-2.5 pr-11 sm:px-4 sm:py-3 sm:pr-12">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1 pr-1">
              <h2 className="text-sm font-semibold leading-tight tracking-tight sm:text-base">
                Editar acción
              </h2>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground sm:text-xs">
                Demo local · No modifica el tablero real
              </p>
            </div>
            <div
              className="inline-flex w-fit max-w-full min-w-0 flex-wrap items-center gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 py-1 sm:max-w-[60%] sm:shrink-0"
              aria-label={`Acción ${card.publicId}, estado ${estadoLabel}, prioridad ${card.priority}`}
            >
              <span className="truncate text-xs font-semibold tabular-nums text-foreground">
                {card.publicId}
              </span>
              <span className="h-3 w-px shrink-0 bg-border/80" aria-hidden />
              <span
                className={cn(
                  'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none',
                  estadoBadgeClass[card.column]
                )}
              >
                {estadoLabel}
              </span>
              <span className="h-3 w-px shrink-0 bg-border/80" aria-hidden />
              <AccionPriorityBadge prioridad={card.priority} compact className="max-w-[9rem]" />
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-3 h-10 w-10 text-muted-foreground sm:right-4 sm:top-4 sm:h-8 sm:w-8"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-y-contain px-3 py-3 sm:space-y-5 sm:px-5 sm:py-4 md:px-6 md:py-5">
          <SectionCard className="border-primary/25 shadow-sm ring-1 ring-primary/10">
            <div className="flex items-start gap-2.5 border-b border-border/50 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-inset ring-primary/20 sm:h-10 sm:w-10">
                <CalendarClock className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  Paso 1
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                  Información principal
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  ¿Qué se hará, quién lo hará y para cuándo?
                </p>
              </div>
            </div>
            <SectionCardBody className="space-y-3 p-3 sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <DemoReadonlyValue label="Título de la acción" value={card.title} />
                <DemoReadonlyValue label="Responsable de ejecutar" value={card.ownerName} />
                <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Prioridad
                  </p>
                  <div className="mt-1.5">
                    <AccionPriorityBadge prioridad={card.priority} />
                  </div>
                </div>
                <div>
                  <DemoReadonlyValue label="Fecha y hora límite" value={`${card.date} · 18:00`} />
                  <p className="mt-1 px-1 text-xs font-medium text-muted-foreground">{card.ageLabel}</p>
                </div>
                <div className="sm:col-span-2">
                  <DemoReadonlyValue label="Descripción" value={card.description} />
                </div>
              </div>
            </SectionCardBody>
          </SectionCard>

          <SectionCard>
            <div className="flex items-start gap-2.5 border-b border-border/50 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary ring-1 ring-inset ring-primary/20 sm:h-10 sm:w-10">
                <FileCheck className="h-4 w-4 sm:h-[18px] sm:w-[18px]" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-[11px]">
                  Paso 2
                </p>
                <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground sm:text-[15px]">
                  Evidencia y validación
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Criterio de cierre y avance del checklist.
                </p>
              </div>
            </div>
            <SectionCardBody className="space-y-3 p-3 sm:p-4">
              <DemoReadonlyValue label="Evidencia esperada" value={card.validation} />
              <div className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Checklist
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {card.checklist.completed}/{card.checklist.total} completados
                  </p>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {Math.round((card.checklist.completed / Math.max(card.checklist.total, 1)) * 100)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.round(
                        (card.checklist.completed / Math.max(card.checklist.total, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </SectionCardBody>
          </SectionCard>
        </div>

        <div className="flex shrink-0 flex-col gap-2 border-t border-border/70 bg-card/95 px-3 py-3 backdrop-blur-sm sm:px-5 sm:py-4 md:px-6">
          <div className="flex w-full items-center justify-end gap-2">
            <Button type="button" variant="outline" className="h-10 rounded-lg px-4" onClick={onClose}>
              Cerrar
            </Button>
            <Button type="button" className="h-10 rounded-lg px-4" disabled title="Solo demo">
              Guardar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DropColumn({
  column,
  cards,
  onOpen,
  highlighted = false,
  dimmed = false,
}: {
  column: (typeof columns)[number]
  cards: DemoCard[]
  onOpen: (id: string) => void
  highlighted?: boolean
  dimmed?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { column: column.id } })
  const Icon = column.Icon
  return (
    <div
      className={cn(
        'flex w-[min(240px,calc(100vw-2.5rem))] shrink-0 snap-start flex-col rounded-2xl border border-border/50 border-l-4 transition-all duration-300 sm:w-[240px]',
        column.border,
        column.bg,
        isOver && 'ring-2 ring-primary/25 ring-offset-2 ring-offset-background',
        highlighted && 'z-10 scale-[1.02] shadow-lg ring-2 ring-primary/40',
        dimmed && 'opacity-45 saturate-50'
      )}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn('h-4 w-4 shrink-0', column.iconClass)} />
          <h3 className="truncate text-sm font-semibold text-foreground">{column.title}</h3>
          <span className="rounded-md bg-background/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
            {cards.length}
          </span>
        </div>
      </div>
      <div ref={setNodeRef} className="min-h-[220px] flex-1 space-y-2 px-2.5 pb-3">
        {cards.length === 0 ? (
          <div className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/40 px-3 py-6 text-center">
            <Icon className={cn('mb-2 h-6 w-6 opacity-60', column.iconClass)} />
            <p className="text-xs font-medium text-muted-foreground">Suelta aquí</p>
          </div>
        ) : (
          cards.map((card) => <DraggableCard key={card.id} card={card} onOpen={onOpen} />)
        )}
      </div>
    </div>
  )
}

function resolveDropColumn(overId: string, cards: DemoCard[]): ColumnId | null {
  if (columns.some((column) => column.id === overId)) {
    return overId as ColumnId
  }
  const overCard = cards.find((card) => card.id === overId)
  return overCard?.column ?? null
}

function CollapsedCreateActionPanel({
  created,
  onCreate,
}: {
  created: boolean
  onCreate: (input: {
    title: string
    description: string
    ownerName: string
    priority: DemoCard['priority']
    dateLabel: string
    validation: string
  }) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <LandingCard className="mt-4 overflow-hidden border-emerald-500/15 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/25 sm:px-5"
        aria-expanded={open}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
          <Plus className="h-5 w-5" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Nueva acción</span>
            <ModuleMetaBadge code="FRM·002" className="hidden sm:inline-flex" />
            {created ? (
              <Badge variant="outline" className="h-5 border-emerald-500/30 text-[10px] text-emerald-700">
                Demo creada
              </Badge>
            ) : null}
          </span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            Mismo flujo del tablero: información principal y evidencia de cierre
          </span>
        </span>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-muted-foreground transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-border/50 bg-card">
          <DemoCreateAccionForm created={created} onCreate={onCreate} />
        </div>
      ) : null}
    </LandingCard>
  )
}

const SCROLL_STORY: Array<{
  column: ColumnId
  eyebrow: string
  title: string
  copy: string
}> = [
  {
    column: 'asignado',
    eyebrow: 'Entrada',
    title: 'Una solicitud entra con responsable y fecha',
    copy: 'Responsable, prioridad y evidencia desde el primer minuto — no en el chat del viernes.',
  },
  {
    column: 'seguimiento',
    eyebrow: 'Seguimiento',
    title: 'El avance vive en un solo tablero',
    copy: 'Cada movimiento de columna deja trazabilidad. Nadie persigue por WhatsApp.',
  },
  {
    column: 'retraso',
    eyebrow: 'Riesgo visible',
    title: 'El retraso se ve antes de la junta',
    copy: 'Las acciones vencidas saltan a Retraso. Dirección interviene con datos, no con sorpresas.',
  },
  {
    column: 'verificado',
    eyebrow: 'Cierre',
    title: 'Compromiso cerrado con evidencia',
    copy: 'Hecho con validación y verificado — el ciclo completo en el mismo lugar.',
  },
]

function KanbanDemoPanel({
  visibleCards,
  highOnly,
  onToggleHighOnly,
  highlightColumn,
  onOpen,
  sensors,
  draggingCard,
  onDragStart,
  onDragEnd,
}: {
  visibleCards: DemoCard[]
  highOnly: boolean
  onToggleHighOnly: () => void
  highlightColumn?: ColumnId
  onOpen: (id: string) => void
  sensors: ReturnType<typeof useSensors>
  draggingCard: DemoCard | null
  onDragStart: (event: DragStartEvent) => void
  onDragEnd: (event: DragEndEvent) => void
}) {
  return (
    <LandingCard className="overflow-hidden shadow-lg ring-1 ring-border/40">
      <div className="flex flex-col gap-3 border-b border-border/50 bg-gradient-to-r from-muted/30 via-background to-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <ModuleMetaBadge code="KBN·001" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Kanban operativo</p>
            <p className="text-xs text-muted-foreground">
              {visibleCards.length} acciones · arrastra entre estados
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[10rem] flex-1 sm:flex-none sm:w-44">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              readOnly
              placeholder="Buscar..."
              className="h-9 rounded-lg border-border/60 bg-background pl-8 text-sm"
              aria-label="Buscar (solo demo)"
            />
          </div>
          <Button
            type="button"
            variant={highOnly ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleHighOnly}
            className={cn(
              'h-9 gap-1.5 rounded-lg text-xs font-semibold',
              highOnly && 'border-primary/25 bg-primary/10 text-primary'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            {highOnly ? 'Alta' : 'Filtros'}
          </Button>
          <span className="hidden text-[10px] font-medium text-muted-foreground lg:inline">
            Solo demo
          </span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto scroll-smooth bg-gradient-to-b from-muted/10 to-background p-4 sm:p-5">
          {columns.map((column) => (
            <DropColumn
              key={column.id}
              column={column}
              cards={visibleCards.filter((card) => card.column === column.id)}
              onOpen={onOpen}
              highlighted={highlightColumn === column.id}
              dimmed={highlightColumn != null && highlightColumn !== column.id}
            />
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: 'ease-out' }}>
          {draggingCard ? <KanbanCardFace card={draggingCard} /> : null}
        </DragOverlay>
      </DndContext>
    </LandingCard>
  )
}

export function ProductInAction() {
  const [created, setCreated] = useState(false)
  const [cards, setCards] = useState<DemoCard[]>(initialCards)
  const [highOnly, setHighOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const visibleCards = highOnly ? cards.filter((card) => card.priority === 'Alta') : cards
  const selected = cards.find((card) => card.id === selectedId) ?? null
  const draggingCard = cards.find((card) => card.id === draggingId) ?? null

  const handleCreate = (input: {
    title: string
    description: string
    ownerName: string
    priority: DemoCard['priority']
    dateLabel: string
    validation: string
  }) => {
    const initials = input.ownerName
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
    const seq = 1100 + cards.length
    setCards((current) => [
      {
        id: `demo-${Date.now()}`,
        publicId: `AC-${seq}`,
        title: input.title,
        description: input.description,
        owner: initials,
        ownerName: input.ownerName,
        date: input.dateLabel,
        priority: input.priority,
        column: 'asignado',
        validation: input.validation,
        checklist: { total: 2, completed: 0 },
        ageLabel: 'Abierta hoy',
      },
      ...current,
    ])
    setCreated(true)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null)
    const { active, over } = event
    if (!over) return

    const targetColumn = resolveDropColumn(String(over.id), cards)
    if (!targetColumn) return

    setCards((current) =>
      current.map((card) =>
        card.id === String(active.id) ? { ...card, column: targetColumn } : card
      )
    )
  }

  return (
    <LandingSection
      id="como-funciona"
      surface="depth"
      spacing="standard"
      withGrid
      seoDescription={LANDING_SEO.sections.producto.description}
    >
      <LandingShell>
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow tokenColor="blue">Producto en acción</Eyebrow>
          <SectionTitle>
            Cada solicitud se convierte en un compromiso gestionable.
          </SectionTitle>
          <SectionLead className="mx-auto">
            Un mismo hábito operativo para comunicar, asignar, actualizar, desbloquear y verificar.
          </SectionLead>
        </div>

        <div id="producto" className="mt-9 lg:mt-11">
          <div className="mx-auto grid max-w-6xl gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SCROLL_STORY.map((step, index) => (
              <div key={step.column} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary/10 text-[10px] font-bold text-primary">
                    0{index + 1}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">{step.eyebrow}</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold leading-snug text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.copy}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-5 max-w-7xl">
            <KanbanDemoPanel
              visibleCards={visibleCards}
              highOnly={highOnly}
              onToggleHighOnly={() => setHighOnly((value) => !value)}
              highlightColumn={undefined}
              onOpen={setSelectedId}
              sensors={sensors}
              draggingCard={draggingCard}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            />
            <div className="mx-auto max-w-3xl">
              <CollapsedCreateActionPanel created={created} onCreate={handleCreate} />
            </div>
          </div>
        </div>
      </LandingShell>

      {selected ? <DemoAccionDetailModal card={selected} onClose={() => setSelectedId(null)} /> : null}
    </LandingSection>
  )
}

export function DashboardDemo() {
  const [activeModule, setActiveModule] = useState<'atencion' | 'ico' | 'tiempos' | 'okr'>('atencion')

  const attention = {
    total: 18,
    segments: [
      { label: 'Rojos', value: 5, pct: 28, dot: 'bg-red-500', text: 'text-red-700 dark:text-red-300', surface: 'border-red-500/20 bg-red-500/[0.06]', bar: 'bg-red-500' },
      { label: 'Amarillos', value: 7, pct: 39, dot: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300', surface: 'border-amber-500/20 bg-amber-500/[0.06]', bar: 'bg-amber-500' },
      { label: 'Verdes', value: 6, pct: 33, dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', surface: 'border-emerald-500/20 bg-emerald-500/[0.06]', bar: 'bg-emerald-500' },
    ],
  }
  const attentionPie = `conic-gradient(#ef4444 0% ${attention.segments[0].pct}%, #f59e0b ${attention.segments[0].pct}% ${attention.segments[0].pct + attention.segments[1].pct}%, #10b981 ${attention.segments[0].pct + attention.segments[1].pct}% 100%)`

  const icoTarget = 89
  const { ref: icoGaugeRef, value: icoValue } = useCountUp(icoTarget)
  const icoRing = `conic-gradient(#10b981 0% ${icoValue}%, hsl(var(--muted)) ${icoValue}% 100%)`

  const avgAgeDays = 5.4
  const avgAgeMarker = Math.min(100, (avgAgeDays / 10) * 100)
  const timeMetrics = [
    {
      title: 'Tiempo prom. rojos',
      value: 4.2,
      description: 'Días hasta el cierre en acciones rojas.',
      tone: 'yellow' as const,
      trend: '-0.8 días vs periodo anterior',
      trendGood: true,
    },
    {
      title: 'Tiempo prom. demás',
      value: 6.8,
      description: 'Días hasta el cierre en amarillas y verdes.',
      tone: 'green' as const,
      trend: '-1.1 días vs periodo anterior',
      trendGood: true,
    },
  ]
  const agingBuckets = [
    { range: '0–2 días', count: 9, pct: 30, bar: 'bg-emerald-500', surface: 'border-emerald-500/25 bg-emerald-500/[0.06]' },
    { range: '3–5 días', count: 11, pct: 37, bar: 'bg-lime-500', surface: 'border-lime-500/25 bg-lime-500/[0.06]' },
    { range: '6–10 días', count: 6, pct: 20, bar: 'bg-amber-500', surface: 'border-amber-500/25 bg-amber-500/[0.06]' },
    { range: '+10 días', count: 4, pct: 13, bar: 'bg-red-500', surface: 'border-red-500/25 bg-red-500/[0.06]' },
  ]

  const okrKrs = [
    { id: 'KR1', title: 'Cerrar rojos más rápido', value: '27 → 18 días', progress: 72, tone: 'yellow' as const },
    { id: 'KR2', title: 'Reducir rojos abiertos >15d', value: '4 abiertas', progress: 61, tone: 'yellow' as const },
    { id: 'KR3', title: 'Subir ICO del periodo', value: '89% / Meta 92%', progress: 84, tone: 'green' as const },
    { id: 'KR4', title: 'Cumplir compromisos a tiempo', value: '31 / 35', progress: 88, tone: 'green' as const },
  ]

  const toneBar = {
    green: 'bg-emerald-500',
    yellow: 'bg-amber-500',
    red: 'bg-red-500',
  }
  const toneSurface = {
    green: 'border-emerald-500/25 bg-emerald-500/[0.06]',
    yellow: 'border-amber-500/25 bg-amber-500/[0.06]',
    red: 'border-red-500/25 bg-red-500/[0.06]',
  }
  const metricToneSurface = {
    green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100',
    yellow: 'border-amber-500/35 bg-amber-500/10 text-amber-950 dark:text-amber-100',
    red: 'border-red-500/35 bg-red-500/10 text-red-950 dark:text-red-100',
  }

  return (
    <LandingSection
      id="indicadores"
      surface="inverse"
      spacing="standard"
      seoDescription={LANDING_SEO.sections.indicadores.description}
    >
      <LandingShell>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow dark tokenColor="green">
            Valor para Dirección
          </Eyebrow>
          <SectionTitle dark>
            Ve los riesgos. Decide dónde actuar.
          </SectionTitle>
          <SectionLead dark className="mx-auto">
            Compromisos, cumplimiento y tiempos convertidos en señales para decidir.
          </SectionLead>
        </div>

        <div className="mx-auto mt-7 flex max-w-4xl flex-wrap justify-center gap-2">
          {[
            ['Ver', 'Qué compromisos requieren atención ahora.'],
            ['Decidir', 'Dónde destrabar, priorizar o escalar.'],
            ['Mejorar', 'Dónde se deterioran cumplimiento y tiempos.'],
          ].map(([title, copy], index) => (
            <div
              key={title}
              className="flex items-center gap-2 rounded-full border border-background/15 bg-background/[0.06] px-3.5 py-2 backdrop-blur-sm"
            >
                <span className="grid h-5 w-5 place-items-center rounded-md bg-emerald-400/15 text-[9px] font-bold text-emerald-300">
                  0{index + 1}
                </span>
                <h3 className="text-xs font-semibold text-background">{title}</h3>
                <span className="hidden text-[11px] text-background/55 md:inline">· {copy}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4 border-y border-background/10 py-4">
          <p className="text-sm font-semibold text-background">Del dato a la decisión, en el mismo tablero.</p>
          <p className="hidden text-xs text-background/50 sm:block">Riesgo · Cumplimiento · Tiempos · Carga</p>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {[
            ['atencion', 'Atención hoy'],
            ['ico', 'Cumplimiento'],
            ['tiempos', 'Tiempos'],
            ['okr', 'Mejora'],
          ].map(([id, label]) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={activeModule === id ? 'default' : 'outline'}
              className={cn(
                'h-8 rounded-full px-4 text-xs',
                activeModule !== id && 'border-white/20 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              )}
              onClick={() => setActiveModule(id as typeof activeModule)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="mx-auto mt-4 grid max-w-4xl gap-4 [--background:0_0%_100%] [--border:220_13%_91%] [--card:0_0%_100%] [--foreground:222_47%_11%] [--muted:220_14%_96%] [--muted-foreground:220_9%_46%]">
          {/* 1. Atención inmediata */}
          <SectionCard
            className={cn(
              'transition',
              activeModule !== 'atencion' && 'hidden',
              activeModule === 'atencion' && 'border-primary/30 ring-1 ring-primary/15'
            )}
          >
            <SectionCardHeader
              eyebrow="Salud operativa"
              title="Atención inmediata"
              subtitle="Hoy y vencidas por prioridad."
              icon={AlertTriangle}
              action={
                <Button
                  type="button"
                  size="sm"
                  variant={activeModule === 'atencion' ? 'default' : 'outline'}
                  className="hidden"
                  onClick={() => setActiveModule('atencion')}
                >
                  Ver módulo
                </Button>
              }
            />
            <SectionCardBody className="p-4 sm:p-5">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/35 shadow-sm">
                <div className="grid items-center gap-5 p-4 sm:grid-cols-[minmax(9rem,0.85fr)_minmax(0,1.15fr)] sm:p-5">
                  <div className="relative mx-auto w-full max-w-40">
                    <div
                      className="relative aspect-square w-full rounded-full p-2"
                      style={{ background: attentionPie }}
                    >
                      <span className="absolute inset-[20%] flex flex-col items-center justify-center rounded-full border-4 border-background bg-background shadow-sm">
                        <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-950">
                          <CountUpInteger target={attention.total} />
                        </span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          acciones
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {attention.segments.map((segment) => (
                      <div
                        key={segment.label}
                        className={cn('rounded-xl border px-3 py-2.5', segment.surface)}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={cn('h-3 w-3 rounded-full', segment.dot)} />
                          <span className={cn('min-w-0 flex-1 text-xs font-bold', segment.text)}>
                            {segment.label}
                          </span>
                          <span className={cn('text-base font-bold tabular-nums', segment.text)}>
                            {segment.value}
                          </span>
                          <span className="w-10 text-right text-[11px] font-semibold tabular-nums text-slate-600">
                            {segment.pct}%
                          </span>
                        </div>
                        <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-background/80">
                          <span
                            className={cn('block h-full rounded-full', segment.bar)}
                            style={{ width: `${segment.pct}%` }}
                          />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCardBody>
          </SectionCard>

          {/* 2. ICO / Confiabilidad */}
          <SectionCard
            className={cn(
              'transition',
              activeModule !== 'ico' && 'hidden',
              activeModule === 'ico' && 'border-primary/30 ring-1 ring-primary/15'
            )}
          >
            <SectionCardHeader
              eyebrow="Ejecución"
              title="Confiabilidad de compromisos"
              subtitle="ICO global del periodo."
              icon={ShieldCheck}
              action={
                <Badge variant="secondary" className="h-7 gap-1.5 px-2.5 tabular-nums">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  35 cierres
                </Badge>
              }
            />
            <SectionCardBody className="p-4 sm:p-5">
              <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-emerald-500/[0.04] shadow-sm">
                <div className="grid items-center gap-5 p-4 sm:grid-cols-[minmax(9rem,0.85fr)_minmax(0,1.15fr)] sm:p-5">
                  <div
                    ref={icoGaugeRef}
                    className="relative mx-auto aspect-square w-full max-w-36 rounded-full"
                    style={{ background: icoRing }}
                  >
                    <span className="absolute inset-[18%] flex flex-col items-center justify-center rounded-full border-4 border-background bg-background shadow-sm">
                      <span className="text-3xl font-bold tabular-nums tracking-tight">
                        {icoValue}
                        <span className="text-base font-semibold text-muted-foreground">%</span>
                      </span>
                      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        ICO
                      </span>
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="rounded-xl border border-border/60 bg-background/70 px-3.5 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Acciones cerradas
                      </p>
                      <p className="mt-1 text-2xl font-bold tabular-nums">35</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Base del cálculo en el periodo.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-background/70 px-3 py-2 text-xs font-medium text-emerald-700 dark:text-emerald-200">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +4 pp vs periodo anterior
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={activeModule === 'ico' ? 'default' : 'outline'}
                      className="hidden"
                      onClick={() => setActiveModule('ico')}
                    >
                      Ver módulo
                    </Button>
                  </div>
                </div>
              </div>
            </SectionCardBody>
          </SectionCard>

          {/* 3. Tiempos y antigüedad */}
          <SectionCard
            className={cn(
              'transition',
              activeModule !== 'tiempos' && 'hidden',
              activeModule === 'tiempos' && 'border-primary/30 ring-1 ring-primary/15'
            )}
          >
            <SectionCardHeader
              eyebrow="Carga operativa"
              title="Tiempos y antigüedad"
              subtitle="Velocidad de cierre y edad del backlog abierto."
              icon={Timer}
              action={
                <Badge variant="secondary" className="h-7 gap-1.5 px-2.5 tabular-nums">
                  <ListChecks className="h-3.5 w-3.5" />
                  30 abiertas
                </Badge>
              }
            />
            <SectionCardBody className="space-y-4 p-4 sm:p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {timeMetrics.map((metric) => (
                  <div
                    key={metric.title}
                    className={cn('flex flex-col rounded-xl border p-4 shadow-sm', metricToneSurface[metric.tone])}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/70">
                        <Timer className="h-4 w-4" />
                      </span>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {metric.title}
                      </p>
                    </div>
                    <p className="mt-3 flex items-end gap-1.5">
                      <span className="text-3xl font-bold leading-none tracking-tight tabular-nums">
                        <CountUpDecimal target={metric.value} />
                      </span>
                      <span className="pb-0.5 text-sm font-medium text-muted-foreground">días</span>
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                      {metric.description}
                    </p>
                    <p
                      className={cn(
                        'mt-3 inline-flex items-center gap-1.5 text-xs font-medium',
                        metric.trendGood
                          ? 'text-emerald-700 dark:text-emerald-200'
                          : 'text-red-700 dark:text-red-200'
                      )}
                    >
                      <TrendingDown className="h-3.5 w-3.5" />
                      {metric.trend}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Edad promedio
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Backlog abierto · días desde la creación.
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/70">
                    <Timer className="h-4 w-4" />
                  </span>
                </div>
                <p className="mt-4 flex items-end gap-2">
                  <span className="text-4xl font-bold leading-none tracking-tight tabular-nums">
                    <CountUpDecimal target={avgAgeDays} />
                  </span>
                  <span className="pb-1 text-sm font-medium text-muted-foreground">días</span>
                </p>
                <div className="mt-4">
                  <div className="relative h-3 rounded-full bg-background/75">
                    <span className="absolute inset-y-0 left-0 w-[30%] rounded-l-full bg-emerald-500/75" />
                    <span className="absolute inset-y-0 left-[30%] w-[40%] bg-amber-500/75" />
                    <span className="absolute inset-y-0 right-0 w-[30%] rounded-r-full bg-red-500/75" />
                    <span
                      className="absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow"
                      style={{ left: `${avgAgeMarker}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-muted-foreground">
                    <span>0 días</span>
                    <span>10 días</span>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border/60 bg-background/60 shadow-sm">
                <div className="flex items-center justify-between gap-2 border-b border-border/50 px-3 py-2.5">
                  <p className="text-xs font-semibold text-foreground">Antigüedad del backlog</p>
                  <Badge variant="outline" className="h-6 text-[10px] tabular-nums">
                    30 abiertas
                  </Badge>
                </div>
                <div className="grid gap-2 p-3 sm:grid-cols-2">
                  {agingBuckets.map((bucket) => (
                    <div
                      key={bucket.range}
                      className={cn('rounded-lg border px-2.5 py-2', bucket.surface)}
                    >
                      <div className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="font-semibold">{bucket.range}</span>
                        <span className="tabular-nums text-muted-foreground">
                          {bucket.count} · {bucket.pct}%
                        </span>
                      </div>
                      <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-background/80">
                        <span
                          className={cn('block h-full rounded-full', bucket.bar)}
                          style={{ width: `${bucket.pct}%` }}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                size="sm"
                variant={activeModule === 'tiempos' ? 'default' : 'outline'}
                className="hidden"
                onClick={() => setActiveModule('tiempos')}
              >
                Ver módulo
              </Button>
            </SectionCardBody>
          </SectionCard>

          {/* 4. OKR operativo */}
          <SectionCard
            className={cn(
              'transition',
              activeModule !== 'okr' && 'hidden',
              activeModule === 'okr' && 'border-primary/30 ring-1 ring-primary/15'
            )}
          >
            <SectionCardHeader
              eyebrow="OKR Operativo"
              title="Avance del OKR activo"
              subtitle="Key results con ritmo y riesgo visibles."
              icon={Target}
              action={
                <Badge
                  variant="outline"
                  className="h-7 gap-1.5 border-amber-500/35 bg-amber-500/10 px-2.5 text-amber-700 dark:text-amber-200"
                >
                  <CircleDot className="h-3.5 w-3.5" />
                  En curso
                </Badge>
              }
            />
            <SectionCardBody className="space-y-3 p-4 sm:p-5">
              <div className="grid gap-2 sm:grid-cols-2">
                {okrKrs.map((kr) => (
                  <div
                    key={kr.id}
                    className={cn('rounded-xl border p-3', toneSurface[kr.tone])}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          {kr.id}
                        </p>
                        <p className="mt-0.5 text-xs font-semibold leading-snug text-foreground">
                          {kr.title}
                        </p>
                      </div>
                      <span className="text-xs font-bold tabular-nums text-foreground">
                        {kr.progress}%
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] font-medium tabular-nums text-foreground">
                      {kr.value}
                    </p>
                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-background/80">
                      <span
                        className={cn('block h-full rounded-full', toneBar[kr.tone])}
                        style={{ width: `${kr.progress}%` }}
                      />
                    </span>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                variant={activeModule === 'okr' ? 'default' : 'outline'}
                className="hidden"
                onClick={() => setActiveModule('okr')}
              >
                Ver módulo
              </Button>
            </SectionCardBody>
          </SectionCard>
        </div>
      </LandingShell>
    </LandingSection>
  )
}

const aiAnswers: Record<string, string> = {
  'Como puedo desbloquear esta accion y a quien debo involucrar?':
    'Identifique una dependencia con Finanzas. Confirma al responsable, acuerda una hora limite hoy a las 14:00 y adjunta su validacion como evidencia.',
  'Que evidencia seria suficiente para cerrar esta accion con calidad?':
    'Para verificar el cierre, adjunta la validacion de Finanzas y la confirmacion de fecha enviada al cliente.',
  'Dame un plan corto para cerrar esta accion hoy.':
    '1. Confirma responsable en Finanzas.\n2. Acuerda limite a las 14:00.\n3. Adjunta evidencia.\n4. Mueve a Hecho y solicita verificacion.',
}

type ChatMessage = { role: 'assistant' | 'user'; content: string }

const demoActionPrompts = Object.keys(aiAnswers)

const demoRedActions = [
  {
    id: '1',
    initials: 'AM',
    title: 'Confirmar condiciones de entrega',
    preview: 'Dependencia con Finanzas · Bloqueado',
    tone: 'red' as const,
    badge: 'Rojo',
    meta: 'Hoy · 14:00',
  },
  {
    id: '2',
    initials: 'JR',
    title: 'Validar propuesta comercial',
    preview: 'Falta evidencia de cierre',
    tone: 'amber' as const,
    badge: 'Retraso',
    meta: 'Ayer',
  },
  {
    id: '3',
    initials: 'LC',
    title: 'Resolver bloqueo logístico',
    preview: 'Esperando respuesta de proveedor',
    tone: 'red' as const,
    badge: 'Bloqueado',
    meta: '2d',
  },
] as const

const aiSuggestionText =
  'Perfecto: confirma con Finanzas antes de las 14:00, adjunta su validacion como evidencia y mueve la accion a Hecho cuando quede documentado.'

export function AIDemo() {
  const [selectedId, setSelectedId] = useState<string>(demoRedActions[0].id)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'user',
      content: '¿Ya validaron la propuesta con Finanzas?',
    },
    {
      role: 'assistant',
      content:
        'Aun no. Identifique dependencia con Finanzas: confirma responsable, acuerda hora limite hoy 14:00 y adjunta validacion.',
    },
  ])
  const [input, setInput] = useState('')
  const [showSuggestion, setShowSuggestion] = useState(true)

  const selected = demoRedActions.find((a) => a.id === selectedId) ?? demoRedActions[0]

  const ask = (prompt: string) => {
    const answer =
      aiAnswers[prompt] ??
      'Con el contexto de la accion: confirma dependencia, evidencia y fecha limite antes de cerrar.'
    setMessages((current) => [
      ...current,
      { role: 'user', content: prompt },
      { role: 'assistant', content: answer },
    ])
    setShowSuggestion(true)
    setInput('')
  }

  return (
    <LandingSection
      id="ia"
      surface="depth"
      spacing="standard"
      withGrid
      seoDescription={LANDING_SEO.sections.ia.description}
    >
      <LandingShell>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow tokenColor="yellow">Asistente IA</Eyebrow>
          <SectionTitle>Cuando hay un bloqueo, también ayuda a decidir qué hacer.</SectionTitle>
          <SectionLead className="mx-auto">
            El mismo flujo del tablero: acción roja, contexto activo y validación de cierre.
          </SectionLead>
        </div>

        <LandingCard className="mt-10 overflow-hidden shadow-lg ring-1 ring-border/40">
          <div className="grid min-h-[420px] lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)]">
            {/* Lista de acciones rojas */}
            <aside className="border-b border-border/50 bg-muted/15 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">Acciones rojas</p>
                  <p className="text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
                      {demoRedActions.length} abiertas
                    </span>
                  </p>
                </div>
                <Badge variant="outline" className="h-6 text-[10px] tabular-nums">
                  Demo
                </Badge>
              </div>
              <ul className="divide-y divide-border/40 p-2">
                {demoRedActions.map((action) => {
                  const active = action.id === selectedId
                  return (
                    <li key={action.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(action.id)}
                        className={cn(
                          'flex w-full gap-3 rounded-xl px-3 py-3 text-left transition',
                          active
                            ? 'border-l-[3px] border-l-emerald-600 bg-emerald-500/[0.08] pl-[calc(0.75rem-3px)]'
                            : 'border-l-[3px] border-l-transparent hover:bg-muted/40'
                        )}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-foreground text-xs font-bold text-background">
                          {action.initials}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-start justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-foreground">
                              {action.title}
                            </span>
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {action.meta}
                            </span>
                          </span>
                          <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {action.preview}
                          </span>
                          <span className="mt-2 inline-flex">
                            <StatusPill tone={action.tone}>{action.badge}</StatusPill>
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </aside>

            {/* Chat + sugerencia IA */}
            <div className="flex min-w-0 flex-col bg-card">
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 px-4 py-3 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{selected.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    contexto operativo · {selected.badge.toLowerCase()} · checklist 1/3
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" className="h-8 gap-1.5 rounded-lg text-xs">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    IA activa
                  </Button>
                  <Button type="button" size="sm" className="h-8 rounded-lg text-xs">
                    Asignar
                  </Button>
                </div>
              </header>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
                {messages.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      message.role === 'user'
                        ? 'mr-auto rounded-bl-md bg-muted text-foreground'
                        : 'ml-auto rounded-br-md bg-emerald-600 text-white shadow-sm'
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>

              {showSuggestion ? (
                <div className="mx-4 mb-3 rounded-xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.06] p-4 sm:mx-5">
                  <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Sugerencia IA · listo para enviar
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{aiSuggestionText}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" size="sm" className="h-8 rounded-lg bg-foreground text-background hover:bg-foreground/90">
                      Enviar
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="h-8 rounded-lg">
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 rounded-lg text-xs text-muted-foreground"
                      onClick={() => setShowSuggestion(false)}
                    >
                      Otra opción
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="border-t border-border/50 bg-muted/10 px-4 py-3 sm:px-5">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {demoActionPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => ask(prompt)}
                      className="rounded-full border border-red-500/25 bg-background px-2.5 py-1 text-[10px] font-medium text-red-800 transition hover:bg-red-500/10 dark:text-red-200"
                    >
                      {prompt.length > 42 ? `${prompt.slice(0, 40)}…` : prompt}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Pregunta sobre esta acción…"
                    className="h-10 rounded-xl border-border/60 bg-background text-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && input.trim()) ask(input.trim())
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    className="h-10 w-10 shrink-0 rounded-xl"
                    disabled={!input.trim()}
                    onClick={() => input.trim() && ask(input.trim())}
                    aria-label="Enviar"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">Solo demo · No llama al asistente real</p>
              </div>
            </div>
          </div>
        </LandingCard>
      </LandingShell>
    </LandingSection>
  )
}
