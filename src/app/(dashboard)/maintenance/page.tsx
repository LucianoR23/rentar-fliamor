import { desc, eq, and, inArray } from 'drizzle-orm'
import { db } from '@/lib/db'
import { materials, repairs, stockLogs, units, contracts, files } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { MaintenanceTabs } from '@/components/maintenance/MaintenanceTabs'
import { MaterialsTable } from '@/components/maintenance/MaterialsTable'
import { RepairsTable } from '@/components/maintenance/RepairsTable'
import { StockLogsTable } from '@/components/maintenance/StockLogsTable'
import { NewMaterialButton } from './NewMaterialButton'
import { NewRepairButton } from './NewRepairButton'
import type { RepairWithRelations, File as FileRecord } from '@/types'

type Props = {
  searchParams: Promise<{ tab?: string }>
}

export default async function MaintenancePage({ searchParams }: Props) {
  const dbUser = await requireRole('viewer')
  const { tab = 'materials' } = await searchParams
  const userRole = dbUser.role

  const allMaterials = await db.select().from(materials).orderBy(materials.name)

  let repairsData: RepairWithRelations[] = []
  let repairFiles: Record<string, FileRecord[]> = {}

  if (tab === 'repairs') {
    repairsData = await db.query.repairs.findMany({
      with: {
        unit: true,
        contract: true,
        repairMaterials: { with: { material: true } },
      },
      orderBy: [desc(repairs.repairDate)],
    }) as RepairWithRelations[]

    if (repairsData.length > 0) {
      const repairIds = repairsData.map((r) => r.id)
      const allRepairFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.entityType, 'repair'), inArray(files.entityId, repairIds)))

      repairFiles = allRepairFiles.reduce<Record<string, FileRecord[]>>((acc, f) => {
        if (!acc[f.entityId]) acc[f.entityId] = []
        acc[f.entityId].push(f)
        return acc
      }, {})
    }
  }

  let stockLogsData: (typeof stockLogs.$inferSelect & { materialName: string })[] = []

  if (tab === 'stock-logs') {
    const rows = await db
      .select({ log: stockLogs, materialName: materials.name })
      .from(stockLogs)
      .innerJoin(materials, eq(stockLogs.materialId, materials.id))
      .orderBy(desc(stockLogs.createdAt))

    stockLogsData = rows.map(({ log, materialName }) => ({
      ...log,
      materialName,
    }))
  }

  const allUnits = await db
    .select({ id: units.id, identifier: units.identifier })
    .from(units)
    .where(eq(units.active, true))
    .orderBy(units.identifier)

  const allContracts = await db
    .select({ id: contracts.id, unitId: contracts.unitId, status: contracts.status })
    .from(contracts)
    .where(eq(contracts.status, 'active'))

  const canMutate = userRole === 'superadmin' || userRole === 'admin'

  return (
    <div>
      <PageHeader
        title="Mantenimiento"
        description={
          tab === 'materials'
            ? `${allMaterials.length} material${allMaterials.length !== 1 ? 'es' : ''}`
            : tab === 'repairs'
              ? `${repairsData.length} arreglo${repairsData.length !== 1 ? 's' : ''}`
              : `${stockLogsData.length} registro${stockLogsData.length !== 1 ? 's' : ''}`
        }
      >
        {canMutate && tab === 'materials' && <NewMaterialButton />}
        {canMutate && tab === 'repairs' && (
          <NewRepairButton units={allUnits} contracts={allContracts} materials={allMaterials} />
        )}
      </PageHeader>

      <MaintenanceTabs activeTab={tab} />

      {tab === 'materials' && (
        <MaterialsTable data={allMaterials} userRole={userRole} />
      )}

      {tab === 'repairs' && (
        <RepairsTable data={repairsData} repairFiles={repairFiles} userRole={userRole} />
      )}

      {tab === 'stock-logs' && (
        <StockLogsTable data={stockLogsData} />
      )}
    </div>
  )
}
