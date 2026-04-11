import { eq, and, inArray } from 'drizzle-orm'
import { CreditCard } from 'lucide-react'
import { db } from '@/lib/db'
import { contracts, payments, units, tenants } from '@/lib/schema'
import { getCommissionRate } from '@/lib/commission'
import { generatePaymentWithLineItems } from '@/lib/payment-generator'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { MonthPicker } from '@/components/payments/MonthPicker'
import { StatusFilter } from '@/components/payments/StatusFilter'
import { PaymentsTable } from '@/components/payments/PaymentsTable'

const VALID_STATUSES = ['all', 'pending', 'paid', 'partial', 'overdue', 'cancelled'] as const
type StatusFilter_ = (typeof VALID_STATUSES)[number]

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string; status?: string }>
}) {
  const params = await searchParams
  const now = new Date()
  const month = params.month ? Number(params.month) : now.getMonth() + 1
  const year = params.year ? Number(params.year) : now.getFullYear()
  const statusFilter: StatusFilter_ = VALID_STATUSES.includes(params.status as StatusFilter_)
    ? (params.status as StatusFilter_)
    : 'all'

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
    const missing = activeContracts.filter((r) => {
      if (existingIds.has(r.contract.id)) return false
      const effectiveStart = r.contract.managedSince ?? r.contract.startDate
      const [esYear, esMonth] = effectiveStart.split('-').map(Number)
      if (year < esYear || (year === esYear && month < esMonth)) return false
      return true
    })

    // Generate payments with full line items (rent + VAT + group expenses + manual charges)
    for (const r of missing) {
      await generatePaymentWithLineItems(r.contract, r.unit, month, year)
    }
  }

  // Build status conditions — show all payments (not just active contracts)
  const conditions = [
    eq(payments.periodMonth, month),
    eq(payments.periodYear, year),
  ]
  if (statusFilter !== 'all') {
    conditions.push(eq(payments.status, statusFilter))
  }

  const rows = await db
    .select({ payment: payments, contract: contracts, unit: units, tenant: tenants })
    .from(payments)
    .innerJoin(contracts, eq(payments.contractId, contracts.id))
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(and(...conditions))
    .orderBy(units.identifier)

  const paid = rows.filter((r) => r.payment.status === 'paid').length
  const total = rows.filter((r) => r.payment.status !== 'cancelled').length
  const commissionRate = await getCommissionRate()

  return (
    <div>
      <PageHeader
        title="Pagos"
        description={`${paid} de ${total} cobrado${total !== 1 ? 's' : ''}`}
      >
        <div className="flex items-center gap-3">
          <StatusFilter current={statusFilter} month={month} year={year} />
          <MonthPicker month={month} year={year} status={statusFilter} />
        </div>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Sin pagos"
          description="No hay pagos registrados para este período y filtro."
        />
      ) : (
        <PaymentsTable data={rows} commissionRate={commissionRate} />
      )}
    </div>
  )
}
