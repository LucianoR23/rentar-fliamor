'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'
import { Calculator, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateRentUpdate } from '@/lib/rent-calculator'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface UpdateCalculatorProps {
  contractId: string
  currentPrice: number
  updateType: 'icl' | 'ipc' | 'fixed_amount' | 'fixed_percentage'
  updateValue?: number
  updateFrequencyMonths: number
  nextUpdateDate: string
}

const UPDATE_TYPE_LABELS: Record<string, string> = {
  icl: 'ICL — Índice para Contratos de Locación',
  ipc: 'IPC — Índice de Precios al Consumidor',
  fixed_amount: 'Monto fijo',
  fixed_percentage: 'Porcentaje fijo',
}

export function UpdateCalculator({
  contractId,
  currentPrice,
  updateType,
  updateValue,
  updateFrequencyMonths,
  nextUpdateDate,
}: UpdateCalculatorProps) {
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const isIndex = updateType === 'icl' || updateType === 'ipc'

  // Calculate how many updates are overdue
  const pendingCount = (() => {
    const today = new Date()
    const d = new Date(nextUpdateDate + 'T00:00:00')
    let count = 0
    while (d <= today) {
      count++
      d.setMonth(d.getMonth() + updateFrequencyMonths)
    }
    return count
  })()

  const [open, setOpen] = useState(false)
  const [priceInput, setPriceInput] = useState(String(currentPrice))
  const [indexInput, setIndexInput] = useState(
    isIndex ? '' : String(updateValue ?? 0)
  )
  const [calculated, setCalculated] = useState(false)
  const [newPrice, setNewPrice] = useState('')
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // When nextUpdateDate changes (after router.refresh() brings new props),
  // reset state so the button reappears if there are still pending updates
  useEffect(() => {
    if (applied && pendingCount > 0) {
      setApplied(false)
      setOpen(false)
      setCalculated(false)
      setNewPrice('')
      setError(null)
      setPriceInput(String(currentPrice))
      setIndexInput(isIndex ? '' : String(updateValue ?? 0))
    }
  }, [nextUpdateDate]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCalculate() {
    setError(null)
    const price = Number(priceInput)
    const value = Number(indexInput)

    if (!price || price <= 0) {
      setError('Ingresá un precio actual válido')
      toast.error('Ingresá un precio actual válido')
      return
    }
    if (isIndex && (!value || value <= 0)) {
      const msg = `Ingresá el valor del índice ${updateType.toUpperCase()}`
      setError(msg)
      toast.error(msg)
      return
    }

    const result = calculateRentUpdate({
      currentPrice: price,
      updateType,
      updateValue: isIndex ? undefined : value,
      indexValue: isIndex ? value : undefined,
    })

    setNewPrice(String(result.newPrice))
    setCalculated(true)
  }

  async function handleApply() {
    const finalPrice = Number(newPrice)
    if (!finalPrice || finalPrice <= 0) {
      setError('El nuevo precio debe ser mayor a 0')
      toast.error('El nuevo precio debe ser mayor a 0')
      return
    }

    setApplying(true)
    setError(null)

    const res = await fetch(`/api/contracts/${contractId}/apply-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previousPrice: Number(priceInput),
        newPrice: finalPrice,
        indexValue: isIndex ? Number(indexInput) : null,
      }),
    })

    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      setError(json.error ?? 'Error al aplicar')
      toast.error('Error al aplicar la actualización')
      setApplying(false)
      return
    }

    setApplied(true)
    setApplying(false)
    setCalculated(false)
    router.refresh()
    toast.success('Actualización aplicada')
  }

  function handleCancel() {
    setOpen(false)
    setCalculated(false)
    setNewPrice('')
    setError(null)
    setPriceInput(String(currentPrice))
    setIndexInput(isIndex ? '' : String(updateValue ?? 0))
  }

  function handleReset() {
    setCalculated(false)
    setNewPrice('')
    setApplied(false)
    setError(null)
  }

  const price = Number(priceInput)
  const final = Number(newPrice)
  const pctChange = price > 0 ? Math.round(((final - price) / price) * 10000) / 100 : 0

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Calculadora de actualización</h3>
          {pendingCount > 0 && (
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-500">
              {pendingCount} pendiente{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        {!open && !applied && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            className="cursor-pointer"
          >
            Calcular
          </Button>
        )}
        {open && !applied && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={handleCancel}
            className="cursor-pointer"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Cancelar</span>
          </Button>
        )}
      </div>

      {applied && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2.5 text-sm text-success">
          <CheckCircle className="h-4 w-4 shrink-0" />
          Actualización aplicada. El contrato fue actualizado y el historial fue guardado.
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {open && !applied && (
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Tipo: <span className="font-medium text-foreground">{UPDATE_TYPE_LABELS[updateType]}</span>
            {' · '}
            Frecuencia: <span className="font-medium text-foreground">{updateFrequencyMonths} {updateFrequencyMonths === 1 ? 'mes' : 'meses'}</span>
            {' · '}
            Próxima: <span className="font-mono text-foreground">{formatDate(nextUpdateDate)}</span>
          </div>

          {/* Arquiler calculator iframe */}
          <iframe
            title="Calculadora de alquileres"
            src={
              resolvedTheme === 'dark'
                ? 'https://arquiler.com/mini?theme=dark&backgroundColor=09090B'
                : 'https://arquiler.com/mini?theme=light&backgroundColor=ffffff'
            }
            className="h-155 w-full rounded-lg border-0"
          />

          {/* Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="calc-price" className="text-xs">Precio actual</Label>
              <Input
                id="calc-price"
                type="number"
                step="0.01"
                min="0"
                value={priceInput}
                onChange={(e) => { setPriceInput(e.target.value); setCalculated(false) }}
                className="font-mono tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="calc-index" className="text-xs">
                {isIndex
                  ? `Índice ${updateType.toUpperCase()} (%)`
                  : updateType === 'fixed_percentage'
                    ? 'Porcentaje (%)'
                    : 'Monto fijo ($)'}
              </Label>
              <Input
                id="calc-index"
                type="number"
                step={isIndex || updateType === 'fixed_percentage' ? '0.01' : '1'}
                min="0"
                value={indexInput}
                onChange={(e) => { setIndexInput(e.target.value); setCalculated(false) }}
                className="font-mono tabular-nums"
              />
            </div>
          </div>

          {/* Calculate button */}
          {!calculated && (
            <Button size="sm" onClick={handleCalculate} className="w-full cursor-pointer">
              Calcular actualización
            </Button>
          )}

          {/* Result */}
          {calculated && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Actual</p>
                  <p className="font-mono tabular-nums font-semibold">{formatCurrency(price)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-0.5">Nuevo</p>
                  <p className="font-mono tabular-nums font-semibold text-success">{formatCurrency(final)}</p>
                </div>
                {pctChange !== 0 && (
                  <div className="ml-auto text-right">
                    <p className="text-xs text-muted-foreground mb-0.5">Aumento</p>
                    <p className="font-mono tabular-nums font-semibold flex items-center gap-1 justify-end text-success">
                      <TrendingUp className="h-3.5 w-3.5" />
                      +{pctChange.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Editable new price */}
              <div className="space-y-1.5">
                <Label htmlFor="calc-new-price" className="text-xs">
                  Nuevo precio (podés ajustar manualmente)
                </Label>
                <Input
                  id="calc-new-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  className="font-mono tabular-nums"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="cursor-pointer"
                >
                  Recalcular
                </Button>
                <Button
                  size="sm"
                  className="flex-1 cursor-pointer"
                  onClick={handleApply}
                  disabled={applying}
                >
                  {applying ? 'Aplicando...' : 'Aplicar actualización'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Actualizará el precio del contrato y registrará el historial de cambio.
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
