import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { groupSchema } from '@/lib/validations/group'

export async function GET() {
  try {
    await requireRole('viewer')
    const all = await db.select().from(groups).orderBy(desc(groups.createdAt))
    return NextResponse.json(all)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('superadmin')
    const body: unknown = await request.json()
    const data = groupSchema.parse(body)

    const [group] = await db
      .insert(groups)
      .values({
        name: data.name,
        address: data.address,
        description: data.description || null,
      })
      .returning()

    return NextResponse.json(group, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
