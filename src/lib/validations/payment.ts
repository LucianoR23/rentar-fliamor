import { z } from 'zod/v3'

export const registerPaymentSchema = z.object({
  paymentId: z.string().uuid('ID de pago inválido'),
  amountPaid: z.coerce.number().positive('El monto debe ser mayor a 0'),
  paymentDate: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>
