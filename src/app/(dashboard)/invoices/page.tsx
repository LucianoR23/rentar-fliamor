import Link from 'next/link'
import { Plus, FileOutput } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, contracts, units, tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { InvoiceTable } from '@/components/invoices/InvoiceTable'
import { EmptyState } from '@/components/shared/EmptyState'

export default async function InvoicesPage() {
  const rows = await db
    .select({ invoice: invoices, contract: contracts, unit: units, tenant: tenants })
    .from(invoices)
    .innerJoin(contracts, eq(invoices.contractId, contracts.id))
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .orderBy(desc(invoices.createdAt))

  return (
    <div>
      <PageHeader
        title="Facturación"
        description={`${rows.length} factura${rows.length !== 1 ? 's' : ''} emitida${rows.length !== 1 ? 's' : ''}`}
      >
        <Button asChild size="sm">
          <Link href="/invoices/new">
            <Plus className="h-4 w-4" />
            Nueva factura
          </Link>
        </Button>
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState icon={FileOutput} title="Sin facturas" description="Emití la primera factura electrónica.">
          <Button asChild size="sm">
            <Link href="/invoices/new"><Plus className="h-4 w-4" />Nueva factura</Link>
          </Button>
        </EmptyState>
      ) : (
        <InvoiceTable data={rows} />
      )}
    </div>
  )
}
