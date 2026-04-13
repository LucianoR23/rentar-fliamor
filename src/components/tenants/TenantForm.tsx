'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { tenantSchema, type TenantFormData } from '@/lib/validations/tenant'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TAX_CONDITION_LABELS } from '@/lib/validations/invoice'
import { toast } from 'sonner'

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
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantSchema),
    defaultValues,
  })

  const taxCondition = useWatch({ control, name: 'taxCondition' })

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
    toast.success(isEdit ? 'Inquilino actualizado' : 'Inquilino creado')
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
        <Field label="CUIT/CUIL/DNI *" error={errors.cuitDni?.message}>
          <Input {...register('cuitDni')} placeholder="20123456789" className="max-w-48" inputMode="numeric" pattern="\d*" onKeyDown={(e) => { if (!/\d|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) e.preventDefault() }} />
        </Field>
        <Field label="Condición fiscal" error={errors.taxCondition?.message}>
          <Select
            value={taxCondition ?? '__none__'}
            onValueChange={(v) => setValue('taxCondition', v === '__none__' ? undefined : v as NonNullable<TenantFormData['taxCondition']>, { shouldValidate: true })}
          >
            <SelectTrigger className="max-w-64">
              <SelectValue placeholder="Seleccionar (opcional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin especificar</SelectItem>
              {Object.entries(TAX_CONDITION_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </section>

      {/* Contacto */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Contacto
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Teléfono *" error={errors.phone?.message}>
            <Input {...register('phone')} placeholder="5491112345678" inputMode="numeric" pattern="\d*" onKeyDown={(e) => { if (!/\d|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) e.preventDefault() }} />
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
          <Field label="CUIT/CUIL/DNI" error={errors.guarantorCuitDni?.message}>
            <Input {...register('guarantorCuitDni')} placeholder="20876543219" inputMode="numeric" pattern="\d*" onKeyDown={(e) => { if (!/\d|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) e.preventDefault() }} />
          </Field>
        </div>
        <Field label="Teléfono" error={errors.guarantorPhone?.message}>
          <Input
            {...register('guarantorPhone')}
            placeholder="5491187654321"
            className="max-w-64"
            inputMode="numeric"
            pattern="\d*"
            onKeyDown={(e) => { if (!/\d|Backspace|Tab|ArrowLeft|ArrowRight|Delete/.test(e.key)) e.preventDefault() }}
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
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button className='cursor-pointer' type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear inquilino'}
        </Button>
        <Button className='cursor-pointer' type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
