import { z } from 'zod/v3'

export const contractSchema = z
  .object({
    unitId: z.string().uuid('Seleccioná una unidad'),
    tenantId: z.string().uuid('Seleccioná un inquilino'),
    startDate: z.string().min(1, 'Requerido'),
    endDate: z.string().min(1, 'Requerido'),
    updateFrequencyMonths: z.coerce
      .number()
      .int()
      .min(1, 'Mínimo 1 mes')
      .max(36, 'Máximo 36 meses'),
    updateType: z.enum(['icl', 'ipc', 'fixed_amount', 'fixed_percentage']),
    updateValue: z.coerce.number().optional().nullable(),
    firstMonthPrice: z.coerce.number().positive('Debe ser mayor a 0'),
    depositAmount: z.coerce.number().optional().nullable(),
  })
  .refine((d) => new Date(d.endDate) > new Date(d.startDate), {
    message: 'La fecha de fin debe ser posterior al inicio',
    path: ['endDate'],
  })

export type ContractFormData = z.infer<typeof contractSchema>

export const UPDATE_TYPE_LABELS: Record<string, string> = {
  icl: 'ICL — Índice para Contratos de Locación',
  ipc: 'IPC — Índice de Precios al Consumidor',
  fixed_amount: 'Monto fijo',
  fixed_percentage: 'Porcentaje fijo',
}
