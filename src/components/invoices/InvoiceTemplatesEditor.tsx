'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: 'Departamento',
  local: 'Local',
  land: 'Terreno',
  house: 'Casa',
  other: 'Otro',
}

interface TemplateItem {
  unitType: string
  template: string
  saved: boolean
}

export function InvoiceTemplatesEditor({ templates }: { templates: TemplateItem[] }) {
  const [items, setItems] = useState(templates)
  const [saving, setSaving] = useState<string | null>(null)

  async function handleSave(unitType: string) {
    const item = items.find((i) => i.unitType === unitType)
    if (!item) return

    setSaving(unitType)
    try {
      const res = await fetch('/api/invoice-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unitType: item.unitType, template: item.template }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string }
        toast.error(json.error ?? 'Error al guardar')
        return
      }

      setItems((prev) =>
        prev.map((i) => (i.unitType === unitType ? { ...i, saved: true } : i))
      )
      toast.success(`Template de ${UNIT_TYPE_LABELS[unitType]} guardado`)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {items.map((item) => (
        <div key={item.unitType} className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">{UNIT_TYPE_LABELS[item.unitType]}</Label>
            <Button
              size="sm"
              variant="outline"
              className="cursor-pointer"
              disabled={saving === item.unitType}
              onClick={() => handleSave(item.unitType)}
            >
              {saving === item.unitType ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
          <Textarea
            value={item.template}
            onChange={(e) =>
              setItems((prev) =>
                prev.map((i) =>
                  i.unitType === item.unitType ? { ...i, template: e.target.value } : i
                )
              )
            }
            className="resize-none h-20 text-sm"
          />
        </div>
      ))}
    </div>
  )
}
