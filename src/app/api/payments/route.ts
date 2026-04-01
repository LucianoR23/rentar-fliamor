import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { payments } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { registerPaymentSchema } from '@/lib/validations/payment'

export async function POST(request: NextRequest) {
  try {
    await requireRole('superadmin')
    const body: unknown = await request.json()
    const data = registerPaymentSchema.parse(body)

    const existing = await db.query.payments.findFirst({
      where: eq(payments.id, data.paymentId),
    })

    if (!existing) {
      return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
    }

    const amountDue = Number(existing.amountDue)
    const status = data.amountPaid >= amountDue ? 'paid' : 'partial'

    const [updated] = await db
      .update(payments)
      .set({
        amountPaid: String(data.amountPaid),
        paymentDate: data.paymentDate,
        notes: data.notes ?? null,
        status,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, data.paymentId))
      .returning()

    return NextResponse.json(updated)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
