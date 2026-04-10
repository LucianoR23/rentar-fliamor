import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { auth } from '@/lib/auth-config'
import { requireRole } from '@/lib/auth'
import { adminResetPasswordSchema } from '@/lib/validations/user'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireRole('superadmin')
    const { id } = await params

    const target = await db.query.users.findFirst({ where: eq(users.id, id) })
    if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    const body: unknown = await request.json()
    const { newPassword } = adminResetPasswordSchema.parse(body)

    await auth.api.setUserPassword({
      headers: await headers(),
      body: { userId: id, newPassword },
    })

    await auth.api.revokeUserSessions({
      headers: await headers(),
      body: { userId: id },
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
