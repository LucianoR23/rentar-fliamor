'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { groupSchema, type GroupFormData } from '@/lib/validations/group'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface GroupFormProps {
  defaultValues?: Partial<GroupFormData>
  groupId?: string
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function GroupForm({ defaultValues, groupId }: GroupFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!groupId

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GroupFormData>({
    resolver: zodResolver(groupSchema),
    defaultValues,
  })

  async function onSubmit(data: GroupFormData) {
    setServerError(null)
    const url = isEdit ? `/api/groups/${groupId}` : '/api/groups'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      setServerError(json.error ?? 'Ocurrió un error')
      return
    }

    const group = await res.json() as { id: string }
    router.push(`/groups/${group.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Datos del grupo
        </h2>

        <Field label="Nombre *" error={errors.name?.message}>
          <Input {...register('name')} placeholder="Ej: Edificio Belgrano" />
        </Field>

        <Field label="Dirección *" error={errors.address?.message}>
          <Input {...register('address')} placeholder="Av. Belgrano 1234, CABA" />
        </Field>

        <Field label="Descripción" error={errors.description?.message}>
          <Textarea
            {...register('description')}
            placeholder="Observaciones adicionales..."
            className="resize-none h-24"
          />
        </Field>
      </section>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <Button className='cursor-pointer' type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear grupo'}
        </Button>
        <Button className='cursor-pointer' type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
