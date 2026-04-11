import { notFound } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, units, tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { ContractForm } from '@/components/contracts/ContractForm'

type Props = { params: Promise<{ id: string }> }

export default async function EditContractPage({ params }: Props) {
  const { id } = await params
  const contract = await db.query.contracts.findFirst({ where: eq(contracts.id, id) })
  if (!contract) notFound()

  const allUnits = await db
    .select({ id: units.id, identifier: units.identifier, type: units.type })
    .from(units)
    .orderBy(units.identifier)

  const allTenants = await db
    .select({ id: tenants.id, firstName: tenants.firstName, lastName: tenants.lastName })
    .from(tenants)
    .orderBy(tenants.lastName)

  return (
    <div>
      <PageHeader title="Editar contrato" backHref={`/contracts/${contract.id}`} />
      <ContractForm
        contractId={contract.id}
        units={allUnits}
        tenants={allTenants}
        defaultValues={{
          unitId: contract.unitId,
          tenantId: contract.tenantId,
          startDate: contract.startDate,
          endDate: contract.endDate,
          updateFrequencyMonths: contract.updateFrequencyMonths,
          updateType: contract.updateType,
          updateValue: contract.updateValue ? Number(contract.updateValue) : undefined,
          firstMonthPrice: Number(contract.firstMonthPrice),
          depositAmount: contract.depositAmount ? Number(contract.depositAmount) : undefined,
          appliesVat: contract.appliesVat,
          vatPercentage: Number(contract.vatPercentage),
          managedSince: contract.managedSince ?? undefined,
        }}
      />
    </div>
  )
}
