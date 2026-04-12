'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import type { Payment, Unit, Tenant } from '@/types'

interface CancelPaymentDialogProps {
  payment: Payment
  unit: Unit
  tenant: Tenant
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CancelPaymentDialog({
  payment,
  unit,
  tenant,
  open,
  onOpenChange,
}: CancelPaymentDialogProps) {
  const router = useRouter()
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel() {
    if (!reason.trim()) {
      setError('El motivo es requerido')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/payments/${payment.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId: payment.id, reason: reason.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al cancelar el pago')
        toast.error('Error al cancelar el pago')
        return
      }
      onOpenChange(false)
      router.refresh()
      toast.success('Pago anulado')
    } catch {
      setError('Error de conexión')
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar pago</DialogTitle>
          <DialogDescription>
            {unit.identifier} — {tenant.lastName}, {tenant.firstName} — {formatCurrency(payment.amountDue)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="cancel-reason">Motivo de cancelación</Label>
            <Textarea
              id="cancel-reason"
              placeholder="Ingrese el motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={3}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">{reason.length}/500</p>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Volver
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading || !reason.trim()}>
            {loading ? 'Cancelando...' : 'Confirmar cancelación'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
