import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { cancelPaymentSchema } from '@/lib/validations/payment'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params
    const body: unknown = await request.json()
    const data = cancelPaymentSchema.parse(body)

    const existing = await db.query.payments.findFirst({
      where: eq(payments.id, id),
    })

    if (!existing) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    if (existing.status === 'paid') {
      return NextResponse.json({ error: 'No se puede cancelar un pago ya cobrado' }, { status: 400 })
    }

    if (existing.status === 'cancelled') {
      return NextResponse.json({ error: 'El pago ya está cancelado' }, { status: 400 })
    }

    const [updated] = await db
      .update(payments)
      .set({
        status: 'cancelled',
        cancelledReason: data.reason,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning()

    return NextResponse.json(updated)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
