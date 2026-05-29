'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { authClient } from '@/lib/auth-client'
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/user'
import { AuthShell, AuthInput, AuthSubmit } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({ resolver: zodResolver(forgotPasswordSchema) })

  async function onSubmit(data: ForgotPasswordFormData) {
    // No revelamos si el email existe o no (anti-enumeración).
    await authClient.requestPasswordReset({
      email: data.email,
      redirectTo: '/reset-password',
    })
    setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="Revisá tu email" subtitle="Solicitud enviada">
        <div className="flex flex-col gap-4">
          <div className="rounded-lg px-3 py-2.5 text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/20">
            Si <span className="font-medium">{getValues('email')}</span> tiene una cuenta, te enviamos un enlace
            para restablecer tu contraseña. Revisá también la carpeta de spam.
          </div>
          <Link
            href="/sign-in"
            className="text-center text-sm text-violet-300 hover:text-violet-200 transition-colors"
          >
            Volver a ingresar
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="¿Olvidaste tu contraseña?" subtitle="Te enviamos un enlace por email">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-zinc-300">
            Email
          </label>
          <AuthInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="admin@ejemplo.com"
            {...register('email')}
          />
          {errors.email && <span className="text-xs text-red-400">{errors.email.message}</span>}
        </div>

        <AuthSubmit loading={isSubmitting} loadingLabel="Enviando...">
          Enviar enlace
        </AuthSubmit>

        <Link
          href="/sign-in"
          className="text-center text-sm text-violet-300 hover:text-violet-200 transition-colors"
        >
          Volver a ingresar
        </Link>
      </form>
    </AuthShell>
  )
}
