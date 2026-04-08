'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/DataTable'
import { formatCurrency } from '@/lib/utils'

const MONTHS = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

export type HistorialExpenseRow = {
  id: string
  name: string
  amount: string
  periodMonth: number
  periodYear: number
}

const columns: ColumnDef<HistorialExpenseRow>[] = [
  {
    id: 'name',
    header: 'Gasto',
    accessorKey: 'name',
    cell: ({ row }) => <span className="text-sm font-medium">{row.original.name}</span>,
  },
  {
    id: 'period',
    header: 'Periodo',
    accessorFn: (row) => `${row.periodYear}-${row.periodMonth}`,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-sm text-muted-foreground">
        {MONTHS[row.original.periodMonth]} {row.original.periodYear}
      </span>
    ),
  },
  {
    id: 'amount',
    header: 'Monto',
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">{formatCurrency(row.original.amount)}</span>
    ),
  },
]

export function HistorialExpensesTable({ data }: { data: HistorialExpenseRow[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sin gastos grupales en este periodo.</p>
  }

  return <DataTable columns={columns} data={data} />
}
