import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { groups } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { groupSchema } from '@/lib/validations/group'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('viewer')
    const { id } = await params
    const group = await db.query.groups.findFirst({ where: eq(groups.id, id) })
    if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(group)
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
    const data = groupSchema.parse(body)

    const [updated] = await db
      .update(groups)
      .set({
        name: data.name,
        address: data.address,
        description: data.description || null,
        updatedAt: new Date(),
      })
      .where(eq(groups.id, id))
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

export async function PATCH(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('admin')
    const { id } = await params
    await db.update(groups).set({ active: false, updatedAt: new Date() }).where(eq(groups.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('superadmin')
    const { id } = await params
    await db.delete(groups).where(eq(groups.id, id))
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
