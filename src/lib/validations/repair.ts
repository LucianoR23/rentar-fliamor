import { z } from 'zod/v3'

export const repairMaterialItemSchema = z.object({
  materialId: z.string().uuid(),
  quantity: z.coerce.number().int().positive('Debe ser al menos 1'),
})

export const repairSchema = z.object({
  unitId: z.string().uuid({ message: 'Seleccioná una unidad' }),
  contractId: z.string().uuid().optional().nullable(),
  description: z.string().min(1, 'La descripción es requerida'),
  repairDate: z.string().min(1, 'La fecha es requerida'),
  laborCost: z.coerce.number().positive('Debe ser mayor a 0').optional().nullable(),
  materials: z.array(repairMaterialItemSchema),
})

export type RepairFormData = z.infer<typeof repairSchema>
export type RepairMaterialItem = z.infer<typeof repairMaterialItemSchema>
