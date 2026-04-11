import { z } from 'zod/v3'

export const manualChargeSchema = z.object({
  unitId: z.string().uuid('Unidad inválida'),
  description: z.string().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  amount: z.coerce.number().positive('Debe ser mayor a 0'),
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2000).max(2100),
  notes: z.string().max(1000).optional(),
})

export type ManualChargeFormData = z.infer<typeof manualChargeSchema>
