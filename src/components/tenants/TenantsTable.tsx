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
import { WhatsAppLink } from '@/components/shared/WhatsAppLink'
import type { Tenant, UserRole } from '@/types'

export function TenantsTable({ data, userRole }: { data: Tenant[]; userRole: UserRole }) {
  const router = useRouter()
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleArchive() {
    if (!archiveId) return
    setArchiving(true)
    await fetch(`/api/tenants/${archiveId}`, { method: 'PATCH' })
    setArchiving(false)
    setArchiveId(null)
    router.refresh()
    toast.success('Inquilino archivado')
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/tenants/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
    toast.success('Inquilino eliminado')
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
      accessorKey: 'cuitDni',
      header: 'CUIT/CUIL/DNI',
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">{getValue<string>()}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Teléfono',
      cell: ({ getValue }) => {
        const phone = getValue<string>()
        return phone ? <WhatsAppLink phone={phone} /> : <span className="text-muted-foreground">—</span>
      },
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/tenants/${row.original.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver detalle</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={`/tenants/${row.original.id}/edit`}>
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
        searchPlaceholder="Buscar por nombre, CUIT/DNI..."
      />
      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archivar inquilino"
        description="El inquilino dejará de aparecer en los listados. Podés restaurarlo más adelante."
        onConfirm={handleArchive}
        loading={archiving}
        confirmLabel="Archivar"
        loadingLabel="Archivando..."
        variant="default"
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
