'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { unitSchema, UNIT_TYPE_LABELS, type UnitFormData } from '@/lib/validations/unit'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface UnitFormProps {
  defaultValues?: Partial<UnitFormData>
  unitId?: string
  groups: { id: string; name: string }[]
}

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
      {label && <Label className="text-sm font-medium">{label}</Label>}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

export function UnitForm({ defaultValues, unitId, groups }: UnitFormProps) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const isEdit = !!unitId

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitSchema),
    defaultValues,
  })

  async function onSubmit(data: UnitFormData) {
    setServerError(null)
    const url = isEdit ? `/api/units/${unitId}` : '/api/units'
    const method = isEdit ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({})) as { error?: string }
      setServerError(json.error ?? 'Ocurrió un error')
      return
    }

    const unit = await res.json() as { id: string }
    router.push(`/units/${unit.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl">
      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Datos de la unidad
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo *" error={errors.type?.message}>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className='cursor-pointer'>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(UNIT_TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Identificador *" error={errors.identifier?.message}>
            <Input {...register('identifier')} placeholder="Ej: 1A, PB, Local 3" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Grupo" error={errors.groupId?.message}>
            <Controller
              name="groupId"
              control={control}
              render={({ field }) => (
                <Select
                  value={field.value ?? 'none'}
                  onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                >
                  <SelectTrigger className='cursor-pointer'>
                    <SelectValue placeholder="Sin grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin grupo</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>

          <Field label="Piso / Planta" error={errors.floor?.message}>
            <Input {...register('floor')} placeholder="Ej: 3, PB, Subsuelo" />
          </Field>
        </div>

        <Field label="Descripción" error={errors.description?.message}>
          <Textarea
            {...register('description')}
            placeholder="Observaciones adicionales..."
            className="resize-none h-24"
          />
        </Field>
      </section>

      {serverError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        <Button className='cursor-pointer' type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear unidad'}
        </Button>
        <Button className='cursor-pointer' type="button" variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
      </div>
    </form>
  )
}
