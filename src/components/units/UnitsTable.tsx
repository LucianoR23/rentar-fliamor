'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { UnitStatusBadge } from './UnitStatusBadge'
import { Button } from '@/components/ui/button'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
import type { Unit, Group } from '@/types'

export type UnitRow = Unit & {
  group: Group | null
  hasActiveContract: boolean
}

export function UnitsTable({ data }: { data: UnitRow[] }) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/units/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  const columns: ColumnDef<UnitRow>[] = [
    {
      accessorKey: 'identifier',
      header: 'Identificador',
      cell: ({ getValue }) => (
        <span className="font-medium font-mono tabular-nums">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ getValue }) => {
        const v = getValue<string>()
        return UNIT_TYPE_LABELS[v as keyof typeof UNIT_TYPE_LABELS] ?? v
      },
    },
    {
      id: 'group',
      header: 'Grupo',
      accessorFn: (row) => row.group?.name ?? '',
      cell: ({ row }) =>
        row.original.group ? (
          <Link
            href={`/groups/${row.original.group.id}`}
            className="text-primary hover:underline"
          >
            {row.original.group.name}
          </Link>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'status',
      header: 'Estado',
      cell: ({ row }) => (
        <UnitStatusBadge hasActiveContract={row.original.hasActiveContract} />
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 justify-end">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/units/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/units/${row.original.id}/edit`}>
              <Pencil className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Buscar por identificador, tipo..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar unidad"
        description="Esta acción no se puede deshacer. La unidad será eliminada permanentemente."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
