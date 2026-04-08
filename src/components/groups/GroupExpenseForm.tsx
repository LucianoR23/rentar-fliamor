'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/ui/currency-input'
import { CostBreakdownTable } from './CostBreakdownTable'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
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
  const [selectedUnitIds, setSelectedUnitIds] = useState<Set<string>>(new Set())

  const allSelected = selectedUnitIds.size === 0

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

  const filteredUnits = useMemo(
    () => (allSelected ? activeUnits : activeUnits.filter((u) => selectedUnitIds.has(u.id))),
    [activeUnits, selectedUnitIds, allSelected]
  )

  function toggleUnit(unitId: string) {
    setSelectedUnitIds((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }

  function selectAll() {
    setSelectedUnitIds(new Set())
  }

  async function onSubmit(data: GroupExpenseFormData) {
    setServerError(null)
    const payload = {
      ...data,
      unitIds: allSelected ? undefined : [...selectedUnitIds],
    }
    const res = await fetch('/api/group-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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

        {/* Unit selection */}
        <div className="space-y-2">
          <Label>Aplica a</Label>
          <p className="text-xs text-muted-foreground">
            Seleccioná las unidades a las que aplica este gasto. Si no seleccionás ninguna, se divide entre todas.
          </p>
          <div className="rounded-lg border border-border p-3 space-y-1.5 max-h-56 overflow-y-auto">
            <label className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted/50">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={selectAll}
                className="h-4 w-4 rounded border-border accent-primary"
              />
              <span className="text-sm font-medium">Todas las unidades</span>
            </label>
            <div className="border-t border-border my-1" />
            {activeUnits.map((unit) => (
              <label
                key={unit.id}
                className="flex items-center gap-2 cursor-pointer py-1 px-1 rounded hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={selectedUnitIds.has(unit.id)}
                  onChange={() => toggleUnit(unit.id)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-sm font-mono tabular-nums">{unit.identifier}</span>
                <span className="text-xs text-muted-foreground">
                  {UNIT_TYPE_LABELS[unit.type] ?? unit.type}
                </span>
              </label>
            ))}
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
          {filteredUnits.length} unidad{filteredUnits.length !== 1 ? 'es' : ''}{' '}
          {allSelected ? '' : `de ${activeUnits.length} seleccionada${filteredUnits.length !== 1 ? 's' : ''}`}
        </p>
        <CostBreakdownTable amount={amount} units={filteredUnits} costConfig={costConfig} />
      </div>
    </div>
  )
}
