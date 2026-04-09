import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { groupExpenses, groupExpenseUnits } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { groupExpenseSchema } from '@/lib/validations/group-expense'

export async function POST(request: NextRequest) {
  try {
    await requireRole('admin')
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

    // If specific units were selected, save the associations
    if (data.unitIds && data.unitIds.length > 0) {
      await db.insert(groupExpenseUnits).values(
        data.unitIds.map((unitId) => ({
          groupExpenseId: created.id,
          unitId,
        }))
      )
    }

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
