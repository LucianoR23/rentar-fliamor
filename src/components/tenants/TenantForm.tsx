'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tenantSchema, type TenantFormData } from '@/lib/validations/tenant'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface TenantFormProps {
  defaultValues?: Partial<TenantFormData>
  tenantId?: string
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

export function TenantForm({ defaultValues, tenantId }: TenantFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!tenantId

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues,
  })

  async function onSubmit(data: TenantFormData) {
    setServerError(null)
    const url = isEdit ? `/api/tenants/${tenantId}` : '/api/tenants'
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

    const tenant = await res.json() as { id: string }
    router.push(`/tenants/${tenant.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {/* Datos personales */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Datos personales
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre *" error={errors.firstName?.message}>
            <Input {...register('firstName')} placeholder="Juan" />
          </Field>
          <Field label="Apellido *" error={errors.lastName?.message}>
            <Input {...register('lastName')} placeholder="García" />
          </Field>
        </div>
        <Field label="DNI *" error={errors.dni?.message}>
          <Input {...register('dni')} placeholder="12345678" className="max-w-48" />
        </Field>
      </section>

      {/* Contacto */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Contacto
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono *" error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="+54 9 11 1234-5678" />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input {...register('email')} type="email" placeholder="juan@ejemplo.com" />
          </Field>
        </div>
        <Field label="Dirección" error={errors.address?.message}>
          <Input {...register('address')} placeholder="Av. Corrientes 1234, CABA" />
        </Field>
      </section>

      {/* Garante */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Garante (opcional)
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" error={errors.guarantorName?.message}>
            <Input {...register('guarantorName')} placeholder="María López" />
          </Field>
          <Field label="DNI" error={errors.guarantorDni?.message}>
            <Input {...register('guarantorDni')} placeholder="87654321" />
          </Field>
        </div>
        <Field label="Teléfono" error={errors.guarantorPhone?.message}>
          <Input
            {...register('guarantorPhone')}
            placeholder="+54 9 11 8765-4321"
            className="max-w-64"
          />
        </Field>
      </section>

      {/* Notas */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Notas
        </h2>
        <Field label="" error={errors.notes?.message}>
          <Textarea
            {...register('notes')}
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear inquilino'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
