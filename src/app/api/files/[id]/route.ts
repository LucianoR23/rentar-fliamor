import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { files } from '@/lib/schema'
import { deleteFromR2 } from '@/lib/r2'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireRole('superadmin')
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const { id } = await params
  const file = await db.query.files.findFirst({ where: eq(files.id, id) })
  if (!file) return NextResponse.json({ error: 'Archivo no encontrado' }, { status: 404 })

  await deleteFromR2(file.r2Key)
  await db.delete(files).where(eq(files.id, id))

  return new NextResponse(null, { status: 204 })
}
