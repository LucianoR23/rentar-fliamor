import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { units } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { unitSchema } from '@/lib/validations/unit'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params
    const unit = await db.query.units.findFirst({ where: eq(units.id, id) })
    if (!unit) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(unit)
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
    const data = unitSchema.parse(body)

    const [updated] = await db
      .update(units)
      .set({
        type: data.type,
        identifier: data.identifier,
        groupId: data.groupId ?? null,
        floor: data.floor || null,
        description: data.description || null,
        updatedAt: new Date(),
      })
      .where(eq(units.id, id))
      .returning()

    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
    await db.delete(units).where(eq(units.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
