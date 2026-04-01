'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/ui/currency-input'
import { CostBreakdownTable } from './CostBreakdownTable'
import { groupExpenseSchema, type GroupExpenseFormData } from '@/lib/validations/group-expense'
import type { DistributionUnit, DistributionConfig } from '@/lib/rent-calculator'

const MONTHS = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
]

interface GroupExpenseFormProps {
  groupId: string
  activeUnits: DistributionUnit[]
  costConfig: DistributionConfig[]
}

export function GroupExpenseForm({ groupId, activeUnits, costConfig }: GroupExpenseFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const now = new Date()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<GroupExpenseFormData>({
    resolver: zodResolver(groupExpenseSchema),
    defaultValues: {
      groupId,
      periodMonth: now.getMonth() + 1,
      periodYear: now.getFullYear(),
    },
  })

  const amount = Number(watch('amount')) || 0

  async function onSubmit(data: GroupExpenseFormData) {
    setServerError(null)
    const res = await fetch('/api/group-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      router.push(`/groups/${groupId}?tab=expenses`)
      router.refresh()
    } else {
      const json = (await res.json()) as { error?: string }
      setServerError(json.error ?? 'Error al guardar')
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <input type="hidden" {...register('groupId')} />

        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre del gasto *</Label>
          <Input
            id="name"
            placeholder="Ej: Expensas comunes, limpieza, etc."
            aria-invalid={!!errors.name}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="amount">Monto (ARS) *</Label>
          <CurrencyInput
            id="amount"
            placeholder="0.00"
            aria-invalid={!!errors.amount}
            {...register('amount')}
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="periodMonth">Mes *</Label>
            <select
              id="periodMonth"
              aria-invalid={!!errors.periodMonth}
              className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
              {...register('periodMonth')}
            >
              {MONTHS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {errors.periodMonth && <p className="text-xs text-destructive">{errors.periodMonth.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="periodYear">Año *</Label>
            <Input
              id="periodYear"
              type="number"
              min={2000}
              max={2100}
              className="font-mono"
              aria-invalid={!!errors.periodYear}
              {...register('periodYear')}
            />
            {errors.periodYear && <p className="text-xs text-destructive">{errors.periodYear.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            rows={3}
            placeholder="Observaciones opcionales..."
            {...register('notes')}
          />
        </div>

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : 'Guardar gasto'}
          </Button>
        </div>
      </form>

      {/* Breakdown preview */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Desglose por unidad</h2>
        <p className="text-xs text-muted-foreground">
          {activeUnits.length} unidad{activeUnits.length !== 1 ? 'es' : ''} activa{activeUnits.length !== 1 ? 's' : ''}
        </p>
        <CostBreakdownTable amount={amount} units={activeUnits} costConfig={costConfig} />
      </div>
    </div>
  )
}
