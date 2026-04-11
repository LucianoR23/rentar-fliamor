import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { settings } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { CommissionForm } from '@/components/settings/CommissionForm'

export default async function SettingsPage() {
  let currentUser
  try {
    currentUser = await requireRole('viewer')
  } catch {
    redirect('/sign-in')
  }

  const [row] = await db
    .select({ value: settings.value })
    .from(settings)
    .where(eq(settings.key, 'commission_percentage'))
    .limit(1)

  const commissionPercentage = row ? Number(row.value) : 0
  const canEdit = currentUser.role === 'superadmin' || currentUser.role === 'admin'

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Configuración"
        description="Configuración general del sistema."
      />

      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Comisión inmobiliaria
        </h2>
        <p className="text-sm text-muted-foreground">
          Porcentaje que se aplica sobre el alquiler cobrado (sin IVA). Es informativo y no afecta los recibos al inquilino.
        </p>
        <CommissionForm defaultPercentage={commissionPercentage} canEdit={canEdit} />
      </section>
    </div>
  )
}
