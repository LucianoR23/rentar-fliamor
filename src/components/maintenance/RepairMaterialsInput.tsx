'use client'

import { useFieldArray, useWatch, Control, UseFormRegister } from 'react-hook-form'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Controller } from 'react-hook-form'
import { formatCurrency } from '@/lib/utils'
import { UNIT_OF_MEASURE_LABELS } from '@/lib/validations/material'
import type { RepairFormData } from '@/lib/validations/repair'
import type { Material } from '@/types'

interface RepairMaterialsInputProps {
  control: Control<RepairFormData>
  register: UseFormRegister<RepairFormData>
  materials: Material[]
}

export function RepairMaterialsInput({ control, register, materials }: RepairMaterialsInputProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'materials',
  })

  const watchedMaterials = useWatch({ control, name: 'materials' }) ?? []

  const totalCost = watchedMaterials.reduce((sum, item) => {
    if (!item) return sum
    const mat = materials.find((m) => m.id === item.materialId)
    if (!mat?.unitCost) return sum
    return sum + Number(mat.unitCost) * (Number(item.quantity) || 0)
  }, 0)

  const hasCosts = watchedMaterials.some((item) => {
    if (!item) return false
    const mat = materials.find((m) => m.id === item.materialId)
    return mat?.unitCost
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Materiales utilizados</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="cursor-pointer"
          onClick={() => append({ materialId: '', quantity: 1 })}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-xs text-muted-foreground">Sin materiales seleccionados.</p>
      )}

      {fields.map((field, index) => {
        const watched = watchedMaterials[index]
        const selectedMaterial = materials.find((m) => m.id === watched?.materialId)
        const subtotal =
          selectedMaterial?.unitCost
            ? Number(selectedMaterial.unitCost) * (Number(watched?.quantity) || 0)
            : null

        return (
          <div key={field.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Controller
                name={`materials.${index}.materialId`}
                control={control}
                render={({ field: f }) => (
                  <Select value={f.value} onValueChange={f.onChange}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Seleccionar material" />
                    </SelectTrigger>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name} ({m.stock} {UNIT_OF_MEASURE_LABELS[m.unitOfMeasure].toLowerCase()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="w-20">
              <Input
                type="number"
                min={1}
                max={selectedMaterial?.stock ?? undefined}
                placeholder="Cant."
                className="text-sm"
                {...register(`materials.${index}.quantity`, { valueAsNumber: true })}
              />
            </div>

            {subtotal !== null && (
              <span className="text-xs text-muted-foreground mt-2 w-24 text-right font-mono tabular-nums">
                {formatCurrency(subtotal)}
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer mt-1"
              onClick={() => remove(index)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )
      })}

      {hasCosts && totalCost > 0 && (
        <div className="flex justify-end pt-1 border-t border-border">
          <span className="text-sm text-muted-foreground">
            Costo materiales (ref.):{' '}
            <span className="font-mono tabular-nums font-medium text-foreground">
              {formatCurrency(totalCost)}
            </span>
          </span>
        </div>
      )}
    </div>
  )
}
