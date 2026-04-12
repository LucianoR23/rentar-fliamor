'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { key: 'units', label: 'Unidades' },
  { key: 'expenses', label: 'Gastos' },
  { key: 'config', label: 'Configuración' },
]

export function GroupTabs({ groupId, activeTab }: { groupId: string; activeTab: string }) {
  const router = useRouter()

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => router.push(`/groups/${groupId}?tab=${value}`)}
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
