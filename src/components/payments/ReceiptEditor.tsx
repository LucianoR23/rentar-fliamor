'use client'

import { useState, useCallback } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const PAYMENT_METHODS = ['Efectivo', 'Transferencia bancaria', 'Cheque', 'Mercado Pago', 'Otro']

export interface ReceiptEditorProps {
  paymentId: string
  defaultReceiptNumber: string
  defaultNotes: string
}

function buildUrl(paymentId: string, receiptNumber: string, paymentMethod: string, notes: string) {
  const p = new URLSearchParams({ receiptNumber, paymentMethod })
  if (notes) p.set('notes', notes)
  return `/api/payments/${paymentId}/receipt?${p.toString()}`
}

export function ReceiptEditor({ paymentId, defaultReceiptNumber, defaultNotes }: ReceiptEditorProps) {
  const [receiptNumber, setReceiptNumber] = useState(defaultReceiptNumber)
  const [paymentMethod, setPaymentMethod] = useState('Efectivo')
  const [notes, setNotes] = useState(defaultNotes)
  const [iframeKey, setIframeKey] = useState(0)
  const [previewUrl, setPreviewUrl] = useState(() =>
    buildUrl(paymentId, defaultReceiptNumber, 'Efectivo', defaultNotes)
  )

  const handleRefresh = useCallback(() => {
    setPreviewUrl(buildUrl(paymentId, receiptNumber, paymentMethod, notes))
    setIframeKey((k) => k + 1)
  }, [paymentId, receiptNumber, paymentMethod, notes])

  function handleDownload() {
    const url = buildUrl(paymentId, receiptNumber, paymentMethod, notes) + '&download=1'
    window.open(url, '_blank')
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
      {/* Form panel */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="receiptNumber">Número de recibo</Label>
          <Input
            id="receiptNumber"
            value={receiptNumber}
            onChange={(e) => setReceiptNumber(e.target.value)}
            className="font-mono"
            placeholder="REC-202504-ABC123"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="paymentMethod">Forma de pago</Label>
          <select
            id="paymentMethod"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="h-9 w-full rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Observaciones</Label>
          <Textarea
            id="notes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones adicionales para el recibo..."
          />
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button onClick={handleRefresh} variant="outline" className="w-full gap-2">
            <RefreshCw className="h-4 w-4" />
            Actualizar preview
          </Button>
          <Button onClick={handleDownload} className="w-full gap-2">
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
        </div>
      </div>

      {/* Preview panel */}
      <div className="rounded-lg border border-border overflow-hidden" style={{ height: '75vh', minHeight: 500 }}>
        <iframe
          key={iframeKey}
          src={previewUrl}
          className="w-full h-full"
          title="Vista previa del recibo"
        />
      </div>
    </div>
  )
}
