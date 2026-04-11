import { NextRequest, NextResponse } from 'next/server'
import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { tenants } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { tenantSchema } from '@/lib/validations/tenant'

export async function GET() {
  try {
    await requireRole('viewer')
    const all = await db.select().from(tenants).orderBy(desc(tenants.createdAt))
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
    const data = tenantSchema.parse(body)

    const [tenant] = await db
      .insert(tenants)
      .values({
        firstName: data.firstName,
        lastName: data.lastName,
        cuitDni: data.cuitDni,
        phone: data.phone,
        email: data.email || null,
        address: data.address || null,
        guarantorName: data.guarantorName || null,
        guarantorPhone: data.guarantorPhone || null,
        guarantorCuitDni: data.guarantorCuitDni || null,
        notes: data.notes || null,
      })
      .returning()

    return NextResponse.json(tenant, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
