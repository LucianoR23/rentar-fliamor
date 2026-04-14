import { z } from 'zod/v3'

export const TAX_CONDITION_LABELS = {
  monotributista: 'Monotributista',
  responsable_inscripto: 'Responsable Inscripto',
  consumidor_final: 'Consumidor Final',
  exento: 'Exento',
} as const

export const PAYMENT_METHOD_OPTIONS = [
  'Contado',
  'Tarjeta de Débito',
  'Tarjeta de Crédito',
  'Cuenta Corriente',
  'Cheque',
  'Transferencia Bancaria',
  'Otra',
] as const

export type PaymentMethod = typeof PAYMENT_METHOD_OPTIONS[number]

export const createInvoiceSchema = z.object({
  contractId: z.string().uuid('Contrato inválido'),
  amount: z.coerce.number().positive('El monto debe ser positivo'),
  periodMonth: z.coerce.number().int().min(1).max(12),
  periodYear: z.coerce.number().int().min(2020).max(2100),
  description: z.string().min(1, 'La descripción es requerida'),
  taxCondition: z.enum(['monotributista', 'responsable_inscripto', 'consumidor_final', 'exento'], {
    required_error: 'La condición fiscal es requerida',
  }),
  paymentMethod: z.enum(PAYMENT_METHOD_OPTIONS).default('Contado'),
})

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>

export const invoiceTemplateSchema = z.object({
  unitType: z.enum(['apartment', 'local', 'land', 'house', 'other']),
  template: z.string().min(1, 'El template es requerido'),
})

export type InvoiceTemplateFormData = z.infer<typeof invoiceTemplateSchema>
