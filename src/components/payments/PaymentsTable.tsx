'use client'

import { useState } from 'react'
import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { Ban, ChevronDown, ChevronRight, CircleDollarSign, FileText, Plus } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { RegisterPaymentDialog } from './RegisterPaymentDialog'
import { CancelPaymentDialog } from './CancelPaymentDialog'
import { ManualChargeDialog } from './ManualChargeDialog'
import { PaymentBreakdown } from './PaymentBreakdown'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { calculateVat } from '@/lib/vat'
import { calculateCommission } from '@/lib/commission-calc'
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
  cancelled: 'Cancelado',
}

const STATUS_VARIANTS: Record<Payment['status'], 'warning' | 'success' | 'primary' | 'danger' | 'muted'> = {
  pending: 'warning',
  paid: 'success',
  partial: 'primary',
  overdue: 'danger',
  cancelled: 'muted',
}

export function PaymentsTable({ data, commissionRate = 0 }: { data: PaymentRow[]; commissionRate?: number }) {
  const [selected, setSelected] = useState<PaymentRow | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<PaymentRow | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [chargeTarget, setChargeTarget] = useState<PaymentRow | null>(null)
  const [chargeOpen, setChargeOpen] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function openDialog(row: PaymentRow) {
    setSelected(row)
    setDialogOpen(true)
  }

  function openCancelDialog(row: PaymentRow) {
    setCancelTarget(row)
    setCancelOpen(true)
  }

  function openChargeDialog(row: PaymentRow) {
    setChargeTarget(row)
    setChargeOpen(true)
  }

  function toggleExpand(paymentId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(paymentId)) next.delete(paymentId)
      else next.add(paymentId)
      return next
    })
  }

  const columns: ColumnDef<PaymentRow>[] = [
    {
      id: 'expand',
      header: '',
      cell: ({ row }) => {
        const isExpanded = expandedIds.has(row.original.payment.id)
        return (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => toggleExpand(row.original.payment.id)}
          >
            {isExpanded
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />}
          </Button>
        )
      },
    },
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
          {formatDate(row.original.payment.dueDate)}
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
      id: 'vat',
      header: 'IVA',
      cell: ({ row }) => {
        const { contract, payment } = row.original
        if (!contract.appliesVat) return <span className="text-muted-foreground">—</span>
        // Use snapshot if available, otherwise calculate
        if (payment.vatAmount && Number(payment.vatAmount) > 0) {
          return (
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatCurrency(payment.vatAmount)}
            </span>
          )
        }
        const vat = calculateVat(
          Number(contract.currentPrice),
          contract.appliesVat,
          Number(contract.vatPercentage)
        )
        return (
          <span className="font-mono tabular-nums text-muted-foreground">
            {formatCurrency(vat.vat)}
          </span>
        )
      },
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
    ...(commissionRate > 0 ? [
      {
        id: 'commission',
        header: 'Comisión',
        cell: ({ row }: { row: { original: PaymentRow } }) => {
          const p = row.original.payment
          const rate = p.commissionRate != null ? Number(p.commissionRate) : commissionRate
          const apply = p.applyCommission
          if (!apply || rate <= 0) return <span className="text-muted-foreground">—</span>
          const comm = calculateCommission(Number(row.original.contract.currentPrice), rate, true)
          return (
            <span className="font-mono tabular-nums text-muted-foreground">
              {formatCurrency(comm.commission)}
            </span>
          )
        },
      } satisfies ColumnDef<PaymentRow>,
      {
        id: 'net',
        header: 'Neto',
        cell: ({ row }: { row: { original: PaymentRow } }) => {
          const p = row.original.payment
          const rate = p.commissionRate != null ? Number(p.commissionRate) : commissionRate
          const apply = p.applyCommission
          if (!apply || rate <= 0) {
            return p.amountPaid ? (
              <span className="font-mono tabular-nums">{formatCurrency(p.amountPaid)}</span>
            ) : <span className="text-muted-foreground">—</span>
          }
          if (!p.amountPaid) return <span className="text-muted-foreground">—</span>
          const comm = calculateCommission(Number(row.original.contract.currentPrice), rate, true)
          return (
            <span className="font-mono tabular-nums">
              {formatCurrency(comm.net)}
            </span>
          )
        },
      } satisfies ColumnDef<PaymentRow>,
    ] : []),
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
        const canCancel = payment.status === 'pending' || payment.status === 'overdue'
        const canAddCharge = payment.status === 'pending' || payment.status === 'overdue'
        return (
          <div className="flex items-center justify-end gap-1">
            {canAddCharge && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={() => openChargeDialog(row.original)}
              >
                <Plus className="h-4 w-4" />
                Cargo
              </Button>
            )}
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
            {canCancel && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-danger hover:text-danger"
                onClick={() => openCancelDialog(row.original)}
              >
                <Ban className="h-4 w-4" />
                Cancelar
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
        renderSubRow={(row) => {
          if (!expandedIds.has(row.payment.id)) return null
          return <PaymentBreakdown paymentId={row.payment.id} />
        }}
      />
      {selected && (
        <RegisterPaymentDialog
          payment={selected.payment}
          contract={selected.contract}
          unit={selected.unit}
          tenant={selected.tenant}
          commissionRate={commissionRate}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) setSelected(null)
          }}
        />
      )}
      {cancelTarget && (
        <CancelPaymentDialog
          payment={cancelTarget.payment}
          unit={cancelTarget.unit}
          tenant={cancelTarget.tenant}
          open={cancelOpen}
          onOpenChange={(open) => {
            setCancelOpen(open)
            if (!open) setCancelTarget(null)
          }}
        />
      )}
      {chargeTarget && (
        <ManualChargeDialog
          unitId={chargeTarget.unit.id}
          unitIdentifier={chargeTarget.unit.identifier}
          tenantName={`${chargeTarget.tenant.lastName}, ${chargeTarget.tenant.firstName}`}
          month={chargeTarget.payment.periodMonth}
          year={chargeTarget.payment.periodYear}
          open={chargeOpen}
          onOpenChange={(open) => {
            setChargeOpen(open)
            if (!open) setChargeTarget(null)
          }}
        />
      )}
    </>
  )
}
