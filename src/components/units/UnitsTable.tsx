'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import { Eye, Pencil, Trash2, Archive } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { UnitStatusBadge } from './UnitStatusBadge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { UNIT_TYPE_LABELS } from '@/lib/validations/unit'
import type { Unit, Group, UserRole } from '@/types'

export type UnitRow = Unit & {
  group: Group | null
  hasActiveContract: boolean
}

export function UnitsTable({ data, userRole }: { data: UnitRow[]; userRole: UserRole }) {
  const router = useRouter()
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleArchive() {
    if (!archiveId) return
    setArchiving(true)
    await fetch(`/api/units/${archiveId}`, { method: 'PATCH' })
    setArchiving(false)
    setArchiveId(null)
    router.refresh()
    toast.success('Unidad archivada')
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/units/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
    toast.success('Unidad eliminada')
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/units/${row.original.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/units/${row.original.id}/edit`}>
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
        searchPlaceholder="Buscar por identificador, tipo..."
      />
      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archivar unidad"
        description="La unidad dejará de aparecer en los listados. Podés restaurarla más adelante."
        onConfirm={handleArchive}
        loading={archiving}
        confirmLabel="Archivar"
        loadingLabel="Archivando..."
        variant="default"
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
