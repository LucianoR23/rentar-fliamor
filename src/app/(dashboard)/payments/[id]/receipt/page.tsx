import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments, contracts, units, tenants } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { ReceiptEditor } from '@/components/payments/ReceiptEditor'

type Props = { params: Promise<{ id: string }> }

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params

  const [row] = await db
    .select({ payment: payments, unit: units, tenant: tenants })
    .from(payments)
    .innerJoin(contracts, eq(payments.contractId, contracts.id))
    .innerJoin(units, eq(contracts.unitId, units.id))
    .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
    .where(eq(payments.id, id))
    .limit(1)

  if (!row) notFound()

  const { payment, unit, tenant } = row

  const receiptNumber =
    payment.receiptNumber ??
    `REC-${payment.periodYear}${String(payment.periodMonth).padStart(2, '0')}-${payment.id.slice(0, 6).toUpperCase()}`

  return (
    <div>
      <PageHeader
        title="Recibo de alquiler"
        description={`${unit.identifier} — ${tenant.lastName}, ${tenant.firstName}`}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/payments">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>
      </PageHeader>

      <ReceiptEditor
        paymentId={id}
        defaultReceiptNumber={receiptNumber}
        defaultNotes={payment.notes ?? ''}
      />
    </div>
  )
}
