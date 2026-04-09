import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { updateRoleSchema } from '@/lib/validations/user'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const currentUser = await requireRole('superadmin')
    const { id } = await params

    if (currentUser.id === id) {
      return NextResponse.json({ error: 'No podés cambiar tu propio rol' }, { status: 400 })
    }

    const body: unknown = await request.json()
    const { role } = updateRoleSchema.parse(body)

    const [updated] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, id))
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
    const currentUser = await requireRole('superadmin')
    const { id } = await params

    if (currentUser.id === id) {
      return NextResponse.json({ error: 'No podés eliminarte a vos mismo' }, { status: 400 })
    }

    const target = await db.query.users.findFirst({ where: eq(users.id, id) })
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.delete(users).where(eq(users.id, id))

    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
