import { z } from 'zod/v3'

export const groupSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  address: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
})

export type GroupFormData = z.infer<typeof groupSchema>

export const costDistributionSchema = z
  .object({
    apartment: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
    local: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
    land: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
    house: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
    other: z.coerce.number().min(0, 'Mínimo 0').max(100, 'Máximo 100'),
  })
  .refine(
    (data) => Object.values(data).reduce((a, b) => a + b, 0) <= 100,
    { message: 'La suma de porcentajes no puede superar el 100%', path: ['_total'] }
  )

export type CostDistributionFormData = z.infer<typeof costDistributionSchema>
