'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ManualChargeDialogProps {
  unitId: string
  unitIdentifier: string
  tenantName: string
  month: number
  year: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManualChargeDialog({
  unitId,
  unitIdentifier,
  tenantName,
  month,
  year,
  open,
  onOpenChange,
}: ManualChargeDialogProps) {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setDescription('')
    setAmount('')
    setNotes('')
    setError(null)
  }

  async function handleSubmit() {
    if (!description.trim()) {
      setError('La descripción es requerida')
      return
    }
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) {
      setError('El monto debe ser mayor a 0')
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/manual-charges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          description: description.trim(),
          amount: numAmount,
          periodMonth: month,
          periodYear: year,
          notes: notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al crear el cargo')
        return
      }
      reset()
      onOpenChange(false)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Agregar cargo</DialogTitle>
          <DialogDescription>
            {unitIdentifier} — {tenantName} — Período {month}/{year}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="charge-desc">Descripción</Label>
            <Input
              id="charge-desc"
              placeholder="Ej: Reparación caño"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={255}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="charge-amount">Monto</Label>
            <Input
              id="charge-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1.5 font-mono"
            />
          </div>
          <div>
            <Label htmlFor="charge-notes">Notas (opcional)</Label>
            <Textarea
              id="charge-notes"
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={2}
              className="mt-1.5"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !description.trim() || !amount}>
            {loading ? 'Guardando...' : 'Agregar cargo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
