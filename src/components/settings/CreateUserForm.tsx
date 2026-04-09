'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, type CreateUserFormData } from '@/lib/validations/user'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function CreateUserForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: 'viewer' },
  })

  async function onSubmit(data: CreateUserFormData) {
    setServerError(null)
    setSuccess(false)

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      setServerError(json.error ?? 'Ocurrió un error')
      return
    }

    reset()
    setSuccess(true)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nombre *" error={errors.name?.message}>
          <Input {...register('name')} placeholder="Juan García" />
        </Field>
        <Field label="Email *" error={errors.email?.message}>
          <Input {...register('email')} type="email" placeholder="juan@ejemplo.com" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Contraseña temporal *" error={errors.password?.message}>
          <Input {...register('password')} type="password" placeholder="Mínimo 8 caracteres" />
        </Field>
        <Field label="Rol *" error={errors.role?.message}>
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className='cursor-pointer'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer — solo lectura</SelectItem>
                  <SelectItem value="admin">Admin — gestión sin usuarios</SelectItem>
                  <SelectItem value="superadmin">Superadmin — acceso completo</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          Usuario creado correctamente.
        </div>
      )}

      <Button className='cursor-pointer' type="submit" disabled={isSubmitting} size="sm">
        {isSubmitting ? 'Creando...' : 'Crear usuario'}
      </Button>
    </form>
  )
}
