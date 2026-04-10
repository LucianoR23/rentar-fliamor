'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ContractStatusBadge } from './ContractStatusBadge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import type { Contract, Unit, Tenant } from '@/types'

export type ContractRow = {
  contract: Contract
  unit: Unit | null
  tenant: Tenant | null
}

function formatARS(value: string | number) {
  return Number(value).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function ContractsTable({ data }: { data: ContractRow[] }) {
  const router = useRouter()
  const [terminateId, setTerminateId] = useState<string | null>(null)
  const [terminating, setTerminating] = useState(false)

  async function handleTerminate() {
    if (!terminateId) return
    setTerminating(true)
    await fetch(`/api/contracts/${terminateId}`, { method: 'DELETE' })
    setTerminating(false)
    setTerminateId(null)
    router.refresh()
  }

  const columns: ColumnDef<ContractRow>[] = [
    {
      id: 'unit',
      header: 'Unidad',
      accessorFn: (row) => row.unit?.identifier ?? '',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums font-medium">
          {row.original.unit?.identifier ?? '—'}
        </span>
      ),
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
      id: 'price',
      header: 'Precio actual',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">${formatARS(row.original.contract.currentPrice)}</span>
      ),
    },
    {
      id: 'nextUpdate',
      header: 'Próx. actualización',
      accessorFn: (row) => row.contract.nextUpdateDate,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {formatDate(row.original.contract.nextUpdateDate)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 justify-end">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/contracts/${row.original.contract.id}`}><Eye className="h-4 w-4" /></Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/contracts/${row.original.contract.id}/edit`}><Pencil className="h-4 w-4" /></Link>
          </Button>
          <Button
            variant="ghost" size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setTerminateId(row.original.contract.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable columns={columns} data={data} searchPlaceholder="Buscar por unidad, inquilino..." />
      <ConfirmDialog
        open={!!terminateId}
        onOpenChange={(open) => !open && setTerminateId(null)}
        title="Rescindir contrato"
        description="El contrato pasará a estado 'Rescindido'. Esta acción no se puede deshacer."
        onConfirm={handleTerminate}
        loading={terminating}
      />
    </>
  )
}
