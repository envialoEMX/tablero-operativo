import { useMemo, useState, type FormEvent, type ReactElement } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  MessageSquare,
  Send,
  ThumbsUp,
  Trash2,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionCard, SectionCardBody, SectionCardHeader } from '@/components/SectionCard'
import { ROUTES } from '@/constants'
import { formatDateTimeCDMX } from '@/lib/dateUtils'
import { cn } from '@/lib/utils'
import { useCurrentUser } from '@/features/users/hooks/useCurrentUser'
import { useUsers } from '@/features/users/hooks/useUsers'
import { useAreas } from '@/features/catalogs/hooks/useAreas'
import { isAdminByRole, isDirectionByRole, isSuperAdminByRole } from '@/features/auth/lib/permissions'
import {
  useChallenge,
  useChallengeComments,
  useCreateChallengeComment,
  useDeleteChallengeComment,
  useToggleChallengeVote,
  useUpdateChallengeComment,
} from '../hooks/useChallenges'
import { isChallengeOpen } from '../services/challenges.service'
import {
  CHALLENGE_STATUS_BADGE,
  CHALLENGE_STATUS_LABEL,
  challengeDurationDays,
  dateLabel,
  daysRemaining,
  userInitials,
} from '../utils'

export function ChallengeDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: currentUser } = useCurrentUser()
  const { data: users = [] } = useUsers({ activo: true })
  const { data: areas = [] } = useAreas({ activo: true })
  const { data: challenge, isLoading, isError, error, refetch } = useChallenge(id, currentUser?.id)
  const { data: comments = [], isLoading: commentsLoading } = useChallengeComments(id)
  const toggleVote = useToggleChallengeVote(currentUser?.id)
  const createComment = useCreateChallengeComment(id ?? '')
  const updateComment = useUpdateChallengeComment(id ?? '')
  const deleteComment = useDeleteChallengeComment(id ?? '')
  const [content, setContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')

  const userNames = useMemo(() => {
    const map: Record<string, string> = {}
    if (currentUser?.id) map[currentUser.id] = currentUser.nombre
    for (const user of users) map[user.id] = user.nombre
    return map
  }, [currentUser?.id, currentUser?.nombre, users])
  const areaNames = useMemo(() => Object.fromEntries(areas.map((area) => [area.id, area.nombre])), [areas])

  const openForParticipation = challenge ? isChallengeOpen(challenge) : false
  const canManageChallenge = Boolean(
    currentUser && (isAdminByRole(currentUser.rol) || isDirectionByRole(currentUser.rol) || isSuperAdminByRole(currentUser.rol))
  )

  const handleVote = async () => {
    if (!challenge) return
    try {
      await toggleVote.mutateAsync({ challenge })
      toast.success(challenge.voted_by_me ? 'Voto retirado' : 'Gracias por apoyar este Challenge')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar tu voto')
    }
  }

  const handleComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!challenge || !currentUser?.id) return
    const text = content.trim()
    if (text.length < 2) return
    try {
      await createComment.mutateAsync({ challenge_id: challenge.id, user_id: currentUser.id, content: text })
      setContent('')
      toast.success('Comentario publicado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo publicar el comentario')
    }
  }

  const saveEditedComment = async () => {
    if (!editingId) return
    const text = editingContent.trim()
    if (text.length < 2) return
    try {
      await updateComment.mutateAsync({ id: editingId, content: text })
      setEditingId(null)
      setEditingContent('')
      toast.success('Comentario actualizado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo actualizar el comentario')
    }
  }

  const removeComment = async (commentId: string) => {
    try {
      await deleteComment.mutateAsync(commentId)
      toast.success('Comentario eliminado')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar el comentario')
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-6 sm:py-6">
        <div className="h-[480px] animate-pulse rounded-2xl bg-muted/50" />
      </div>
    )
  }

  if (isError || !challenge) {
    return (
      <div className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-6 sm:py-6">
        <SectionCard>
          <SectionCardBody className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
            <p className="text-sm font-semibold">No se pudo abrir el Challenge.</p>
            <p className="max-w-md text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Revisa permisos o conexion.'}
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.CHALLENGES)}>
                Volver
              </Button>
              <Button type="button" onClick={() => void refetch()}>
                Reintentar
              </Button>
            </div>
          </SectionCardBody>
        </SectionCard>
      </div>
    )
  }

  const remaining = daysRemaining(challenge)
  const duration = challengeDurationDays(challenge)
  const creatorName = userNames[challenge.created_by] ?? 'Usuario'

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col space-y-5 overflow-x-hidden px-3 py-5 sm:px-6 sm:py-6">
      <Button asChild variant="ghost" size="sm" className="w-fit gap-1.5">
        <Link to={ROUTES.CHALLENGES}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Challenges
        </Link>
      </Button>

      <section className="rounded-2xl border border-border/60 bg-gradient-to-br from-card via-card to-primary/[0.04] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <Badge variant="outline" className={CHALLENGE_STATUS_BADGE[challenge.effective_status]}>
              {CHALLENGE_STATUS_LABEL[challenge.effective_status]}
            </Badge>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {challenge.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1">
                Creado por {creatorName}
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1">
                {challenge.area_id ? areaNames[challenge.area_id] ?? 'Area' : 'Sin area especifica'}
              </span>
              <span className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1">
                Cierre {dateLabel(challenge.end_date ?? challenge.proposed_end_date)}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-80">
            <Counter icon={<ThumbsUp />} value={challenge.metrics.votes} label="Votos" />
            <Counter icon={<MessageSquare />} value={challenge.metrics.comments} label="Comentarios" />
            <Counter icon={<Users />} value={challenge.metrics.participants} label="Participantes" />
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div className="rounded-xl border border-border/60 bg-background/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {challenge.effective_status === 'active' ? 'Tiempo restante' : 'Estado'}
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {challenge.effective_status === 'active'
                ? `${remaining} dia${remaining === 1 ? '' : 's'}`
                : CHALLENGE_STATUS_LABEL[challenge.effective_status]}
            </p>
          </div>
          <Button
            type="button"
            disabled={!openForParticipation || toggleVote.isPending}
            variant={challenge.voted_by_me ? 'secondary' : 'default'}
            onClick={() => void handleVote()}
            className="h-12 gap-2"
          >
            <ThumbsUp className="h-4 w-4" aria-hidden />
            {challenge.voted_by_me ? 'Retirar voto' : 'Apoyar'}
          </Button>
        </div>
      </section>

      <SectionCard>
        <SectionCardHeader title="Descripcion" icon={CalendarDays} />
        <SectionCardBody>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{challenge.description}</p>
        </SectionCardBody>
      </SectionCard>

      {challenge.effective_status === 'finished' ? (
        <SectionCard>
          <SectionCardHeader
            title="Resultado del Challenge"
            subtitle="Resumen de participacion y espacio para conclusion."
            icon={CheckCircle2}
          />
          <SectionCardBody className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <ResultMetric label="Votos" value={challenge.metrics.votes} />
              <ResultMetric label="Comentarios" value={challenge.metrics.comments} />
              <ResultMetric label="Participantes" value={challenge.metrics.participants} />
              <ResultMetric label="Duracion" value={duration ? `${duration} dias` : 'Sin definir'} />
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Conclusion / Resultado
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                {challenge.result_summary?.trim() || 'Pendiente de documentar por el administrador.'}
              </p>
            </div>
          </SectionCardBody>
        </SectionCard>
      ) : null}

      <SectionCard>
        <SectionCardHeader
          title="Conversacion"
          subtitle={openForParticipation ? 'Comparte contexto, riesgos o propuestas.' : 'La participacion ya esta cerrada.'}
          icon={MessageSquare}
          action={<Badge variant="secondary">{comments.length}</Badge>}
        />
        <SectionCardBody className="space-y-4">
          <div className="space-y-3">
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
            ) : comments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground">
                Aun no hay comentarios.
              </p>
            ) : (
              comments.map((comment) => {
                const author = userNames[comment.user_id] ?? 'Usuario'
                const canEdit = comment.user_id === currentUser?.id || canManageChallenge
                return (
                  <article key={comment.id} className="flex gap-3 rounded-xl border border-border/50 bg-background/75 p-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {userInitials(author)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{author}</p>
                          <time className="text-[11px] text-muted-foreground">
                            {formatDateTimeCDMX(comment.created_at)}
                          </time>
                        </div>
                        {canEdit ? (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingId(comment.id)
                                setEditingContent(comment.content)
                              }}
                            >
                              Editar
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => void removeComment(comment.id)}>
                              <Trash2 className="h-4 w-4" aria-hidden />
                              <span className="sr-only">Eliminar comentario</span>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                      {editingId === comment.id ? (
                        <div className="mt-2 space-y-2">
                          <textarea
                            value={editingContent}
                            onChange={(event) => setEditingContent(event.target.value)}
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                          />
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setEditingId(null)}>
                              Cancelar
                            </Button>
                            <Button type="button" size="sm" onClick={() => void saveEditedComment()}>
                              Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{comment.content}</p>
                      )}
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {openForParticipation ? (
            <form onSubmit={(event) => void handleComment(event)} className="rounded-xl border border-border/60 bg-muted/10 p-3">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={4}
                placeholder="Escribe tu comentario..."
                className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" size="sm" className="gap-1.5" disabled={!content.trim() || createComment.isPending}>
                  <Send className="h-4 w-4" aria-hidden />
                  Publicar
                </Button>
              </div>
            </form>
          ) : null}
        </SectionCardBody>
      </SectionCard>
    </div>
  )
}

function Counter({ icon, value, label }: { icon: ReactElement; value: number; label: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/70 p-3 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function ResultMetric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={cn('rounded-xl border border-border/60 bg-background/70 p-3')}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
    </div>
  )
}
