'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { ManualCharge } from '@/types'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

interface ManualChargesSectionProps {
  unitId: string
  unitIdentifier: string
}

export function ManualChargesSection({ unitId, unitIdentifier }: ManualChargesSectionProps) {
  const router = useRouter()
  const [charges, setCharges] = useState<ManualCharge[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ManualCharge | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Form state
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [periodMonth, setPeriodMonth] = useState(new Date().getMonth() + 1)
  const [periodYear, setPeriodYear] = useState(new Date().getFullYear())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/manual-charges?unitId=${unitId}`)
      .then((r) => r.json())
      .then((data) => { setCharges(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [unitId])

  function openCreate() {
    setEditing(null)
    setDescription('')
    setAmount('')
    setPeriodMonth(new Date().getMonth() + 1)
    setPeriodYear(new Date().getFullYear())
    setNotes('')
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(charge: ManualCharge) {
    setEditing(charge)
    setDescription(charge.description)
    setAmount(charge.amount)
    setPeriodMonth(charge.periodMonth)
    setPeriodYear(charge.periodYear)
    setNotes(charge.notes ?? '')
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!description.trim()) { setError('La descripción es requerida'); return }
    const numAmount = parseFloat(amount)
    if (!numAmount || numAmount <= 0) { setError('El monto debe ser mayor a 0'); return }

    setSaving(true)
    setError(null)
    try {
      const url = editing ? `/api/manual-charges/${editing.id}` : '/api/manual-charges'
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitId,
          description: description.trim(),
          amount: numAmount,
          periodMonth,
          periodYear,
          notes: notes.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Error al guardar')
        return
      }
      const saved = await res.json()
      if (editing) {
        setCharges((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
      } else {
        setCharges((prev) => [...prev, saved])
      }
      setDialogOpen(false)
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/manual-charges/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCharges((prev) => prev.filter((c) => c.id !== id))
        router.refresh()
      }
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Cargos manuales
        </h2>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />Nuevo cargo
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : charges.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay cargos manuales para esta unidad.</p>
      ) : (
        <div className="space-y-2">
          {charges.map((charge) => (
            <div
              key={charge.id}
              className="flex items-center justify-between rounded-md border border-border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{charge.description}</p>
                <p className="text-xs text-muted-foreground">
                  {MONTHS[charge.periodMonth - 1]} {charge.periodYear}
                  {charge.notes ? ` · ${charge.notes}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span className="font-mono tabular-nums text-sm font-medium">
                  {formatCurrency(charge.amount)}
                </span>
                <Button variant="ghost" size="icon-xs" onClick={() => openEdit(charge)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-danger hover:text-danger"
                  onClick={() => handleDelete(charge.id)}
                  disabled={deleting === charge.id}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cargo' : 'Nuevo cargo'}</DialogTitle>
            <DialogDescription>{unitIdentifier}</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label htmlFor="mc-desc">Descripción</Label>
              <Input
                id="mc-desc"
                placeholder="Ej: Reparación caño"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={255}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="mc-amount">Monto</Label>
              <Input
                id="mc-amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1.5 font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="mc-month">Mes</Label>
                <Input
                  id="mc-month"
                  type="number"
                  min={1}
                  max={12}
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="mc-year">Año</Label>
                <Input
                  id="mc-year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={periodYear}
                  onChange={(e) => setPeriodYear(Number(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="mc-notes">Notas (opcional)</Label>
              <Textarea
                id="mc-notes"
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
            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving || !description.trim() || !amount}>
              {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear cargo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
