import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { FileUp, Lightbulb, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isAcceptedEvidenciaFile } from '@/services/evidenciaStorage.service'
import { cn } from '@/lib/utils'
import { useCreateChallengeIdea } from '../hooks/useChallengeIdeas'

const TEXTAREA_CLASS =
  'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60'

type ChallengeIdeaFormDialogProps = {
  open: boolean
  challengeId: string
  currentUserId?: string | null
  onOpenChange: (open: boolean) => void
  onSaved?: (ideaId: string) => void
}

export function ChallengeIdeaFormDialog({
  open,
  challengeId,
  currentUserId,
  onOpenChange,
  onSaved,
}: ChallengeIdeaFormDialogProps) {
  const createIdea = useCreateChallengeIdea(challengeId)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [expectedContribution, setExpectedContribution] = useState('')
  const [file, setFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setDescription('')
    setExpectedContribution('')
    setFile(null)
  }, [open])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!currentUserId) {
      toast.error('No se pudo resolver tu usuario.')
      return
    }
    const cleanTitle = title.trim()
    const cleanDescription = description.trim()
    const cleanExpected = expectedContribution.trim()
    if (cleanTitle.length < 5) {
      toast.error('Resume tu idea con al menos 5 caracteres.')
      return
    }
    if (cleanDescription.length < 10) {
      toast.error('Describe que propones hacer.')
      return
    }
    try {
      const idea = await createIdea.mutateAsync({
        input: {
          challenge_id: challengeId,
          author_user_id: currentUserId,
          title: cleanTitle,
          description: cleanDescription,
          expected_contribution: cleanExpected || null,
        },
        file,
      })
      toast.success('Idea publicada')
      onSaved?.(idea.id)
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo publicar la idea.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" aria-hidden />
            Proponer una idea
          </DialogTitle>
          <DialogDescription>
            Comparte una solución concreta para este Challenge. Debe poder entenderse rápido.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5">
          <Field label="Título de la idea" htmlFor="idea-title">
            <Input
              id="idea-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={140}
              placeholder="Resume tu propuesta en una frase"
            />
          </Field>

          <Field label="¿Qué propones hacer?" htmlFor="idea-description">
            <textarea
              id="idea-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className={TEXTAREA_CLASS}
              placeholder="Describe la solución de forma sencilla."
            />
          </Field>

          <Field label="¿Cómo ayudaría?" htmlFor="idea-contribution" hint="Opcional, pero recomendado.">
            <textarea
              id="idea-contribution"
              value={expectedContribution}
              onChange={(event) => setExpectedContribution(event.target.value)}
              rows={4}
              className={TEXTAREA_CLASS}
              placeholder="Explica cómo esta propuesta ayudaría a resolver el Challenge."
            />
          </Field>

          <Field label="Evidencia / archivo" htmlFor="idea-file" hint="Opcional. Imagen, PDF o documento.">
            <label
              htmlFor="idea-file"
              className={cn(
                'flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm transition hover:bg-muted/35',
                file && 'border-primary/40 bg-primary/5'
              )}
            >
              <span className="min-w-0 truncate text-muted-foreground">
                {file ? file.name : 'Adjuntar archivo'}
              </span>
              <FileUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            </label>
            <Input
              id="idea-file"
              type="file"
              className="sr-only"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null
                if (next && !isAcceptedEvidenciaFile(next)) {
                  toast.error('Tipo de archivo no permitido.')
                  event.target.value = ''
                  setFile(null)
                  return
                }
                setFile(next)
              }}
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createIdea.isPending} className="gap-1.5">
              <Send className="h-4 w-4" aria-hidden />
              Publicar idea
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
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {hint ? <p className="text-[11px] leading-relaxed text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  )
}
