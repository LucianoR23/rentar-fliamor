'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatCurrency } from '@/lib/utils'
import type { GroupExpense } from '@/types'

const MONTHS = [
  '', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

interface GroupExpensesListProps {
  expenses: GroupExpense[]
}

export function GroupExpensesList({ expenses }: GroupExpensesListProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    await fetch(`/api/group-expenses/${deleteId}`, { method: 'DELETE' })
    setDeleting(false)
    setDeleteId(null)
    router.refresh()
  }

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Este grupo no tiene gastos registrados.
      </p>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {expenses.map((exp) => (
          <div
            key={exp.id}
            className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{exp.name}</p>
              <p className="text-xs text-muted-foreground font-mono tabular-nums">
                {MONTHS[exp.periodMonth]} {exp.periodYear}
                {exp.notes ? ` · ${exp.notes}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono tabular-nums text-sm font-semibold">
                {formatCurrency(exp.amount)}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteId(exp.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

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
