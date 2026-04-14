import { NextRequest, NextResponse } from 'next/server'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { auth } from '@/lib/auth-config'
import { createUserSchema } from '@/lib/validations/user'

export async function GET() {
  try {
    await requireRole('superadmin')
    const all = await db.select().from(users).orderBy(desc(users.createdAt))
    return NextResponse.json(all)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole('superadmin')
    const body: unknown = await request.json()
    const data = createUserSchema.parse(body)

    const { user: created } = await auth.api.createUser({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: 'user',
      },
    })

    const [dbUser] = await db
      .update(users)
      .set({ role: data.role })
      .where(eq(users.id, created.id))
      .returning()

    return NextResponse.json(dbUser, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
