import { eq, and, inArray } from 'drizzle-orm'
import { CreditCard } from 'lucide-react'
import { db } from '@/lib/db'
import { contracts, payments, units, tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { MonthPicker } from '@/components/payments/MonthPicker'
import { PaymentsTable } from '@/components/payments/PaymentsTable'

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const month = params.month ? Number(params.month) : now.getMonth() + 1
  const year = params.year ? Number(params.year) : now.getFullYear()

  const activeContracts = await db
    .select({ contract: contracts, unit: units, tenant: tenants })
    .from(contracts)
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(eq(contracts.status, 'active'))

  if (activeContracts.length > 0) {
    const contractIds = activeContracts.map((r) => r.contract.id)

    const existingPayments = await db
      .select({ contractId: payments.contractId })
      .from(payments)
      .where(
        and(
          inArray(payments.contractId, contractIds),
          eq(payments.periodMonth, month),
          eq(payments.periodYear, year)
        )
      )

    const existingIds = new Set(existingPayments.map((p) => p.contractId))
    const missing = activeContracts.filter((r) => !existingIds.has(r.contract.id))

    if (missing.length > 0) {
      const dueDate = `${year}-${String(month).padStart(2, '0')}-05`
      await db.insert(payments).values(
        missing.map((r) => ({
          contractId: r.contract.id,
          periodMonth: month,
          periodYear: year,
          amountDue: r.contract.currentPrice,
          dueDate,
          status: 'pending' as const,
        }))
      )
    }
  }

  const rows = await db
    .select({ payment: payments, contract: contracts, unit: units, tenant: tenants })
    .from(payments)
    .innerJoin(contracts, eq(payments.contractId, contracts.id))
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(
      and(
        eq(payments.periodMonth, month),
        eq(payments.periodYear, year),
        eq(contracts.status, 'active')
      )
    )
    .orderBy(units.identifier)

  const paid = rows.filter((r) => r.payment.status === 'paid').length

  return (
    <div>
      <PageHeader
        title="Pagos"
        description={`${paid} de ${rows.length} cobrado${rows.length !== 1 ? 's' : ''}`}
      >
        <MonthPicker month={month} year={year} />
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin contratos activos"
          description="No hay contratos activos para este período."
        />
      ) : (
        <PaymentsTable data={rows} />
      )}
    </div>
  )
}
