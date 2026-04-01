import Link from 'next/link'
import { Plus, Users } from 'lucide-react'
import { db } from '@/lib/db'
import { tenants } from '@/lib/schema'
import { desc } from 'drizzle-orm'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { TenantsTable } from '@/components/tenants/TenantsTable'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function TenantsPage() {
  const allTenants = await db.select().from(tenants).orderBy(desc(tenants.createdAt))

  return (
    <div>
      <PageHeader
        title="Inquilinos"
        description={`${allTenants.length} registrado${allTenants.length !== 1 ? 's' : ''}`}
      >
        <Button asChild size="sm">
          <Link href="/dashboard/tenants/new">
            <Plus className="h-4 w-4" />
            Nuevo inquilino
          </Link>
        </Button>
      </PageHeader>

      {allTenants.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Sin inquilinos"
          description="Agregá tu primer inquilino para empezar."
        >
          <Button asChild size="sm">
            <Link href="/dashboard/tenants/new">
              <Plus className="h-4 w-4" />
              Nuevo inquilino
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <TenantsTable data={allTenants} />
      )}
    </div>
  )
}
