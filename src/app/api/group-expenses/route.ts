import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { groupExpenses } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { groupExpenseSchema } from '@/lib/validations/group-expense'

export async function POST(request: NextRequest) {
  try {
    await requireRole('superadmin')
    const body: unknown = await request.json()
    const data = groupExpenseSchema.parse(body)

    const [created] = await db
      .insert(groupExpenses)
      .values({
        groupId: data.groupId,
        name: data.name,
        amount: String(data.amount),
        periodMonth: data.periodMonth,
        periodYear: data.periodYear,
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
