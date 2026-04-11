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
import { Switch } from '@/components/ui/switch'
import { registerPaymentSchema, type RegisterPaymentInput } from '@/lib/validations/payment'
import { formatCurrency } from '@/lib/utils'
import { calculateVat } from '@/lib/vat'
import { calculateCommission } from '@/lib/commission-calc'
import type { Payment, Contract, Unit, Tenant } from '@/types'

interface RegisterPaymentDialogProps {
  payment: Payment
  contract: Contract
  unit: Unit
  tenant: Tenant
  commissionRate: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterPaymentDialog({
  payment,
  contract,
  unit,
  tenant,
  commissionRate,
  open,
  onOpenChange,
}: RegisterPaymentDialogProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [applyCommission, setApplyCommission] = useState(true)

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
      commissionRate,
      applyCommission: true,
    },
  })

  async function onSubmit(data: RegisterPaymentInput) {
    setError(null)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        commissionRate,
        applyCommission,
      }),
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
  const vatBreakdown = calculateVat(
    Number(contract.currentPrice),
    contract.appliesVat,
    Number(contract.vatPercentage)
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription asChild>
            <div>
              <span>{unit.identifier} — {tenantName}</span>
              {contract.appliesVat ? (
                <div className="mt-2 rounded-lg border border-border bg-muted/50 px-3 py-2 space-y-1 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Alquiler:</span>
                    <span className="text-foreground">{formatCurrency(vatBreakdown.price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Base gravada ({Number(contract.vatPercentage)}%):</span>
                    <span className="text-foreground">{formatCurrency(vatBreakdown.vatableBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IVA 21%:</span>
                    <span className="text-foreground">{formatCurrency(vatBreakdown.vat)}</span>
                  </div>
                  <div className="flex justify-between font-semibold border-t border-border pt-1 mt-1">
                    <span className="text-foreground">Total:</span>
                    <span className="text-foreground">{formatCurrency(vatBreakdown.total)}</span>
                  </div>
                </div>
              ) : (
                <>
                  <br />
                  <span>A cobrar: <span className="font-mono font-medium text-foreground">{formatCurrency(contract.currentPrice)}</span></span>
                </>
              )}
            </div>
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

          {commissionRate > 0 && (
            <div className="space-y-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
              <div className="flex items-center gap-2">
                <Switch
                  checked={applyCommission}
                  onCheckedChange={setApplyCommission}
                />
                <Label className="text-sm">Aplicar comisión ({commissionRate}%)</Label>
              </div>
              {applyCommission && (() => {
                const comm = calculateCommission(Number(contract.currentPrice), commissionRate, true)
                return (
                  <div className="space-y-1 text-sm font-mono">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comisión:</span>
                      <span>{formatCurrency(comm.commission)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Neto:</span>
                      <span>{formatCurrency(comm.net)}</span>
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

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
