import { z } from 'zod/v3'

export const UNIT_TYPE_LABELS = {
  apartment: 'Departamento',
  local: 'Local',
  land: 'Terreno',
  house: 'Casa',
  other: 'Otro',
} as const

export const unitSchema = z.object({
  type: z.enum(['apartment', 'local', 'land', 'house', 'other']),
  identifier: z.string().min(1, 'Requerido'),
  groupId: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((v) => (v === '' ? undefined : v)),
  floor: z.string().optional(),
  description: z.string().optional(),
})

export type UnitFormData = z.infer<typeof unitSchema>
