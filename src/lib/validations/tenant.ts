import { z } from 'zod/v3'

export const tenantSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  cuitDni: z.string().regex(/^\d{7,11}$/, 'Debe contener entre 7 y 11 dígitos numéricos'),
  phone: z.string().regex(/^\d{6,15}$/, 'Debe contener entre 6 y 15 dígitos numéricos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  address: z.string().optional(),
  guarantorName: z.string().optional(),
  guarantorPhone: z.string().regex(/^\d{6,15}$/, 'Debe contener entre 6 y 15 dígitos numéricos').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  guarantorCuitDni: z.string().regex(/^\d{7,11}$/, 'Debe contener entre 7 y 11 dígitos numéricos').optional().or(z.literal('')).transform((v) => v === '' ? undefined : v),
  notes: z.string().optional(),
  taxCondition: z.enum(['monotributista', 'responsable_inscripto', 'consumidor_final', 'exento']).optional(),
})

export type TenantFormData = z.infer<typeof tenantSchema>
