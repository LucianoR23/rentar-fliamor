'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { CircleDollarSign, FileText } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RegisterPaymentDialog } from './RegisterPaymentDialog'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Payment, Contract, Unit, Tenant } from '@/types'

export type PaymentRow = {
  payment: Payment
  contract: Contract
  unit: Unit
  tenant: Tenant
}

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

export function PaymentsTable({ data }: { data: PaymentRow[] }) {
  const [selected, setSelected] = useState<PaymentRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function openDialog(row: PaymentRow) {
    setSelected(row)
    setDialogOpen(true)
  }

  const columns: ColumnDef<PaymentRow>[] = [
    {
      id: 'unit',
      header: 'Unidad',
      accessorFn: (row) => row.unit.identifier,
      cell: ({ row }) => (
        <span className="font-mono font-medium tabular-nums">
          {row.original.unit.identifier}
        </span>
      ),
    },
    {
      id: 'tenant',
      header: 'Inquilino',
      accessorFn: (row) => `${row.tenant.lastName} ${row.tenant.firstName}`,
      cell: ({ row }) => {
        const t = row.original.tenant
        return `${t.lastName}, ${t.firstName}`
      },
    },
    {
      id: 'dueDate',
      header: 'Vencimiento',
      accessorFn: (row) => row.payment.dueDate,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {row.original.payment.dueDate}
        </span>
      ),
    },
    {
      id: 'amountDue',
      header: 'A cobrar',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">
          {formatCurrency(row.original.payment.amountDue)}
        </span>
      ),
    },
    {
      id: 'amountPaid',
      header: 'Cobrado',
      cell: ({ row }) => {
        const paid = row.original.payment.amountPaid
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
        const status = row.original.payment.status
        return (
          <StatusBadge
            variant={STATUS_VARIANTS[status]}
            label={STATUS_LABELS[status]}
          />
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const { payment } = row.original
        const canRegister = payment.status === 'pending' || payment.status === 'partial' || payment.status === 'overdue'
        const canReceipt = payment.status === 'paid' || payment.status === 'partial'
        return (
          <div className="flex items-center justify-end gap-1">
            {canReceipt && (
              <Button variant="ghost" size="sm" className="gap-1.5" asChild>
                <Link href={`/payments/${payment.id}/receipt`}>
                  <FileText className="h-4 w-4" />
                  Recibo
                </Link>
              </Button>
            )}
            {canRegister && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => openDialog(row.original)}
              >
                <CircleDollarSign className="h-4 w-4" />
                Registrar
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Buscar por unidad o inquilino..."
      />
      {selected && (
        <RegisterPaymentDialog
          payment={selected.payment}
          contract={selected.contract}
          unit={selected.unit}
          tenant={selected.tenant}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setSelected(null)
          }}
        />
      )}
    </>
  )
}
