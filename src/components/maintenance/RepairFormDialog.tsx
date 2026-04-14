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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CurrencyInput } from '@/components/ui/currency-input'
import { DateInput } from '@/components/ui/date-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FilesSection } from '@/components/files/FilesSection'
import { RepairMaterialsInput } from './RepairMaterialsInput'
import { repairSchema, type RepairFormData } from '@/lib/validations/repair'
import type { Unit, Contract, Material } from '@/types'

interface RepairFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  units: Pick<Unit, 'id' | 'identifier'>[]
  contracts: Pick<Contract, 'id' | 'unitId' | 'status'>[]
  materials: Material[]
}

function RepairFormContent({
  units,
  contracts,
  materials,
  onClose,
}: {
  units: Pick<Unit, 'id' | 'identifier'>[]
  contracts: Pick<Contract, 'id' | 'unitId' | 'status'>[]
  materials: Material[]
  onClose: () => void
}) {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const [createdId, setCreatedId] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RepairFormData>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      unitId: '',
      contractId: null,
      description: '',
      repairDate: new Date().toISOString().slice(0, 10),
      laborCost: null,
      materials: [],
    },
  })

  const selectedUnitId = watch('unitId')
  const availableContracts = contracts.filter(
    (c) => c.unitId === selectedUnitId && c.status === 'active',
  )

  async function onSubmit(data: RepairFormData) {
    setServerError(null)
    const res = await fetch('/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (res.ok) {
      const result = (await res.json()) as { id: string }
      toast.success('Arreglo registrado')
      setCreatedId(result.id)
    } else {
      const json = (await res.json().catch(() => ({}))) as { error?: string }
      const msg = json.error ?? 'Error al guardar'
      setServerError(msg)
      toast.error(msg)
    }
  }

  function handleFinish() {
    onClose()
    router.refresh()
  }

  if (createdId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-success font-medium">Arreglo registrado correctamente.</p>
        <FilesSection
          entityType="repair"
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Unidad *</Label>
          <Controller
            name="unitId"
            control={control}
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar unidad" />
                </SelectTrigger>
                <SelectContent>
                  {[...units].sort((a, b) => a.identifier.localeCompare(b.identifier)).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.identifier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.unitId && <p className="text-xs text-destructive">{errors.unitId.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Contrato</Label>
          <Controller
            name="contractId"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value ?? ''}
                onValueChange={(val) => field.onChange(val || null)}
                disabled={availableContracts.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      availableContracts.length === 0
                        ? 'Sin contrato activo'
                        : 'Opcional'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {availableContracts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      Contrato activo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="rep-desc">Descripción *</Label>
        <Textarea
          id="rep-desc"
          rows={3}
          placeholder="Describí el arreglo realizado..."
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rep-date">Fecha del arreglo *</Label>
          <DateInput
            id="rep-date"
            aria-invalid={!!errors.repairDate}
            {...register('repairDate')}
          />
          {errors.repairDate && (
            <p className="text-xs text-destructive">{errors.repairDate.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rep-labor">Costo mano de obra (ARS)</Label>
          <CurrencyInput
            id="rep-labor"
            placeholder="0.00"
            {...register('laborCost')}
          />
          {errors.laborCost && (
            <p className="text-xs text-destructive">{errors.laborCost.message}</p>
          )}
        </div>
      </div>

      <RepairMaterialsInput
        control={control}
        register={register}
        materials={materials}
      />

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}

      <DialogFooter>
        <Button type="button" variant="ghost" className="cursor-pointer" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" className="cursor-pointer" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Registrar arreglo'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RepairFormDialog({ open, onOpenChange, units, contracts, materials }: RepairFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo arreglo</DialogTitle>
          <DialogDescription>Registrá un arreglo realizado en una unidad.</DialogDescription>
        </DialogHeader>
        {open && (
          <RepairFormContent
            key="new-repair"
            units={units}
            contracts={contracts}
            materials={materials}
            onClose={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
