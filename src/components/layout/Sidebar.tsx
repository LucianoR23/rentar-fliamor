'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, Layers, FileText,
  CreditCard, Receipt, BarChart3, Settings,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/dashboard/units', icon: Building2, label: 'Unidades' },
  { href: '/dashboard/tenants', icon: Users, label: 'Inquilinos' },
  { href: '/dashboard/groups', icon: Layers, label: 'Grupos' },
  { href: '/dashboard/contracts', icon: FileText, label: 'Contratos' },
  { href: '/dashboard/payments', icon: CreditCard, label: 'Pagos' },
  { href: '/dashboard/expenses', icon: Receipt, label: 'Gastos' },
  { href: '/dashboard/reports', icon: BarChart3, label: 'Reportes' },
  { href: '/dashboard/settings', icon: Settings, label: 'Configuración' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'relative flex flex-col shrink-0 border-r border-border bg-sidebar transition-all duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-border px-4',
          collapsed ? 'justify-center' : 'gap-2.5'
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary">
          <span className="text-xs font-bold text-primary-foreground">RA</span>
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm text-sidebar-foreground">RentAR</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 pt-3">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)

          const link = (
            <Link
              href={item.href}
              className={cn(
                'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )

          if (collapsed) {
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            )
          }

          return <div key={item.href}>{link}</div>
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-[3.75rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  )
}
