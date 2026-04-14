'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { key: 'materials', label: 'Materiales' },
  { key: 'repairs', label: 'Arreglos' },
  { key: 'stock-logs', label: 'Historial de Stock' },
]

export function MaintenanceTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter()

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => router.push(`/maintenance?tab=${value}`)}
      className="mb-6"
    >
      <TabsList variant="line">
        {TABS.map((t) => (
          <TabsTrigger key={t.key} value={t.key}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
