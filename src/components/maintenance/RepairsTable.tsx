'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency, formatDate } from '@/lib/utils'
import { RepairDetailDialog } from './RepairDetailDialog'
import type { RepairWithRelations, File as FileRecord } from '@/types'
import type { UserRole } from '@/types'

interface RepairsTableProps {
  data: RepairWithRelations[]
  repairFiles: Record<string, FileRecord[]>
  userRole: UserRole
}

export function RepairsTable({ data, repairFiles, userRole }: RepairsTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [detailRepair, setDetailRepair] = useState<RepairWithRelations | null>(null)

  const canMutate = userRole === 'superadmin' || userRole === 'admin'

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    const res = await fetch(`/api/repairs/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    if (res.ok) {
      toast.success('Arreglo eliminado')
      router.refresh()
    } else {
      toast.error('Error al eliminar')
    }
  }

  function computeMaterialCost(repair: RepairWithRelations): number | null {
    if (repair.repairMaterials.length === 0) return null
    const total = repair.repairMaterials.reduce((sum, rm) => {
      if (!rm.unitCostSnapshot) return sum
      return sum + Number(rm.unitCostSnapshot) * rm.quantity
    }, 0)
    return total > 0 ? total : null
  }

  const columns: ColumnDef<RepairWithRelations>[] = [
    {
      accessorKey: 'repairDate',
      header: 'Fecha',
      cell: ({ row }) => formatDate(row.original.repairDate),
    },
    {
      id: 'unit',
      header: 'Unidad',
      cell: ({ row }) => row.original.unit.identifier,
    },
    {
      accessorKey: 'description',
      header: 'Descripción',
      cell: ({ row }) => (
        <span className="max-w-62.5 truncate block">{row.original.description}</span>
      ),
    },
    {
      id: 'laborCost',
      header: 'Mano de obra',
      cell: ({ row }) =>
        row.original.laborCost ? (
          <span className="font-mono tabular-nums">{formatCurrency(row.original.laborCost)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'materialCost',
      header: 'Materiales',
      cell: ({ row }) => {
        const cost = computeMaterialCost(row.original)
        return cost !== null ? (
          <span className="font-mono tabular-nums text-muted-foreground">{formatCurrency(cost)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 justify-end">
          <Button
            variant="ghost"
            size="icon-sm"
            className="cursor-pointer"
            onClick={() => setDetailRepair(row.original)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          {canMutate && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer"
              onClick={() => setDeleteId(row.original.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable columns={columns} data={data} searchPlaceholder="Buscar arreglo..." />

      <RepairDetailDialog
        open={!!detailRepair}
        onOpenChange={(open) => !open && setDetailRepair(null)}
        repair={detailRepair}
        files={detailRepair ? (repairFiles[detailRepair.id] ?? []) : []}
      />

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar arreglo"
        description="Se eliminará el arreglo y se restaurará el stock de los materiales utilizados. Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
