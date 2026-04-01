import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod/v3'
import { requireRole } from '@/lib/auth'
import { createPresignedPutUrl, r2PublicUrl } from '@/lib/r2'
import { randomUUID } from 'crypto'

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]

const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

const bodySchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().refine((v) => ALLOWED_MIME_TYPES.includes(v), {
    message: 'Tipo de archivo no permitido',
  }),
  sizeBytes: z.number().int().positive().max(MAX_SIZE_BYTES, {
    message: 'El archivo no puede superar 10 MB',
  }),
  entityType: z.enum(['unit', 'contract', 'expense', 'group_expense']),
  entityId: z.string().uuid(),
})

export async function POST(req: NextRequest) {
  try {
    await requireRole('viewer')
  } catch {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const json = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 })
  }

  const { fileName, mimeType, entityType, entityId } = parsed.data
  const ext = fileName.split('.').pop() ?? 'bin'
  const key = `${entityType}/${entityId}/${randomUUID()}.${ext}`

  const presignedUrl = await createPresignedPutUrl(key, mimeType)
  const publicUrl = `${r2PublicUrl}/${key}`

  return NextResponse.json({ presignedUrl, key, publicUrl })
}
