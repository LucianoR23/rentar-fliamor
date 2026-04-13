import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { invoiceTemplates } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { invoiceTemplateSchema } from '@/lib/validations/invoice'

export async function GET() {
  try {
    await requireRole('viewer')
    const all = await db.select().from(invoiceTemplates)
    return NextResponse.json(all)
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireRole('superadmin')
    const body: unknown = await request.json()
    const data = invoiceTemplateSchema.parse(body)

    // Upsert: update if exists, insert if not
    const existing = await db.query.invoiceTemplates.findFirst({
      where: eq(invoiceTemplates.unitType, data.unitType),
    })

    if (existing) {
      const [updated] = await db
        .update(invoiceTemplates)
        .set({ template: data.template, updatedAt: new Date() })
        .where(eq(invoiceTemplates.id, existing.id))
        .returning()
      return NextResponse.json(updated)
    }

    const [created] = await db
      .insert(invoiceTemplates)
      .values({ unitType: data.unitType, template: data.template })
      .returning()

    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const err = e as Error
    if (err.message === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.message === 'Forbidden') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
