import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoices, contracts, units, tenants } from '@/lib/schema'
import { requireRole } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params

    const rows = await db
      .select({
        invoice: invoices,
        contract: contracts,
        unit: units,
        tenant: tenants,
      })
      .from(invoices)
      .innerJoin(contracts, eq(invoices.contractId, contracts.id))
      .innerJoin(units, eq(contracts.unitId, units.id))
      .innerJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(eq(invoices.id, id))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
