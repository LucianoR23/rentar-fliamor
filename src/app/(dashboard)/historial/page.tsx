import { Archive } from 'lucide-react'
import { desc, inArray, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, units, tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { HistorialTable } from '@/components/historial/HistorialTable'

export default async function HistorialPage() {
  const rows = await db
    .select({ contract: contracts, unit: units, tenant: tenants })
    .from(contracts)
    .leftJoin(units, eq(contracts.unitId, units.id))
    .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(inArray(contracts.status, ['expired', 'terminated']))
    .orderBy(desc(contracts.endDate))

  return (
    <div>
      <PageHeader
        title="Historial"
        description={`${rows.length} contrato${rows.length !== 1 ? 's' : ''} finalizado${rows.length !== 1 ? 's' : ''}`}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Sin historial"
          description="Los contratos vencidos o rescindidos aparecerán acá con todo su ciclo de vida."
        />
      ) : (
        <HistorialTable data={rows} />
      )}
    </div>
  )
}
