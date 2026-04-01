import { z } from 'zod/v3'

export const expenseSchema = z.object({
  title: z.string().min(1, 'Requerido').max(255, 'Máximo 255 caracteres'),
  amount: z.coerce.number().positive('Debe ser mayor a 0'),
  category: z.string().max(100, 'Máximo 100 caracteres').optional(),
  expenseDate: z.string().min(1, 'La fecha es requerida'),
  notes: z.string().max(1000).optional(),
})

export type ExpenseFormData = z.infer<typeof expenseSchema>
