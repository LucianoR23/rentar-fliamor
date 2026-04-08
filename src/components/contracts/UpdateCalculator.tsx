'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calculator, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CalculationPreview } from '@/lib/compute-update'

interface UpdateCalculatorProps {
  contractId: string
}

const UPDATE_TYPE_LABELS: Record<string, string> = {
  icl: 'ICL — Índice para Contratos de Locación',
  ipc: 'IPC — Índice de Precios al Consumidor',
  fixed_amount: 'Monto fijo',
  fixed_percentage: 'Porcentaje fijo',
}

function formatARS(value: number) {
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}

export function UpdateCalculator({ contractId }: UpdateCalculatorProps) {
  const router = useRouter()
  const [preview, setPreview] = useState<CalculationPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCalculate() {
    setLoading(true)
    setError(null)
    setPreview(null)
    setApplied(false)

    const res = await fetch(`/api/contracts/${contractId}/calculate`)
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      setError(json.error ?? 'Error al calcular')
      setLoading(false)
      return
    }
    setPreview(await res.json() as CalculationPreview)
    setLoading(false)
  }

  async function handleApply() {
    setApplying(true)
    setError(null)

    const res = await fetch(`/api/contracts/${contractId}/apply-update`, { method: 'POST' })
    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      setError(json.error ?? 'Error al aplicar')
      setApplying(false)
      return
    }

    setApplied(true)
    setApplying(false)
    setPreview(null)
    router.refresh()
  }

  return (
    <div className="rounded-lg border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Calculadora de actualización</h3>
        </div>
        {!applied && (
          <Button
            size="sm"
            variant={preview ? 'outline' : 'default'}
            onClick={handleCalculate}
            disabled={loading || applying}
          >
            {loading ? 'Calculando...' : preview ? 'Recalcular' : 'Calcular actualización'}
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {applied && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Actualización aplicada. El contrato fue actualizado y el historial fue guardado.
        </div>
      )}

      {preview && !applied && (
        <div className="space-y-3">
          {/* Price summary */}
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Precio actual</p>
              <p className="font-mono tabular-nums font-semibold">${formatARS(preview.currentPrice)}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-0.5">Nuevo precio</p>
              <p className="font-mono tabular-nums font-semibold text-success">${formatARS(preview.newPrice)}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs text-muted-foreground mb-0.5">Aumento</p>
              <p className="font-mono tabular-nums font-semibold flex items-center gap-1 justify-end text-success">
                <TrendingUp className="h-3.5 w-3.5" />
                +{preview.percentageChange.toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Detail */}
          <div className="divide-y divide-border rounded-lg border border-border px-4">
            <Row label="Diferencia" value={
              <span className="font-mono tabular-nums text-success">+${formatARS(preview.difference)}</span>
            } />
            <Row label="Tipo de actualización" value={UPDATE_TYPE_LABELS[preview.updateType] ?? preview.updateType} />
            <Row label="Período" value={`${preview.periodMonths} ${preview.periodMonths === 1 ? 'mes' : 'meses'}`} />

            {(preview.updateType === 'icl' || preview.updateType === 'ipc') && (
              <>
                {preview.indexVariation != null && (
                  <Row label={`Variación ${preview.updateType.toUpperCase()}`} value={
                    <span className="font-mono tabular-nums font-medium">+{preview.indexVariation.toFixed(2)}%</span>
                  } />
                )}
                {preview.schedule && preview.schedule.length > 1 && (
                  <div className="py-2">
                    <p className="text-xs text-muted-foreground mb-1.5">Cronograma de actualizaciones:</p>
                    <div className="space-y-1">
                      {preview.schedule.map((p, i) => (
                        <div key={p.date} className="flex items-center justify-between text-xs">
                          <span className={cn("font-mono tabular-nums", p.estimated && "text-muted-foreground italic")}>
                            {p.date}{p.estimated ? ' (est.)' : ''}
                          </span>
                          <span className="font-mono tabular-nums">
                            ${formatARS(p.amount)}
                            {i > 0 && <span className="text-muted-foreground ml-1.5">+{p.dif.toFixed(2)}%</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {preview.updateType === 'fixed_percentage' && (
              <Row label="Porcentaje configurado" value={
                <span className="font-mono tabular-nums">{preview.updateValue?.toFixed(2)}%</span>
              } />
            )}
            {preview.updateType === 'fixed_amount' && (
              <Row label="Monto fijo" value={
                <span className="font-mono tabular-nums">${formatARS(preview.updateValue ?? 0)}</span>
              } />
            )}
            <Row label="Próxima actualización" value={
              <span className="font-mono text-xs">{preview.nextUpdateDate}</span>
            } />
          </div>

          <Button className="w-full" onClick={handleApply} disabled={applying}>
            {applying ? 'Aplicando...' : 'Aplicar actualización'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Actualizará el precio del contrato y registrará el historial de cambio.
          </p>
        </div>
      )}
    </div>
  )
}
