import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { manualCharges, units } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { manualChargeSchema } from '@/lib/validations/manual-charge'
import { recalculatePaymentsForUnit } from '@/lib/payment-generator'

export async function GET(req: NextRequest) {
  try {
    await requireRole('viewer')
    const sp = req.nextUrl.searchParams
    const unitId = sp.get('unitId')

    if (!unitId) {
      return NextResponse.json({ error: 'unitId requerido' }, { status: 400 })
    }

    const rows = await db
      .select({ charge: manualCharges, unit: units })
      .from(manualCharges)
      .innerJoin(units, eq(manualCharges.unitId, units.id))
      .where(eq(manualCharges.unitId, unitId))
      .orderBy(manualCharges.periodYear, manualCharges.periodMonth)

    return NextResponse.json(rows.map((r) => r.charge))
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
    const data = manualChargeSchema.parse(body)

    const [created] = await db
      .insert(manualCharges)
      .values({
        unitId: data.unitId,
        description: data.description,
        amount: String(data.amount),
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        notes: data.notes ?? null,
      })
      .returning()

    // Recalculate affected payments
    await recalculatePaymentsForUnit(data.unitId, data.periodMonth, data.periodYear)

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
