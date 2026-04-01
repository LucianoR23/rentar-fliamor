import Link from 'next/link'
import { Plus, FileText } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, units, tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ContractsTable } from '@/components/contracts/ContractsTable'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function ContractsPage() {
  const rows = await db
    .select({ contract: contracts, unit: units, tenant: tenants })
    .from(contracts)
    .leftJoin(units, eq(contracts.unitId, units.id))
    .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
    .orderBy(desc(contracts.createdAt))

  return (
    <div>
      <PageHeader
        title="Contratos"
        description={`${rows.length} registrado${rows.length !== 1 ? 's' : ''}`}
      >
        <Button asChild size="sm">
          <Link href="/contracts/new">
            <Plus className="h-4 w-4" />
            Nuevo contrato
          </Link>
        </Button>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState icon={FileText} title="Sin contratos" description="Creá el primer contrato para una unidad.">
          <Button asChild size="sm">
            <Link href="/contracts/new"><Plus className="h-4 w-4" />Nuevo contrato</Link>
          </Button>
        </EmptyState>
      ) : (
        <ContractsTable data={rows} />
      )}
    </div>
  )
}
