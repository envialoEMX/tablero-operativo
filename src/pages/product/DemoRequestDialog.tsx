import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  buildDemoMailto,
  demoNeedOptions,
  demoRequestSchema,
  demoTeamSizeOptions,
  type DemoRequestValues,
} from './demoRequest.types'

async function submitDemoRequest(values: DemoRequestValues) {
  const response = await fetch('/api/demo-request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })
  if (!response.ok) {
    throw new Error('submit_failed')
  }
}

export function DemoRequestDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<DemoRequestValues>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      teamSize: '16-50',
      need: 'visibilidad',
    },
  })

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form

  const teamSize = watch('teamSize')
  const need = watch('need')

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next)
    if (!next) {
      window.setTimeout(() => {
        setSuccess(false)
        setSubmitError(null)
        reset()
      }, 200)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null)
    try {
      await submitDemoRequest(values)
      setSuccess(true)
    } catch {
      try {
        window.location.href = buildDemoMailto(values)
        setSuccess(true)
      } catch {
        setSubmitError('No pudimos enviar la solicitud. Escríbenos a demo@scrumban.mx')
      }
    }
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0 sm:max-w-md">
        <div className="border-b border-border/60 bg-gradient-to-br from-muted/40 via-background to-primary/[0.04] px-5 py-5 sm:px-6">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-xl font-semibold tracking-tight">
              Solicitar demo
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Cuatro datos. Te contactamos en menos de 24 h.
            </DialogDescription>
          </DialogHeader>
        </div>

        {success ? (
          <div className="space-y-4 px-5 py-8 text-center sm:px-6">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-base font-semibold text-foreground">Solicitud recibida</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Un asesor revisará tu caso y te escribirá pronto para agendar la demo.
              </p>
            </div>
            <Button
              type="button"
              className="w-full rounded-full"
              onClick={() => handleOpenChange(false)}
            >
              Entendido
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 px-5 py-5 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="demo-name">Nombre</Label>
                <Input
                  id="demo-name"
                  autoComplete="name"
                  placeholder="Ana Martínez"
                  className="h-10 rounded-lg"
                  {...register('name')}
                />
                {errors.name ? (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-email">Email corporativo</Label>
                <Input
                  id="demo-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ana@empresa.com"
                  className="h-10 rounded-lg"
                  {...register('email')}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">{errors.email.message}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="demo-company">Empresa</Label>
              <Input
                id="demo-company"
                autoComplete="organization"
                placeholder="Nombre de la organización"
                className="h-10 rounded-lg"
                {...register('company')}
              />
              {errors.company ? (
                <p className="text-xs text-destructive">{errors.company.message}</p>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tamaño del equipo</Label>
                <Select
                  value={teamSize}
                  onValueChange={(value) =>
                    setValue('teamSize', value as DemoRequestValues['teamSize'], {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {demoTeamSizeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>¿Qué necesitas?</Label>
                <Select
                  value={need}
                  onValueChange={(value) =>
                    setValue('need', value as DemoRequestValues['need'], { shouldValidate: true })
                  }
                >
                  <SelectTrigger className="h-10 rounded-lg">
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {demoNeedOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {submitError ? <p className="text-xs text-destructive">{submitError}</p> : null}

            <Button
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'h-11 w-full gap-2 rounded-full text-sm font-semibold shadow-lg shadow-primary/20'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Enviando…
                </>
              ) : (
                <>
                  Enviar solicitud
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Sin compromiso · Demo personalizada · Respuesta en 24 h
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
