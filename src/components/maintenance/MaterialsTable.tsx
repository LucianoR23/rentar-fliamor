'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import { UNIT_OF_MEASURE_LABELS } from '@/lib/validations/material'
import { MaterialFormDialog } from './MaterialFormDialog'
import type { Material } from '@/types'
import type { UserRole } from '@/types'

interface MaterialsTableProps {
  data: Material[]
  userRole: UserRole
}

export function MaterialsTable({ data, userRole }: MaterialsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [editMaterial, setEditMaterial] = useState<Material | null>(null)

  const canMutate = userRole === 'superadmin' || userRole === 'admin'

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/materials/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) {
      toast.success('Material eliminado')
      router.refresh()
    } else {
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      toast.error(json.error ?? 'Error al eliminar')
    }
  }

  const columns: ColumnDef<Material>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
    },
    {
      accessorKey: 'stock',
      header: 'Stock',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums">{row.original.stock}</span>
      ),
    },
    {
      accessorKey: 'unitOfMeasure',
      header: 'Unidad',
      cell: ({ row }) => UNIT_OF_MEASURE_LABELS[row.original.unitOfMeasure],
    },
    {
      accessorKey: 'unitCost',
      header: 'Costo unitario',
      cell: ({ row }) =>
        row.original.unitCost ? (
          <span className="font-mono tabular-nums">{formatCurrency(row.original.unitCost)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'observations',
      header: 'Observaciones',
      cell: ({ row }) =>
        row.original.observations ? (
          <span className="max-w-50 truncate block">{row.original.observations}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    ...(canMutate
      ? [
          {
            id: 'actions',
            header: '',
            cell: ({ row }: { row: { original: Material } }) => (
              <div className="flex items-center gap-0.5 justify-end">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  onClick={() => setEditMaterial(row.original)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  onClick={() => setDeleteId(row.original.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ),
          } satisfies ColumnDef<Material>,
        ]
      : []),
  ]

  return (
    <>
      <DataTable columns={columns} data={data} searchPlaceholder="Buscar material..." />

      <MaterialFormDialog
        open={!!editMaterial}
        onOpenChange={(open) => !open && setEditMaterial(null)}
        material={editMaterial}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar material"
        description="Esta acción no se puede deshacer. El material será eliminado permanentemente."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
