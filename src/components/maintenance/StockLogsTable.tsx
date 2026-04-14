'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/DataTable'
import type { StockLog } from '@/types'

const REASON_LABELS: Record<string, string> = {
  manual_edit: 'Edición manual',
  repair_usage: 'Uso en arreglo',
  initial: 'Stock inicial',
}

type StockLogRow = StockLog & { materialName: string }

function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function StockLogsTable({ data }: { data: StockLogRow[] }) {
  const columns: ColumnDef<StockLogRow>[] = [
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => formatDateTime(row.original.createdAt),
    },
    {
      accessorKey: 'materialName',
      header: 'Material',
    },
    {
      accessorKey: 'previousStock',
      header: 'Stock anterior',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{row.original.previousStock}</span>
      ),
    },
    {
      accessorKey: 'newStock',
      header: 'Stock nuevo',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{row.original.newStock}</span>
      ),
    },
    {
      id: 'delta',
      header: 'Cambio',
      cell: ({ row }) => {
        const delta = row.original.newStock - row.original.previousStock
        const sign = delta > 0 ? '+' : ''
        const color = delta > 0 ? 'text-success' : delta < 0 ? 'text-destructive' : 'text-muted-foreground'
        return (
          <span className={`font-mono tabular-nums font-medium ${color}`}>
            {sign}{delta}
          </span>
        )
      },
    },
    {
      accessorKey: 'reason',
      header: 'Motivo',
      cell: ({ row }) => REASON_LABELS[row.original.reason] ?? row.original.reason,
    },
  ]

  return <DataTable columns={columns} data={data} searchPlaceholder="Buscar en historial..." />
}
