import { NextRequest, NextResponse } from 'next/server'
import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, contractUpdates, payments, units, tenants } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { contractSchema } from '@/lib/validations/contract'
import { addMonths } from '@/lib/compute-update'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params
    const [row] = await db
      .select({ contract: contracts, unit: units, tenant: tenants })
      .from(contracts)
      .leftJoin(units, eq(contracts.unitId, units.id))
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .where(eq(contracts.id, id))
      .limit(1)
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(row)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params
    const body: unknown = await request.json()
    const data = contractSchema.parse(body)

    const nextUpdateDate = addMonths(data.startDate, data.updateFrequencyMonths)

    // If no updates have been applied, sync currentPrice with firstMonthPrice
    const hasUpdates = await db.query.contractUpdates.findFirst({
      where: eq(contractUpdates.contractId, id),
    })

    const [updated] = await db
      .update(contracts)
      .set({
        unitId: data.unitId,
        tenantId: data.tenantId,
        startDate: data.startDate,
        endDate: data.endDate,
        updateFrequencyMonths: data.updateFrequencyMonths,
        updateType: data.updateType,
        updateValue: data.updateValue != null ? String(data.updateValue) : null,
        firstMonthPrice: String(data.firstMonthPrice),
        ...(!hasUpdates ? { currentPrice: String(data.firstMonthPrice) } : {}),
        depositAmount: data.depositAmount != null ? String(data.depositAmount) : null,
        appliesVat: data.appliesVat ?? false,
        vatPercentage: String(data.vatPercentage ?? 100),
        managedSince: data.managedSince || null,
        nextUpdateDate,
        updatedAt: new Date(),
      })
      .where(eq(contracts.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params

    await db
      .update(payments)
      .set({
        status: 'cancelled',
        cancelledReason: 'Contrato rescindido',
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(payments.contractId, id),
          eq(payments.status, 'pending')
        )
      )

    await db
      .update(contracts)
      .set({ status: 'terminated', updatedAt: new Date() })
      .where(eq(contracts.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
