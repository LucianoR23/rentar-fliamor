'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import type { Tenant } from '@/types'

export function TenantsTable({ data }: { data: Tenant[] }) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/tenants/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  const columns: ColumnDef<Tenant>[] = [
    {
      id: 'name',
      accessorFn: (row) => `${row.lastName} ${row.firstName}`,
      header: 'Nombre',
      cell: ({ row }) => (
        <span className="font-medium">
          {row.original.lastName}, {row.original.firstName}
        </span>
      ),
    },
    {
      accessorKey: 'dni',
      header: 'DNI',
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ getValue }) => {
        const v = getValue<string | null>()
        return v ? v : <span className="text-muted-foreground">—</span>
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 justify-end">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/dashboard/tenants/${row.original.id}`}>
              <Eye className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon-sm" asChild>
            <Link href={`/dashboard/tenants/${row.original.id}/edit`}>
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
        searchPlaceholder="Buscar por nombre, DNI..."
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar inquilino"
        description="Esta acción no se puede deshacer. El inquilino será eliminado permanentemente."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
