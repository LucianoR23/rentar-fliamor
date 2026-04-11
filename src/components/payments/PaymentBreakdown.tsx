'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import type { PaymentLineItem } from '@/types'

const TYPE_LABELS: Record<string, string> = {
  rent: 'Alquiler',
  vat: 'IVA',
  group_expense: 'Gasto grupal',
  manual_charge: 'Cargo manual',
}

const TYPE_COLORS: Record<string, string> = {
  rent: 'text-foreground',
  vat: 'text-muted-foreground',
  group_expense: 'text-amber-500 dark:text-amber-400',
  manual_charge: 'text-primary',
}

interface PaymentBreakdownProps {
  paymentId: string
}

export function PaymentBreakdown({ paymentId }: PaymentBreakdownProps) {
  const [lines, setLines] = useState<PaymentLineItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/payments/${paymentId}/breakdown`)
      .then((r) => r.json())
      .then((data) => {
        setLines(data.lineItems ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [paymentId])

  if (loading) {
    return <div className="py-2 px-4 text-xs text-muted-foreground">Cargando desglose...</div>
  }

  if (lines.length === 0) {
    return <div className="py-2 px-4 text-xs text-muted-foreground">Sin desglose disponible</div>
  }

  const total = lines.reduce((sum, l) => sum + Number(l.amount), 0)

  return (
    <div className="py-2 px-4 space-y-1">
      {lines.map((line) => (
        <div key={line.id} className="flex items-center justify-between text-xs">
          <span className={TYPE_COLORS[line.type] ?? 'text-foreground'}>
            <span className="text-muted-foreground mr-1.5">{TYPE_LABELS[line.type] ?? line.type}:</span>
            {line.description}
          </span>
          <span className="font-mono tabular-nums">{formatCurrency(line.amount)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between text-xs font-semibold border-t border-border pt-1 mt-1">
        <span>Total</span>
        <span className="font-mono tabular-nums">{formatCurrency(total)}</span>
      </div>
    </div>
  )
}
