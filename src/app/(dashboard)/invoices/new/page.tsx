import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, units, tenants, invoiceTemplates } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { InvoiceForm } from '@/components/invoices/InvoiceForm'

export default async function NewInvoicePage() {
  const [activeContracts, templates] = await Promise.all([
    db
      .select({ contract: contracts, unit: units, tenant: tenants })
      .from(contracts)
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(eq(contracts.status, 'active')),
    db.select().from(invoiceTemplates),
  ])

  return (
    <div>
      <PageHeader
        title="Nueva factura"
        description="Emitir factura electrónica AFIP"
        backHref="/invoices"
      />
      <InvoiceForm contracts={activeContracts} templates={templates} />
    </div>
  )
}
