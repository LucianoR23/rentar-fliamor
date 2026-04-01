'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { DateInput } from '@/components/ui/date-input'
import { registerPaymentSchema, type RegisterPaymentInput } from '@/lib/validations/payment'
import { formatCurrency } from '@/lib/utils'
import type { Payment, Contract, Unit, Tenant } from '@/types'

interface RegisterPaymentDialogProps {
  payment: Payment
  contract: Contract
  unit: Unit
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterPaymentDialog({
  payment,
  contract,
  unit,
  tenant,
  open,
  onOpenChange,
}: RegisterPaymentDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegisterPaymentInput>({
    resolver: zodResolver(registerPaymentSchema),
    defaultValues: {
      paymentId: payment.id,
      amountPaid: Number(payment.amountDue),
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
    },
  })

  async function onSubmit(data: RegisterPaymentInput) {
    setError(null)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      reset()
      onOpenChange(false)
      router.refresh()
    } else {
      const body = (await res.json()) as { error?: string }
      setError(body.error ?? 'Error al registrar el pago')
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset()
      setError(null)
    }
    onOpenChange(open)
  }

  const tenantName = `${tenant.lastName}, ${tenant.firstName}`

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            {unit.identifier} — {tenantName}
            <br />
            A cobrar: <span className="font-mono font-medium text-foreground">{formatCurrency(contract.currentPrice)}</span>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...register('paymentId')} />

          <div className="space-y-1.5">
            <Label htmlFor="amountPaid">Monto cobrado (ARS)</Label>
            <CurrencyInput
              id="amountPaid"
              placeholder="0.00"
              aria-invalid={!!errors.amountPaid}
              {...register('amountPaid')}
            />
            {errors.amountPaid && (
              <p className="text-xs text-destructive">{errors.amountPaid.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentDate">Fecha de pago</Label>
            <DateInput
              id="paymentDate"
              aria-invalid={!!errors.paymentDate}
              {...register('paymentDate')}
            />
            {errors.paymentDate && (
              <p className="text-xs text-destructive">{errors.paymentDate.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Observaciones opcionales..."
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Confirmar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
