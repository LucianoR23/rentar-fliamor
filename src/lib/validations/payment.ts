import { z } from 'zod/v3'

export const registerPaymentSchema = z.object({
  paymentId: z.string().uuid('ID de pago inválido'),
  amountPaid: z.coerce.number().positive('El monto debe ser mayor a 0'),
  paymentDate: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  applyCommission: z.boolean().optional(),
})

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>

export const cancelPaymentSchema = z.object({
  paymentId: z.string().uuid('ID de pago inválido'),
  reason: z.string().min(1, 'El motivo es requerido').max(500, 'Máximo 500 caracteres'),
})

export type CancelPaymentInput = z.infer<typeof cancelPaymentSchema>
