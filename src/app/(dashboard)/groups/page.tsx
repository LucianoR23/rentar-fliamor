import Link from 'next/link'
import { Plus, Layers } from 'lucide-react'
import { desc, eq, count } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups, units } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { GroupsTable } from '@/components/groups/GroupsTable'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function GroupsPage() {
  const dbUser = await requireRole('viewer')

  const rows = await db
    .select({
      group: groups,
      unitCount: count(units.id),
    })
    .from(groups)
    .leftJoin(units, eq(units.groupId, groups.id))
    .where(eq(groups.active, true))
    .groupBy(groups.id)
    .orderBy(desc(groups.createdAt))

  const data = rows.map(({ group, unitCount }) => ({ ...group, unitCount }))

  return (
    <div>
      <PageHeader
        title="Grupos"
        description={`${data.length} registrado${data.length !== 1 ? 's' : ''}`}
      >
        <Button asChild size="sm">
          <Link href="/groups/new">
            <Plus className="h-4 w-4" />
            Nuevo grupo
          </Link>
        </Button>
      </PageHeader>

      {data.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Sin grupos"
          description="Agrupá unidades por edificio o propiedad."
        >
          <Button asChild size="sm">
            <Link href="/groups/new">
              <Plus className="h-4 w-4" />
              Nuevo grupo
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <GroupsTable data={data} userRole={dbUser.role} />
      )}
    </div>
  )
}
