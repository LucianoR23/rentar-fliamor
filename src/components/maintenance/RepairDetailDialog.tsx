'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FilesSection } from '@/components/files/FilesSection'
import { formatCurrency, formatDate } from '@/lib/utils'
import { UNIT_OF_MEASURE_LABELS } from '@/lib/validations/material'
import type { RepairWithRelations } from '@/types'
import type { File as FileRecord } from '@/types'

interface RepairDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  repair: RepairWithRelations | null
  files: FileRecord[]
}

export function RepairDetailDialog({ open, onOpenChange, repair, files }: RepairDetailDialogProps) {
  if (!repair) return null

  const materialCost = repair.repairMaterials.reduce((sum, rm) => {
    if (!rm.unitCostSnapshot) return sum
    return sum + Number(rm.unitCostSnapshot) * rm.quantity
  }, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del arreglo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Unidad</dt>
              <dd className="font-medium">{repair.unit.identifier}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Fecha</dt>
              <dd className="font-medium">{formatDate(repair.repairDate)}</dd>
            </div>
            {repair.contract && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Contrato</dt>
                <dd className="font-medium">Contrato activo</dd>
              </div>
            )}
            {repair.laborCost && (
              <div>
                <dt className="text-muted-foreground">Mano de obra</dt>
                <dd className="font-medium font-mono tabular-nums">
                  {formatCurrency(repair.laborCost)}
                </dd>
              </div>
            )}
          </dl>

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Descripción
            </h4>
            <p className="text-sm whitespace-pre-wrap">{repair.description}</p>
          </div>

          {repair.repairMaterials.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Materiales utilizados
              </h4>
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left px-3 py-1.5 font-medium">Material</th>
                      <th className="text-right px-3 py-1.5 font-medium">Cant.</th>
                      <th className="text-right px-3 py-1.5 font-medium">Costo unit.</th>
                      <th className="text-right px-3 py-1.5 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repair.repairMaterials.map((rm) => {
                      const subtotal = rm.unitCostSnapshot
                        ? Number(rm.unitCostSnapshot) * rm.quantity
                        : null
                      return (
                        <tr key={rm.id} className="border-b border-border last:border-0">
                          <td className="px-3 py-1.5">
                            {rm.material.name}
                            <span className="text-muted-foreground text-xs ml-1">
                              ({UNIT_OF_MEASURE_LABELS[rm.material.unitOfMeasure].toLowerCase()})
                            </span>
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">{rm.quantity}</td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                            {rm.unitCostSnapshot ? formatCurrency(rm.unitCostSnapshot) : '—'}
                          </td>
                          <td className="px-3 py-1.5 text-right font-mono tabular-nums">
                            {subtotal !== null ? formatCurrency(subtotal) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {materialCost > 0 && (
                    <tfoot>
                      <tr className="bg-muted/50">
                        <td colSpan={3} className="px-3 py-1.5 text-right font-medium">
                          Total materiales (ref.)
                        </td>
                        <td className="px-3 py-1.5 text-right font-mono tabular-nums font-medium">
                          {formatCurrency(materialCost)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          )}

          <FilesSection
            entityType="repair"
            entityId={repair.id}
            initialFiles={files}
            canUpload
            canDelete
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
