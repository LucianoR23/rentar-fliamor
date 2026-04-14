'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface CommissionFormProps {
  defaultPercentage: number
  canEdit: boolean
}

export function CommissionForm({ defaultPercentage, canEdit }: CommissionFormProps) {
  const [percentage, setPercentage] = useState(String(defaultPercentage))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)

    const res = await fetch('/api/settings/commission', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ percentage: Number(percentage) }),
    })

    if (res.ok) {
      setSaved(true)
      toast.success('Comisión guardada')
      setTimeout(() => setSaved(false), 2000)
    } else {
      const body = (await res.json()) as { error?: string }
      const msg = body.error ?? 'Error al guardar'
      setError(msg)
      toast.error(msg)
    }
    setSaving(false)
  }

  return (
    <div className="flex items-end gap-3">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Porcentaje de comisión (%)</label>
        <Input
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          disabled={!canEdit}
          className="font-mono max-w-32"
        />
      </div>
      {canEdit && (
        <Button onClick={handleSave} disabled={saving} className="cursor-pointer">
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
        </Button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
