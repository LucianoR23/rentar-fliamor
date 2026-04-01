import { z } from 'zod/v3'

export const tenantSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  dni: z.string().min(7, 'DNI inválido').max(20),
  phone: z.string().min(6, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  address: z.string().optional(),
  guarantorName: z.string().optional(),
  guarantorPhone: z.string().optional(),
  guarantorDni: z.string().optional(),
  notes: z.string().optional(),
})

export type TenantFormData = z.infer<typeof tenantSchema>
