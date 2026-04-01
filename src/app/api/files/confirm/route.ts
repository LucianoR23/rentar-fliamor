import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v3'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { files } from '@/lib/schema'

const bodySchema = z.object({
  key: z.string().min(1),
  publicUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  entityType: z.enum(['unit', 'contract', 'expense', 'group_expense']),
  entityId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  let user
  try {
    user = await requireRole('viewer')
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { key, publicUrl, fileName, mimeType, sizeBytes, entityType, entityId } = parsed.data

  const [file] = await db
    .insert(files)
    .values({
      entityType,
      entityId,
      name: fileName,
      r2Key: key,
      r2Url: publicUrl,
      mimeType,
      sizeBytes,
      uploadedBy: user.email,
    })
    .returning()

  return NextResponse.json(file, { status: 201 })
}
