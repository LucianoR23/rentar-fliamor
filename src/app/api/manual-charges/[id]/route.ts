import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { manualCharges } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { manualChargeSchema } from '@/lib/validations/manual-charge'
import { recalculatePaymentsForUnit } from '@/lib/payment-generator'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params
    const row = await db.query.manualCharges.findFirst({
      where: eq(manualCharges.id, id),
    })
    if (!row) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
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
    const data = manualChargeSchema.parse(body)

    const existing = await db.query.manualCharges.findFirst({
      where: eq(manualCharges.id, id),
    })
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const [updated] = await db
      .update(manualCharges)
      .set({
        unitId: data.unitId,
        description: data.description,
        amount: String(data.amount),
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
        notes: data.notes ?? null,
        updatedAt: new Date(),
      })
      .where(eq(manualCharges.id, id))
      .returning()

    // Recalculate old period if it changed
    if (existing.periodMonth !== data.periodMonth || existing.periodYear !== data.periodYear || existing.unitId !== data.unitId) {
      await recalculatePaymentsForUnit(existing.unitId, existing.periodMonth, existing.periodYear)
    }
    // Recalculate new/current period
    await recalculatePaymentsForUnit(data.unitId, data.periodMonth, data.periodYear)

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

    const existing = await db.query.manualCharges.findFirst({
      where: eq(manualCharges.id, id),
    })
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await db.delete(manualCharges).where(eq(manualCharges.id, id))

    // Recalculate affected payments
    await recalculatePaymentsForUnit(existing.unitId, existing.periodMonth, existing.periodYear)

    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
