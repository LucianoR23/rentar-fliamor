'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/ui/currency-input'
import { DateInput } from '@/components/ui/date-input'
import { FilesSection } from '@/components/files/FilesSection'
import { expenseSchema, type ExpenseFormData } from '@/lib/validations/expense'

export function ExpenseForm() {
  const router = useRouter()
  const [createdId, setCreatedId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: new Date().toISOString().slice(0, 10),
    },
  })

  async function onSubmit(data: ExpenseFormData) {
    setServerError(null)
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const created = (await res.json()) as { id: string }
      setCreatedId(created.id)
    } else {
      const json = (await res.json()) as { error?: string }
      setServerError(json.error ?? 'Error al guardar')
    }
  }

  if (createdId) {
    return (
      <div className="max-w-lg space-y-6">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle2 className="h-5 w-5" />
          <p className="font-medium">Gasto registrado correctamente.</p>
        </div>

        <FilesSection
          entityType="expense"
          entityId={createdId}
          initialFiles={[]}
          canUpload
          canDelete
        />

        <Button onClick={() => router.push('/expenses')}>
          Finalizar
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          placeholder="Ej: Factura electricidad, reparación, etc."
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
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
          <Label htmlFor="category">Categoría</Label>
          <Input
            id="category"
            placeholder="Ej: Servicios, Mantenimiento…"
            {...register('category')}
          />
          {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expenseDate">Fecha *</Label>
          <DateInput
            id="expenseDate"
            aria-invalid={!!errors.expenseDate}
            {...register('expenseDate')}
          />
          {errors.expenseDate && <p className="text-xs text-destructive">{errors.expenseDate.message}</p>}
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
        <Button className='cursor-pointer' type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button className='cursor-pointer' type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Guardar gasto'}
        </Button>
      </div>
    </form>
  )
}
