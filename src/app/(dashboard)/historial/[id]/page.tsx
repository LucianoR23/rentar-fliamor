import { notFound } from 'next/navigation'
import Link from 'next/link'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  contracts, units, tenants, contractUpdates,
  payments, files, groupExpenses, groupExpenseUnits,
} from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { ContractTimeline } from '@/components/contracts/ContractTimeline'
import { FilesSection } from '@/components/files/FilesSection'
import { HistorialPaymentsTable } from '@/components/historial/HistorialPaymentsTable'
import { HistorialExpensesTable, type HistorialExpenseRow } from '@/components/historial/HistorialExpensesTable'
import { UPDATE_TYPE_LABELS } from '@/lib/validations/contract'
import { formatCurrency } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

function Row({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium mt-0.5">{value ?? '—'}</dd>
    </div>
  )
}

export default async function HistorialDetailPage({ params }: Props) {
  const { id } = await params

  // 1. Contract + unit + tenant
  const [row] = await db
    .select({ contract: contracts, unit: units, tenant: tenants })
    .from(contracts)
    .leftJoin(units, eq(contracts.unitId, units.id))
    .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(and(eq(contracts.id, id), inArray(contracts.status, ['expired', 'terminated'])))
    .limit(1)

  if (!row) notFound()
  const { contract, unit, tenant } = row

  // 2-4. Parallel queries
  const [updates, contractPayments, contractFiles] = await Promise.all([
    db.select().from(contractUpdates)
      .where(eq(contractUpdates.contractId, id))
      .orderBy(desc(contractUpdates.updateDate)),
    db.select().from(payments)
      .where(eq(payments.contractId, id))
      .orderBy(payments.periodYear, payments.periodMonth),
    db.select().from(files)
      .where(and(eq(files.entityType, 'contract'), eq(files.entityId, id)))
      .orderBy(files.createdAt),
  ])

  // 5-6. Depend on unitId
  const [unitFiles, expenseRows] = unit
    ? await Promise.all([
        db.select().from(files)
          .where(and(eq(files.entityType, 'unit'), eq(files.entityId, unit.id)))
          .orderBy(files.createdAt),
        db.select({
          id: groupExpenses.id,
          name: groupExpenses.name,
          amount: groupExpenses.amount,
          periodMonth: groupExpenses.periodMonth,
          periodYear: groupExpenses.periodYear,
        })
          .from(groupExpenseUnits)
          .innerJoin(groupExpenses, eq(groupExpenseUnits.groupExpenseId, groupExpenses.id))
          .where(eq(groupExpenseUnits.unitId, unit.id))
          .orderBy(groupExpenses.periodYear, groupExpenses.periodMonth),
      ])
    : [[], []]

  // Filter expenses to the contract period
  const startYear = parseInt(contract.startDate.slice(0, 4))
  const startMonth = parseInt(contract.startDate.slice(5, 7))
  const endYear = parseInt(contract.endDate.slice(0, 4))
  const endMonth = parseInt(contract.endDate.slice(5, 7))

  const filteredExpenses: HistorialExpenseRow[] = expenseRows.filter((e) => {
    const ym = e.periodYear * 100 + e.periodMonth
    return ym >= startYear * 100 + startMonth && ym <= endYear * 100 + endMonth
  })

  const title = unit && tenant
    ? `${unit.identifier} — ${tenant.lastName}, ${tenant.firstName}`
    : 'Contrato finalizado'

  return (
    <div>
      <PageHeader title={title} description={`${contract.startDate} → ${contract.endDate}`} backHref="/historial" />

      <div className="max-w-4xl space-y-6">
        {/* Contract details */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Datos del contrato
          </h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-0.5">
              <dt className="text-xs text-muted-foreground">Estado</dt>
              <dd className="mt-0.5"><ContractStatusBadge status={contract.status} /></dd>
            </div>
            <Row label="Tipo de actualización" value={UPDATE_TYPE_LABELS[contract.updateType]} />
            <Row
              label="Precio final"
              value={<span className="font-mono tabular-nums">{formatCurrency(contract.currentPrice)}</span>}
            />
            <Row
              label="Precio inicial"
              value={<span className="font-mono tabular-nums">{formatCurrency(contract.firstMonthPrice)}</span>}
            />
            {contract.depositAmount && (
              <Row
                label="Depósito"
                value={<span className="font-mono tabular-nums">{formatCurrency(contract.depositAmount)}</span>}
              />
            )}
            <Row label="Frecuencia" value={`${contract.updateFrequencyMonths} meses`} />
            {contract.updateValue && (
              <Row
                label={contract.updateType === 'fixed_amount' ? 'Monto fijo' : 'Porcentaje fijo'}
                value={
                  <span className="font-mono tabular-nums">
                    {contract.updateType === 'fixed_amount'
                      ? formatCurrency(contract.updateValue)
                      : `${contract.updateValue}%`}
                  </span>
                }
              />
            )}
            {unit && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Unidad</dt>
                <dd className="mt-0.5">
                  <Link href={`/units/${unit.id}`} className="text-sm font-medium text-primary hover:underline">
                    {unit.identifier}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Tenant info */}
        {tenant && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Inquilino
            </h2>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Row label="Nombre" value={
                <Link href={`/tenants/${tenant.id}`} className="text-primary hover:underline">
                  {tenant.lastName}, {tenant.firstName}
                </Link>
              } />
              <Row label="CUIT/CUIL/DNI" value={tenant.cuitDni} />
              <Row label="Teléfono" value={tenant.phone} />
              <Row label="Email" value={tenant.email} />
              {tenant.guarantorName && (
                <>
                  <Row label="Garante" value={tenant.guarantorName} />
                  <Row label="CUIT/CUIL/DNI garante" value={tenant.guarantorCuitDni} />
                  <Row label="Tel. garante" value={tenant.guarantorPhone} />
                </>
              )}
            </dl>
          </section>
        )}

        {/* Price update timeline */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Historial de actualizaciones
          </h2>
          {updates.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actualizaciones de precio.</p>
          ) : (
            <ContractTimeline contract={contract} updates={updates} />
          )}
        </section>

        {/* Payments */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Pagos ({contractPayments.length})
          </h2>
          <HistorialPaymentsTable data={contractPayments} />
        </section>

        {/* Group expenses */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Gastos grupales ({filteredExpenses.length})
          </h2>
          <HistorialExpensesTable data={filteredExpenses} />
        </section>

        {/* Contract files */}
        <section className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Archivos del contrato
          </h2>
          <FilesSection
            entityType="contract"
            entityId={contract.id}
            initialFiles={contractFiles}
            canUpload={false}
            canDelete={false}
          />
        </section>

        {/* Unit files */}
        {unit && (
          <section className="rounded-lg border border-border bg-card p-5">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Archivos de la unidad
            </h2>
            <FilesSection
              entityType="unit"
              entityId={unit.id}
              initialFiles={unitFiles}
              canUpload={false}
              canDelete={false}
            />
          </section>
        )}
      </div>
    </div>
  )
}
