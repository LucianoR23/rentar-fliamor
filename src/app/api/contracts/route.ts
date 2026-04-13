import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { contracts, units, tenants } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { contractSchema } from '@/lib/validations/contract'
import { addMonths } from '@/lib/compute-update'

export async function GET() {
  try {
    await requireRole('viewer')
    const rows = await db
      .select({ contract: contracts, unit: units, tenant: tenants })
      .from(contracts)
      .leftJoin(units, eq(contracts.unitId, units.id))
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .orderBy(desc(contracts.createdAt))
    return NextResponse.json(rows)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin')
    const body: unknown = await request.json()
    const data = contractSchema.parse(body)

    const nextUpdateDate = addMonths(data.startDate, data.updateFrequencyMonths)

    const [contract] = await db
      .insert(contracts)
      .values({
        unitId: data.unitId,
        tenantId: data.tenantId,
        startDate: data.startDate,
        endDate: data.endDate,
        updateFrequencyMonths: data.updateFrequencyMonths,
        updateType: data.updateType,
        updateValue: data.updateValue != null ? String(data.updateValue) : null,
        firstMonthPrice: String(data.firstMonthPrice),
        currentPrice: String(data.firstMonthPrice),
        depositAmount: data.depositAmount != null ? String(data.depositAmount) : null,
        appliesVat: data.appliesVat ?? false,
        vatPercentage: String(data.vatPercentage ?? 100),
        managedSince: data.managedSince || null,
        nextUpdateDate,
        status: 'active',
      })
      .returning()

    return NextResponse.json(contract, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
