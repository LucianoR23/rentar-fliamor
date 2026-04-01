'use client'

import { useMemo } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calculateGroupExpenseDistribution } from '@/lib/rent-calculator'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
import { formatCurrency } from '@/lib/utils'
import type { DistributionUnit, DistributionConfig } from '@/lib/rent-calculator'
import type { UnitType } from '@/types'

interface CostBreakdownTableProps {
  amount: number
  units: DistributionUnit[]
  costConfig: DistributionConfig[]
}

export function CostBreakdownTable({ amount, units, costConfig }: CostBreakdownTableProps) {
  const distribution = useMemo(
    () => (amount > 0 ? calculateGroupExpenseDistribution(amount, units, costConfig) : []),
    [amount, units, costConfig]
  )

  const byType = useMemo(() => {
    const map = new Map<UnitType, { label: string; count: number; perUnitPct: number; subtotal: number }>()
    for (const r of distribution) {
      const prev = map.get(r.type)
      if (prev) {
        prev.count++
        prev.subtotal += r.amount
      } else {
        map.set(r.type, {
          label: UNIT_TYPE_LABELS[r.type] ?? r.type,
          count: 1,
          perUnitPct: r.percentage,
          subtotal: r.amount,
        })
      }
    }
    return [...map.entries()]
  }, [distribution])

  const total = useMemo(() => distribution.reduce((s, r) => s + r.amount, 0), [distribution])

  if (amount <= 0 || units.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Ingresá el monto para ver el desglose.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary by type */}
      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Tipo</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Unidades</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">% / unidad</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {byType.map(([type, row]) => (
              <TableRow key={type} className="border-b border-border last:border-0 hover:bg-muted/50">
                <TableCell className="text-sm">{row.label}</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums">{row.count}</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums">{row.perUnitPct}%</TableCell>
                <TableCell className="text-sm text-right font-mono tabular-nums font-medium">
                  {formatCurrency(row.subtotal)}
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableCell className="text-sm font-semibold" colSpan={3}>Total distribuido</TableCell>
              <TableCell className="text-sm text-right font-mono tabular-nums font-semibold">
                {formatCurrency(total)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Per-unit detail */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors select-none">
          Ver detalle por unidad ({distribution.length})
        </summary>
        <div className="mt-2 rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border hover:bg-transparent">
                <TableHead className="text-xs font-medium text-muted-foreground">Unidad</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">%</TableHead>
                <TableHead className="text-xs font-medium text-muted-foreground text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {distribution.map((r) => (
                <TableRow key={r.unitId} className="border-b border-border last:border-0 hover:bg-muted/50">
                  <TableCell className="text-sm font-mono tabular-nums">{r.unitIdentifier}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {UNIT_TYPE_LABELS[r.type] ?? r.type}
                  </TableCell>
                  <TableCell className="text-sm text-right font-mono tabular-nums">{r.percentage}%</TableCell>
                  <TableCell className="text-sm text-right font-mono tabular-nums">
                    {formatCurrency(r.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>
    </div>
  )
}
