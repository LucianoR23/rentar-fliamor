'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { InvoiceTypeBadge } from './InvoiceTypeBadge'
import { TAX_CONDITION_LABELS, PAYMENT_METHOD_OPTIONS } from '@/lib/validations/invoice'
import { formatCurrency } from '@/lib/utils'
import type { Contract, Unit, Tenant, InvoiceTemplate } from '@/types'

interface ContractOption {
  contract: Contract
  unit: Unit
  tenant: Tenant
}

interface InvoiceFormProps {
  contracts: ContractOption[]
  templates: InvoiceTemplate[]
}

interface PreviewData {
  invoiceType: 'A' | 'B'
  cbteTipo: number
  impNeto: number
  impIva: number
  impOpEx: number
  impTotal: number
  exempt: boolean
  recipientName: string
  recipientCuitDni: string
}

const MONTHS = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

const UNIT_TYPE_LABELS: Record<string, string> = {
  apartment: 'Departamento',
  local: 'Local',
  land: 'Terreno',
  house: 'Casa',
  other: 'Otro',
}

export function InvoiceForm({ contracts, templates }: InvoiceFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedContractId = searchParams.get('contractId')

  const now = new Date()
  const [contractId, setContractId] = useState(preselectedContractId ?? '')
  const [taxCondition, setTaxCondition] = useState('')
  const [amount, setAmount] = useState('')
  const [periodMonth, setPeriodMonth] = useState(String(now.getMonth() + 1))
  const [periodYear, setPeriodYear] = useState(String(now.getFullYear()))
  const [description, setDescription] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Contado')
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const selected = contracts.find((c) => c.contract.id === contractId)

  // When contract changes, auto-fill fields
  useEffect(() => {
    if (!selected) return

    setAmount(selected.contract.currentPrice)

    if (selected.tenant.taxCondition) {
      setTaxCondition(selected.tenant.taxCondition)
    } else {
      setTaxCondition('')
    }

    // Load template based on unit type
    const tpl = templates.find((t) => t.unitType === selected.unit.type)
    if (tpl) {
      const period = `${MONTHS.find((m) => m.value === periodMonth)?.label ?? ''} ${periodYear}`
      const rendered = tpl.template
        .replace(/\{\{unit_identifier\}\}/g, selected.unit.identifier)
        .replace(/\{\{period\}\}/g, period)
      setDescription(rendered)
    } else {
      setDescription(`Alquiler de ${UNIT_TYPE_LABELS[selected.unit.type] ?? 'unidad'} ${selected.unit.identifier} - Periodo ${MONTHS.find((m) => m.value === periodMonth)?.label ?? ''} ${periodYear}`)
    }
  }, [contractId, selected, templates, periodMonth, periodYear])

  // Fetch preview when key fields change
  const fetchPreview = useCallback(async () => {
    if (!contractId || !taxCondition || !amount || Number(amount) <= 0) {
      setPreview(null)
      return
    }

    try {
      const res = await fetch('/api/invoices/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          taxCondition,
          amount: Number(amount),
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
          description: description || 'preview',
        }),
      })

      if (res.ok) {
        const data = await res.json() as PreviewData
        setPreview(data)
      }
    } catch {
      // Preview is best-effort
    }
  }, [contractId, taxCondition, amount, periodMonth, periodYear, description])

  useEffect(() => {
    const timer = setTimeout(fetchPreview, 300)
    return () => clearTimeout(timer)
  }, [fetchPreview])

  async function handleSubmit() {
    setServerError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          taxCondition,
          amount: Number(amount),
          periodMonth: Number(periodMonth),
          periodYear: Number(periodYear),
          description,
          paymentMethod,
        }),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({})) as { error?: string; details?: string }
        const msg = json.details ?? json.error ?? 'Error al facturar'
        setServerError(msg)
        toast.error(msg)
        return
      }

      const invoice = await res.json() as { id: string }
      toast.success('Factura emitida exitosamente')
      router.push(`/invoices/${invoice.id}`)
      router.refresh()
    } catch {
      setServerError('Error de conexión')
      toast.error('Error de conexión')
    } finally {
      setSubmitting(false)
      setConfirmOpen(false)
    }
  }

  const invoiceType = preview?.invoiceType

  return (
    <div className="max-w-2xl space-y-8">
      {/* Contrato */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Contrato
        </h2>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Contrato activo *</Label>
          <Select value={contractId} onValueChange={setContractId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar contrato..." />
            </SelectTrigger>
            <SelectContent>
              {contracts.map((c) => (
                <SelectItem key={c.contract.id} value={c.contract.id}>
                  {c.unit.identifier} — {c.tenant.lastName}, {c.tenant.firstName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selected && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Unidad</span>
              <span className="font-medium">{selected.unit.identifier} ({UNIT_TYPE_LABELS[selected.unit.type]})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Inquilino</span>
              <span>{selected.tenant.lastName}, {selected.tenant.firstName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">CUIT/DNI</span>
              <span className="font-mono">{selected.tenant.cuitDni}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio actual</span>
              <span className="font-mono tabular-nums">{formatCurrency(selected.contract.currentPrice)}</span>
            </div>
          </div>
        )}
      </section>

      {/* Facturación */}
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Datos de facturación
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Condición fiscal *</Label>
            <Select value={taxCondition} onValueChange={setTaxCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TAX_CONDITION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Tipo de factura</Label>
            <div className="flex items-center h-9 px-3 rounded-md border border-border bg-muted/30">
              {invoiceType ? (
                <div className="flex items-center gap-2">
                  <InvoiceTypeBadge type={invoiceType} />
                  <span className="text-sm text-muted-foreground">
                    Factura {invoiceType}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">Seleccione condición fiscal</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Monto a facturar *</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="font-mono tabular-nums"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Mes *</Label>
              <Select value={periodMonth} onValueChange={setPeriodMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Año *</Label>
              <Input
                type="number"
                min="2020"
                max="2100"
                value={periodYear}
                onChange={(e) => setPeriodYear(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Descripción *</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none h-20"
            placeholder="Descripción del servicio facturado..."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Forma de pago</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Preview */}
      {preview && (
        <section className="space-y-4">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Vista previa
          </h2>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <InvoiceTypeBadge type={preview.invoiceType} />
              <span className="text-sm font-medium">
                Factura {preview.invoiceType} — {preview.exempt ? 'Exento' : 'Gravado'}
              </span>
            </div>
            {preview.impNeto > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal Neto</span>
                <span className="font-mono tabular-nums">{formatCurrency(preview.impNeto)}</span>
              </div>
            )}
            {preview.impIva > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">IVA 21%</span>
                <span className="font-mono tabular-nums">{formatCurrency(preview.impIva)}</span>
              </div>
            )}
            {preview.impOpEx > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Op. Exentas</span>
                <span className="font-mono tabular-nums">{formatCurrency(preview.impOpEx)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold border-t border-primary/20 pt-2 mt-2">
              <span className="text-primary">TOTAL</span>
              <span className="font-mono tabular-nums text-primary">{formatCurrency(preview.impTotal)}</span>
            </div>
          </div>
        </section>
      )}

      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          className="cursor-pointer"
          onClick={() => setConfirmOpen(true)}
          disabled={!contractId || !taxCondition || !amount || !description || submitting}
        >
          Emitir Factura
        </Button>
        <Button className="cursor-pointer" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Confirmar emisión"
        description={`Se emitirá una Factura ${invoiceType ?? ''} por ${amount ? formatCurrency(preview?.impTotal ?? Number(amount)) : ''} a nombre de ${selected ? `${selected.tenant.lastName}, ${selected.tenant.firstName}` : ''}. Esta acción no se puede deshacer ya que se registra en AFIP.`}
        onConfirm={handleSubmit}
        loading={submitting}
        confirmLabel="Emitir"
        loadingLabel="Emitiendo..."
      />
    </div>
  )
}
