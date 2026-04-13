import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { units } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { unitSchema } from '@/lib/validations/unit'

export async function GET() {
  try {
    await requireRole('viewer')
    const all = await db.select().from(units).orderBy(desc(units.createdAt))
    return NextResponse.json(all)
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
    const data = unitSchema.parse(body)

    const [unit] = await db
      .insert(units)
      .values({
        type: data.type,
        identifier: data.identifier,
        groupId: data.groupId ?? null,
        floor: data.floor || null,
        address: data.address || null,
        description: data.description || null,
      })
      .returning()

    return NextResponse.json(unit, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
