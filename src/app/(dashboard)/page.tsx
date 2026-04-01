import { PageHeader } from '@/components/shared/PageHeader'

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Resumen general del sistema"
      />
      <div className="rounded-lg border border-border bg-card p-10 text-center text-sm text-muted-foreground">
        KPIs y gráficos — Step 15
      </div>
    </div>
  )
}
