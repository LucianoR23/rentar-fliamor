import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { paymentLineItems, payments } from '@/lib/schema'
import { requireRole } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params

    const payment = await db.query.payments.findFirst({
      where: eq(payments.id, id),
    })
    if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })

    const lines = await db
      .select()
      .from(paymentLineItems)
      .where(eq(paymentLineItems.paymentId, id))
      .orderBy(paymentLineItems.createdAt)

    return NextResponse.json({ payment, lineItems: lines })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
