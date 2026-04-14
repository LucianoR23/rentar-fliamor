'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contractSchema, UPDATE_TYPE_LABELS, type ContractFormData } from '@/lib/validations/contract'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
import { Input } from '@/components/ui/input'
import { DateInput } from '@/components/ui/date-input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { calculateVat } from '@/lib/vat'
import { formatCurrency } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'

interface UnitOption { id: string; identifier: string; type: string }
interface TenantOption { id: string; firstName: string; lastName: string }

interface ContractFormProps {
  defaultValues?: Partial<ContractFormData>
  contractId?: string
  units: UnitOption[]
  tenants: TenantOption[]
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function ContractForm({ defaultValues, contractId, units, tenants }: ContractFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!contractId

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractSchema),
    defaultValues: { updateType: 'icl', updateFrequencyMonths: 3, ...defaultValues },
  })

  const updateType = useWatch({ control, name: 'updateType' })
  const needsUpdateValue = updateType === 'fixed_amount' || updateType === 'fixed_percentage'

  const appliesVat = useWatch({ control, name: 'appliesVat' })
  const vatPercentage = useWatch({ control, name: 'vatPercentage' }) ?? 100
  const firstMonthPrice = useWatch({ control, name: 'firstMonthPrice' })
  const vatBreakdown = calculateVat(Number(firstMonthPrice) || 0, appliesVat ?? false, Number(vatPercentage))

  async function onSubmit(data: ContractFormData) {
    setServerError(null)
    const url = isEdit ? `/api/contracts/${contractId}` : '/api/contracts'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      const msg = json.error ?? 'Ocurrió un error'
      setServerError(msg)
      toast.error(msg)
      return
    }

    const contract = await res.json() as { id: string }
    toast.success(isEdit ? 'Contrato actualizado' : 'Contrato creado')
    router.push(`/contracts/${contract.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      {/* Partes */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Partes</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unidad *" error={errors.unitId?.message}>
            <Controller name="unitId" control={control} render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className='cursor-pointer'><SelectValue placeholder="Seleccionar unidad" /></SelectTrigger>
                <SelectContent>
                  {[...units].sort((a, b) => a.identifier.localeCompare(b.identifier)).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.identifier} — {UNIT_TYPE_LABELS[u.type as keyof typeof UNIT_TYPE_LABELS] ?? u.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </Field>

          <Field label="Inquilino *" error={errors.tenantId?.message}>
            <Controller name="tenantId" control={control} render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger className='cursor-pointer'><SelectValue placeholder="Seleccionar inquilino" /></SelectTrigger>
                <SelectContent>
                  {[...tenants].sort((a, b) => `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`)).map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.lastName}, {t.firstName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </Field>
        </div>
      </section>

      {/* Fechas */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vigencia</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de inicio *" error={errors.startDate?.message}>
            <DateInput {...register('startDate')} />
          </Field>
          <Field label="Fecha de fin *" error={errors.endDate?.message}>
            <DateInput {...register('endDate')} />
          </Field>
        </div>
      </section>

      {/* Precio */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Precio y depósito</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Precio primer mes (ARS) *" error={errors.firstMonthPrice?.message}>
            <Input {...register('firstMonthPrice')} type="number" min="0" step="0.01" placeholder="150000" className="font-mono" />
          </Field>
          <Field label="Depósito (ARS)" error={errors.depositAmount?.message}>
            <Input {...register('depositAmount')} type="number" min="0" step="0.01" placeholder="300000" className="font-mono" />
          </Field>
        </div>
      </section>

      {/* IVA */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IVA</h2>
        <div className="flex items-center gap-3">
          <Controller name="appliesVat" control={control} render={({ field }) => (
            <Switch
              checked={field.value ?? false}
              onCheckedChange={field.onChange}
            />
          )} />
          <Label className="text-sm">Aplica IVA 21%</Label>
        </div>

        {appliesVat && (
          <>
            <Field label="Porcentaje del alquiler gravado (%)" error={errors.vatPercentage?.message}>
              <Input
                {...register('vatPercentage')}
                type="number"
                min="1"
                max="100"
                step="0.01"
                placeholder="100"
                className="font-mono max-w-32"
              />
            </Field>

            {Number(firstMonthPrice) > 0 && (
              <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 space-y-1 text-sm font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alquiler:</span>
                  <span>{formatCurrency(vatBreakdown.price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Base gravada ({vatPercentage}%):</span>
                  <span>{formatCurrency(vatBreakdown.vatableBase)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA 21%:</span>
                  <span>{formatCurrency(vatBreakdown.vat)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                  <span>Total a cobrar:</span>
                  <span>{formatCurrency(vatBreakdown.total)}</span>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Administración */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Administración</h2>
        <Field label="Administrado desde" error={errors.managedSince?.message}>
          <DateInput {...register('managedSince')} />
        </Field>
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
          Dejar vacío si se administra desde el inicio del contrato. Si se toma un contrato en curso,
          indicar la fecha desde la que se administra. No se generarán pagos para meses anteriores.
        </p>
      </section>

      {/* Actualización */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actualización</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo de actualización *" error={errors.updateType?.message}>
            <Controller name="updateType" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='cursor-pointer'><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(UPDATE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </Field>

          <Field label="Frecuencia (meses) *" error={errors.updateFrequencyMonths?.message}>
            <Input {...register('updateFrequencyMonths')} type="number" min="1" max="36" placeholder="3" className="font-mono" />
          </Field>
        </div>

        {needsUpdateValue && (
          <Field
            label={updateType === 'fixed_amount' ? 'Monto a sumar (ARS) *' : 'Porcentaje de aumento (%) *'}
            error={errors.updateValue?.message}
          >
            <Input
              {...register('updateValue')}
              type="number"
              min="0"
              step={updateType === 'fixed_amount' ? '0.01' : '0.01'}
              placeholder={updateType === 'fixed_amount' ? '10000' : '15.5'}
              className="font-mono max-w-48"
            />
          </Field>
        )}

        {(updateType === 'icl' || updateType === 'ipc') && (
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            El valor de actualización se calculará automáticamente usando el índice{' '}
            <strong>{updateType.toUpperCase()}</strong> al momento de aplicar cada actualización.
          </p>
        )}
      </section>

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button className='cursor-pointer' type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear contrato'}
        </Button>
        <Button className='cursor-pointer' type="button" variant="ghost" onClick={() => router.back()}>Cancelar</Button>
      </div>
    </form>
  )
}
