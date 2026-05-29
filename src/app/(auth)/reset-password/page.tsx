'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/user'
import { AuthShell, AuthInput, AuthSubmit } from '@/components/auth/AuthShell'

function InvalidToken() {
  return (
    <AuthShell title="Enlace inválido" subtitle="No se pudo restablecer la contraseña">
      <div className="flex flex-col gap-4">
        <div className="rounded-lg px-3 py-2.5 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
          El enlace es inválido o ya venció. Solicitá uno nuevo desde la pantalla de recuperación.
        </div>
        <Link
          href="/forgot-password"
          className="text-center text-sm text-violet-300 hover:text-violet-200 transition-colors"
        >
          Pedir un enlace nuevo
        </Link>
      </div>
    </AuthShell>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const linkError = searchParams.get('error')
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) })

  if (!token || linkError) return <InvalidToken />

  async function onSubmit(data: ResetPasswordFormData) {
    setServerError(null)
    const { error } = await authClient.resetPassword({
      newPassword: data.newPassword,
      token: token!,
    })

    if (error) {
      const msg =
        error.code === 'INVALID_TOKEN' || error.code === 'TOKEN_EXPIRED'
          ? 'El enlace es inválido o ya venció. Pedí uno nuevo.'
          : error.message ?? 'No se pudo restablecer la contraseña'
      setServerError(msg)
      return
    }

    toast.success('Contraseña restablecida')
    router.replace('/sign-in')
  }

  return (
    <AuthShell title="Nueva contraseña" subtitle="Elegí una contraseña segura">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="newPassword" className="text-xs font-medium text-zinc-300">
            Nueva contraseña
          </label>
          <AuthInput
            id="newPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('newPassword')}
          />
          {errors.newPassword && <span className="text-xs text-red-400">{errors.newPassword.message}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-zinc-300">
            Repetir contraseña
          </label>
          <AuthInput
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <span className="text-xs text-red-400">{errors.confirmPassword.message}</span>
          )}
        </div>

        {serverError && (
          <div className="rounded-lg px-3 py-2.5 text-sm text-red-300 bg-red-500/10 border border-red-500/20">
            {serverError}
          </div>
        )}

        <AuthSubmit loading={isSubmitting} loadingLabel="Guardando...">
          Restablecer contraseña
        </AuthSubmit>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
