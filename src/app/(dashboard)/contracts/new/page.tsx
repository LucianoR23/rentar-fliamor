import { desc, eq, and, isNull } from 'drizzle-orm'
import { db } from '@/lib/db'
import { units, tenants, contracts } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { ContractForm } from '@/components/contracts/ContractForm'

export default async function NewContractPage() {
  // Only units without an active contract
  const availableUnits = await db
    .select({ id: units.id, identifier: units.identifier, type: units.type })
    .from(units)
    .leftJoin(
      contracts,
      and(eq(contracts.unitId, units.id), eq(contracts.status, 'active'))
    )
    .where(isNull(contracts.id))
    .orderBy(units.identifier)

  const allTenants = await db
    .select({ id: tenants.id, firstName: tenants.firstName, lastName: tenants.lastName })
    .from(tenants)
    .orderBy(tenants.lastName)

  return (
    <div>
      <PageHeader title="Nuevo contrato" description="Completá los datos del contrato" backHref="/contracts" />
      <ContractForm units={availableUnits} tenants={allTenants} />
    </div>
  )
}
