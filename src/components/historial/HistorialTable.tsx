'use client'

import Link from 'next/link'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import type { Contract, Unit, Tenant } from '@/types'

export type HistorialRow = {
  contract: Contract
  unit: Unit | null
  tenant: Tenant | null
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const columns: ColumnDef<HistorialRow>[] = [
  {
    id: 'unit',
    header: 'Unidad',
    accessorFn: (row) => row.unit?.identifier ?? '',
    cell: ({ row }) => {
      const unit = row.original.unit
      return unit ? (
        <Link href={`/units/${unit.id}`} className="font-mono tabular-nums font-medium text-primary hover:underline">
          {unit.identifier}
        </Link>
      ) : (
        <span className="text-muted-foreground">—</span>
      )
    },
  },
  {
    id: 'tenant',
    header: 'Inquilino',
    accessorFn: (row) => row.tenant ? `${row.tenant.lastName} ${row.tenant.firstName}` : '',
    cell: ({ row }) => {
      const t = row.original.tenant
      return t ? `${t.lastName}, ${t.firstName}` : <span className="text-muted-foreground">—</span>
    },
  },
  {
    id: 'status',
    header: 'Estado',
    cell: ({ row }) => <ContractStatusBadge status={row.original.contract.status} />,
  },
  {
    id: 'period',
    header: 'Vigencia',
    accessorFn: (row) => row.contract.startDate,
    cell: ({ row }) => {
      const c = row.original.contract
      return (
        <span className="font-mono text-sm text-muted-foreground tabular-nums">
          {formatDate(c.startDate)} → {formatDate(c.endDate)}
        </span>
      )
    },
  },
  {
    id: 'finalPrice',
    header: 'Precio final',
    cell: ({ row }) => (
      <span className="font-mono tabular-nums">
        {formatCurrency(row.original.contract.currentPrice)}
      </span>
    ),
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => (
      <div className="flex justify-end">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href={`/historial/${row.original.contract.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    ),
  },
]

export function HistorialTable({ data }: { data: HistorialRow[] }) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchPlaceholder="Buscar por unidad o inquilino..."
    />
  )
}
