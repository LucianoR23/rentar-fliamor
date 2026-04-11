import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groupExpenses } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { recalculatePaymentsForGroupExpense } from '@/lib/payment-generator'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params

    const existing = await db.query.groupExpenses.findFirst({
      where: eq(groupExpenses.id, id),
    })
    if (!existing) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    await db.delete(groupExpenses).where(eq(groupExpenses.id, id))

    // Recalculate affected payments after deletion
    await recalculatePaymentsForGroupExpense(id, existing.groupId, existing.periodMonth, existing.periodYear)

    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
