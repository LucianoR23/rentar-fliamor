import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { settings } from '@/lib/schema'
import { requireRole } from '@/lib/auth'

export async function GET() {
  try {
    await requireRole('viewer')
    const [row] = await db
      .select({ value: settings.value })
      .from(settings)
      .where(eq(settings.key, 'commission_percentage'))
      .limit(1)
    return NextResponse.json({ percentage: row ? Number(row.value) : 0 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole('admin')
    const body = (await request.json()) as { percentage?: number }
    const percentage = Number(body.percentage)

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return NextResponse.json({ error: 'Porcentaje inválido (0-100)' }, { status: 400 })
    }

    const [existing] = await db
      .select({ id: settings.id })
      .from(settings)
      .where(eq(settings.key, 'commission_percentage'))
      .limit(1)

    if (existing) {
      await db
        .update(settings)
        .set({ value: String(percentage), updatedAt: new Date() })
        .where(eq(settings.id, existing.id))
    } else {
      await db
        .insert(settings)
        .values({ key: 'commission_percentage', value: String(percentage) })
    }

    return NextResponse.json({ percentage })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
