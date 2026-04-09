import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { expenses } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { expenseSchema } from '@/lib/validations/expense'

export async function GET() {
  try {
    await requireRole('viewer')
    const rows = await db.select().from(expenses).orderBy(desc(expenses.expenseDate))
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
    const data = expenseSchema.parse(body)

    const [created] = await db
      .insert(expenses)
      .values({
        title: data.title,
        amount: String(data.amount),
        category: data.category ?? null,
        expenseDate: data.expenseDate,
        notes: data.notes ?? null,
      })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
