'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { costDistributionSchema, type CostDistributionFormData } from '@/lib/validations/group'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface CostDistributionFormProps {
  groupId: string
  defaultValues?: Partial<CostDistributionFormData>
}

const UNIT_TYPES = Object.keys(UNIT_TYPE_LABELS) as (keyof typeof UNIT_TYPE_LABELS)[]

export function CostDistributionForm({ groupId, defaultValues }: CostDistributionFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CostDistributionFormData>({
    resolver: zodResolver(costDistributionSchema),
    defaultValues: {
      apartment: 0,
      local: 0,
      land: 0,
      house: 0,
      other: 0,
      ...defaultValues,
    },
  })

  const values = watch()
  const total = UNIT_TYPES.reduce((sum, type) => sum + (Number(values[type]) || 0), 0)

  async function onSubmit(data: CostDistributionFormData) {
    setServerError(null)
    const res = await fetch(`/api/groups/${groupId}/costs`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      setServerError(json.error ?? 'Ocurrió un error')
      return
    }

    router.push(`/groups/${groupId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
      <p className="text-sm text-muted-foreground">
        Configurá qué porcentaje de los gastos del grupo le corresponde a cada tipo de unidad.
        La suma total no puede superar el 100%.
      </p>

      <div className="space-y-3">
        {UNIT_TYPES.map((type) => (
          <div key={type} className="flex items-center gap-4">
            <Label className="w-32 shrink-0 text-sm">{UNIT_TYPE_LABELS[type]}</Label>
            <div className="flex items-center gap-2">
              <Input
                {...register(type)}
                type="number"
                min="0"
                max="100"
                step="0.01"
                className="w-24 font-mono tabular-nums"
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            {errors[type] && (
              <p className="text-xs text-destructive">{errors[type]?.message}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3">
        <span className="text-sm font-medium">Total:</span>
        <span
          className={`font-mono tabular-nums text-sm font-semibold ${
            total > 100 ? 'text-destructive' : total === 100 ? 'text-success' : 'text-foreground'
          }`}
        >
          {total.toFixed(2)}%
        </span>
        {total > 100 && (
          <span className="text-xs text-destructive ml-1">— supera el 100%</span>
        )}
      </div>

      {total > 100 && (
        <p className="text-sm text-destructive">La suma de porcentajes no puede superar el 100%</p>
      )}

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar configuración'}
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
