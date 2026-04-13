import { db } from '@/lib/db'
import { invoiceTemplates } from '@/lib/schema'
import { PageHeader } from '@/components/shared/PageHeader'
import { InvoiceTemplatesEditor } from '@/components/invoices/InvoiceTemplatesEditor'

const UNIT_TYPES = ['apartment', 'local', 'land', 'house', 'other'] as const

const DEFAULT_TEMPLATES: Record<string, string> = {
  apartment: 'Alquiler de departamento {{unit_identifier}} - Periodo {{period}}',
  local: 'Alquiler de local comercial {{unit_identifier}} - Periodo {{period}}',
  land: 'Alquiler de terreno {{unit_identifier}} - Periodo {{period}}',
  house: 'Alquiler de casa {{unit_identifier}} - Periodo {{period}}',
  other: 'Alquiler de unidad {{unit_identifier}} - Periodo {{period}}',
}

export default async function InvoiceTemplatesPage() {
  const existing = await db.select().from(invoiceTemplates)

  const templatesMap = UNIT_TYPES.map((ut) => {
    const found = existing.find((t) => t.unitType === ut)
    return {
      unitType: ut,
      template: found?.template ?? DEFAULT_TEMPLATES[ut],
      saved: !!found,
    }
  })

  return (
    <div>
      <PageHeader
        title="Templates de facturación"
        description="Plantillas de descripción para facturas según tipo de unidad. Variables disponibles: {{unit_identifier}}, {{period}}"
        backHref="/settings"
      />
      <InvoiceTemplatesEditor templates={templatesMap} />
    </div>
  )
}
