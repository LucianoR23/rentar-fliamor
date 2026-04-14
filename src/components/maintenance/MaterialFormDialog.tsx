'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FilesSection } from '@/components/files/FilesSection'
import { materialSchema, UNIT_OF_MEASURE_LABELS, type MaterialFormData } from '@/lib/validations/material'
import type { Material } from '@/types'

interface MaterialFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  material?: Material | null
}

function MaterialFormContent({ material, onClose }: { material?: Material | null; onClose: () => void }) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)
  const isEdit = !!material

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MaterialFormData>({
    resolver: zodResolver(materialSchema),
    defaultValues: material
      ? {
          name: material.name,
          stock: material.stock,
          unitOfMeasure: material.unitOfMeasure,
          unitCost: material.unitCost ? Number(material.unitCost) : null,
          observations: material.observations ?? '',
        }
      : {
          name: '',
          stock: 0,
          unitOfMeasure: 'unit',
          unitCost: null,
          observations: '',
        },
  })

  async function onSubmit(data: MaterialFormData) {
    setServerError(null)
    const url = isEdit ? `/api/materials/${material.id}` : '/api/materials'
    const method = isEdit ? 'PATCH' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const result = (await res.json()) as { id: string }
      toast.success(isEdit ? 'Material actualizado' : 'Material creado')
      if (!isEdit) {
        setCreatedId(result.id)
      } else {
        onClose()
        router.refresh()
      }
    } else {
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      setServerError(json.error ?? 'Error al guardar')
    }
  }

  function handleFinish() {
    onClose()
    router.refresh()
  }

  if (createdId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-success font-medium">Material creado correctamente.</p>
        <FilesSection
          entityType="material"
          entityId={createdId}
          initialFiles={[]}
          canUpload
          canDelete
        />
        <DialogFooter>
          <Button className="cursor-pointer" onClick={handleFinish}>
            Finalizar
          </Button>
        </DialogFooter>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="mat-name">Nombre *</Label>
        <Input
          id="mat-name"
          placeholder="Ej: Cemento, Pintura látex, Caño PVC"
          aria-invalid={!!errors.name}
          {...register('name')}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="mat-stock">Cantidad en stock *</Label>
          <Input
            id="mat-stock"
            type="number"
            min={0}
            step={1}
            aria-invalid={!!errors.stock}
            {...register('stock')}
          />
          {errors.stock && <p className="text-xs text-destructive">{errors.stock.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Unidad de medida *</Label>
          <Controller
            name="unitOfMeasure"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(UNIT_OF_MEASURE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unitOfMeasure && (
            <p className="text-xs text-destructive">{errors.unitOfMeasure.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mat-cost">Costo unitario (ARS)</Label>
        <CurrencyInput
          id="mat-cost"
          placeholder="0.00"
          {...register('unitCost')}
        />
        {errors.unitCost && <p className="text-xs text-destructive">{errors.unitCost.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="mat-obs">Observaciones</Label>
        <Textarea
          id="mat-obs"
          rows={2}
          placeholder="Notas opcionales..."
          {...register('observations')}
        />
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <DialogFooter>
        <Button type="button" variant="ghost" className="cursor-pointer" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear material'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function MaterialFormDialog({ open, onOpenChange, material }: MaterialFormDialogProps) {
  const isEdit = !!material

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar material' : 'Nuevo material'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Modificá los datos del material.' : 'Completá los datos del nuevo material.'}
          </DialogDescription>
        </DialogHeader>
        {open && (
          <MaterialFormContent
            key={material?.id ?? 'new'}
            material={material}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
