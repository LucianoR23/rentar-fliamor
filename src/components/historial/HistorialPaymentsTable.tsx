'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Payment } from '@/types'

const MONTHS = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

const STATUS_LABELS: Record<Payment['status'], string> = {
  pending: 'Pendiente',
  paid: 'Pagado',
  partial: 'Parcial',
  overdue: 'Vencido',
}

const STATUS_VARIANTS: Record<Payment['status'], 'warning' | 'success' | 'primary' | 'danger'> = {
  pending: 'warning',
  paid: 'success',
  partial: 'primary',
  overdue: 'danger',
}

const columns: ColumnDef<Payment>[] = [
  {
    id: 'period',
    header: 'Periodo',
    accessorFn: (row) => `${row.periodYear}-${row.periodMonth}`,
    cell: ({ row }) => (
      <span className="font-mono tabular-nums text-sm">
        {MONTHS[row.original.periodMonth]} {row.original.periodYear}
      </span>
    ),
  },
  {
    id: 'dueDate',
    header: 'Vencimiento',
    accessorFn: (row) => row.dueDate,
    cell: ({ row }) => (
      <span className="font-mono text-sm text-muted-foreground tabular-nums">
        {formatDate(row.original.dueDate)}
      </span>
    ),
  },
  {
    id: 'amountDue',
    header: 'A cobrar',
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {formatCurrency(row.original.amountDue)}
      </span>
    ),
  },
  {
    id: 'amountPaid',
    header: 'Cobrado',
    cell: ({ row }) => {
      const paid = row.original.amountPaid
      return paid ? (
        <span className="font-mono tabular-nums">{formatCurrency(paid)}</span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    id: 'status',
    header: 'Estado',
    cell: ({ row }) => {
      const status = row.original.status
      return <StatusBadge variant={STATUS_VARIANTS[status]} label={STATUS_LABELS[status]} />
    },
  },
]

export function HistorialPaymentsTable({ data }: { data: Payment[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">Sin pagos registrados.</p>
  }

  return <DataTable columns={columns} data={data} />
}
