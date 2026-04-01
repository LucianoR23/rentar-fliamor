import { z } from 'zod/v3'

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Requerido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['superadmin', 'viewer']),
})

export const updateRoleSchema = z.object({
  role: z.enum(['superadmin', 'viewer']),
})

export type CreateUserFormData = z.infer<typeof createUserSchema>
