'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, Archive } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Group, UserRole } from '@/types'

export type GroupRow = Group & { unitCount: number }

export function GroupsTable({ data, userRole }: { data: GroupRow[]; userRole: UserRole }) {
  const router = useRouter()
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleArchive() {
    if (!archiveId) return
    setArchiving(true)
    await fetch(`/api/groups/${archiveId}`, { method: 'PATCH' })
    setArchiving(false)
    setArchiveId(null)
    router.refresh()
    toast.success('Grupo archivado')
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/groups/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
    toast.success('Grupo eliminado')
  }

  const columns: ColumnDef<GroupRow>[] = [
    {
      accessorKey: 'name',
      header: 'Nombre',
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'address',
      header: 'Dirección',
      cell: ({ getValue }) => (
        <span className="text-muted-foreground text-sm">{getValue<string>()}</span>
      ),
    },
    {
      id: 'unitCount',
      header: 'Unidades',
      accessorFn: (row) => row.unitCount,
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">{getValue<number>()}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/groups/${row.original.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/groups/${row.original.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-amber-500"
                onClick={() => setArchiveId(row.original.id)}
              >
                <Archive className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Archivar</TooltipContent>
          </Tooltip>
          {userRole === 'superadmin' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteId(row.original.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Eliminar permanentemente</TooltipContent>
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        searchPlaceholder="Buscar por nombre, dirección..."
      />
      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archivar grupo"
        description="El grupo dejará de aparecer en los listados. Podés restaurarlo más adelante."
        onConfirm={handleArchive}
        loading={archiving}
        confirmLabel="Archivar"
        loadingLabel="Archivando..."
        variant="default"
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar grupo"
        description="Esta acción no se puede deshacer. Se eliminarán también todas las unidades asociadas."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
