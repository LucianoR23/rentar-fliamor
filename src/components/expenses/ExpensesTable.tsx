'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { type ColumnDef } from '@tanstack/react-table'
import { Trash2, Archive } from 'lucide-react'
import { DataTable } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateInput } from '@/components/ui/date-input'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Expense, UserRole } from '@/types'

export function ExpensesTable({ data, userRole }: { data: Expense[]; userRole: UserRole }) {
  const router = useRouter()
  const [archiveId, setArchiveId] = useState<string | null>(null)
  const [archiving, setArchiving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Filters
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filtered = data.filter((row) => {
    if (dateFrom && row.expenseDate < dateFrom) return false
    if (dateTo && row.expenseDate > dateTo) return false
    if (categoryFilter && !(row.category ?? '').toLowerCase().includes(categoryFilter.toLowerCase())) return false
    return true
  })

  async function handleArchive() {
    if (!archiveId) return
    setArchiving(true)
    await fetch(`/api/expenses/${archiveId}`, { method: 'PATCH' })
    setArchiving(false)
    setArchiveId(null)
    router.refresh()
    toast.success('Gasto archivado')
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/expenses/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
    toast.success('Gasto eliminado')
  }

  const columns: ColumnDef<Expense>[] = [
    {
      id: 'title',
      header: 'Título',
      accessorKey: 'title',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: 'category',
      header: 'Categoría',
      accessorKey: 'category',
      cell: ({ row }) =>
        row.original.category ? (
          <span className="text-sm">{row.original.category}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: 'expenseDate',
      header: 'Fecha',
      accessorKey: 'expenseDate',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums text-sm text-muted-foreground">
          {formatDate(row.original.expenseDate)}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Monto',
      accessorKey: 'amount',
      cell: ({ row }) => (
        <span className="font-mono tabular-nums font-medium">
          {formatCurrency(row.original.amount)}
        </span>
      ),
    },
    {
      id: 'notes',
      header: 'Notas',
      accessorKey: 'notes',
      cell: ({ row }) =>
        row.original.notes ? (
          <span className="text-sm text-muted-foreground truncate max-w-50 block">
            {row.original.notes}
          </span>
        ) : null,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-0.5 justify-end">
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
      {/* Filters toolbar */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <DateInput
            className="h-8 w-36 text-sm"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <DateInput
            className="h-8 w-36 text-sm"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Categoría</Label>
          <Input
            placeholder="Filtrar categoría..."
            className="h-8 w-44 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          />
        </div>
        {(dateFrom || dateTo || categoryFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => { setDateFrom(''); setDateTo(''); setCategoryFilter('') }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Buscar por título, categoría..."
      />

      <ConfirmDialog
        open={!!archiveId}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archivar gasto"
        description="El gasto dejará de aparecer en los listados."
        onConfirm={handleArchive}
        loading={archiving}
        confirmLabel="Archivar"
        loadingLabel="Archivando..."
        variant="default"
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar gasto"
        description="Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  )
}
