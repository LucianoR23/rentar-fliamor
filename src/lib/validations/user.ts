import { z } from 'zod/v3'

export const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(1, 'Requerido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  role: z.enum(['superadmin', 'admin', 'viewer']),
})

export const updateRoleSchema = z.object({
  role: z.enum(['superadmin', 'admin', 'viewer']),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Requerido'),
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const adminResetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
export type AdminResetPasswordFormData = z.infer<typeof adminResetPasswordSchema>
