import { z } from 'zod/v3'

export const UNIT_OF_MEASURE_LABELS = {
  unit: 'Unidad',
  meter: 'Metro',
  kilogram: 'Kilogramo',
  liter: 'Litro',
} as const

export const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(255),
  stock: z.coerce.number().int('Debe ser un número entero').min(0, 'No puede ser negativo'),
  unitOfMeasure: z.enum(['unit', 'meter', 'kilogram', 'liter'], { required_error: 'Requerido' }),
  unitCost: z.coerce.number().positive('Debe ser mayor a 0').optional().nullable(),
  observations: z.string().max(1000).optional(),
})

export type MaterialFormData = z.infer<typeof materialSchema>
