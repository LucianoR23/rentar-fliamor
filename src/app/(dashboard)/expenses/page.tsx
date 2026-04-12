import Link from 'next/link'
import { Plus, Receipt } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { expenses } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { Button } from '@/components/ui/button'
import { ExpensesTable } from '@/components/expenses/ExpensesTable'

export default async function ExpensesPage() {
  const dbUser = await requireRole('viewer')

  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.active, true))
    .orderBy(desc(expenses.expenseDate))

  return (
    <div>
      <PageHeader
        title="Gastos"
        description={`${rows.length} registrado${rows.length !== 1 ? 's' : ''}`}
      >
        <Button asChild size="sm">
          <Link href="/expenses/new">
            <Plus className="h-4 w-4" />
            Nuevo gasto
          </Link>
        </Button>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Sin gastos registrados"
          description="Registrá el primer gasto para empezar a hacer seguimiento."
        />
      ) : (
        <ExpensesTable data={rows} userRole={dbUser.role} />
      )}
    </div>
  )
}
