'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, Users, Layers, FileText,
  CreditCard, Receipt, BarChart3, Settings, UserCog,
  Archive, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  icon: React.ElementType
  label: string
  exact?: boolean
  children?: { href: string; icon: React.ElementType; label: string }[]
}

const navItems: NavItem[] = [
  { href: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/units', icon: Building2, label: 'Unidades' },
  { href: '/tenants', icon: Users, label: 'Inquilinos' },
  { href: '/groups', icon: Layers, label: 'Grupos' },
  { href: '/contracts', icon: FileText, label: 'Contratos' },
  { href: '/historial', icon: Archive, label: 'Historial' },
  { href: '/payments', icon: CreditCard, label: 'Pagos' },
  { href: '/expenses', icon: Receipt, label: 'Gastos' },
  { href: '/reports', icon: BarChart3, label: 'Reportes' },
  {
    href: '/settings',
    icon: Settings,
    label: 'Configuración',
    children: [
      { href: '/settings/users', icon: UserCog, label: 'Usuarios' },
    ],
  },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  // Keep settings open if any child is active
  const [settingsOpen, setSettingsOpen] = useState(
    () => pathname.startsWith('/settings')
  )

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

          // Item with children (collapsible group)
          if (item.children) {
            const trigger = (
              <button
                onClick={() => !collapsed && setSettingsOpen((o) => !o)}
                className={cn(
                  'flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 transition-transform duration-200',
                        settingsOpen && 'rotate-180'
                      )}
                    />
                  </>
                )}
              </button>
            )

            return (
              <div key={item.href}>
                {collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  trigger
                )}

                {/* Children */}
                {!collapsed && settingsOpen && (
                  <div className="mt-0.5 ml-3 space-y-0.5 border-l border-border pl-3">
                    {item.children.map((child) => {
                      const childActive = pathname.startsWith(child.href)
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors',
                            childActive
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <child.icon className="h-3.5 w-3.5 shrink-0" />
                          <span>{child.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}

                {/* Collapsed: show children as tooltips */}
                {collapsed && (
                  <div className="mt-0.5 space-y-0.5">
                    {item.children.map((child) => {
                      const childActive = pathname.startsWith(child.href)
                      const childLink = (
                        <Link
                          href={child.href}
                          className={cn(
                            'flex h-9 items-center justify-center rounded-md px-0 text-sm transition-colors',
                            childActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                          )}
                        >
                          <child.icon className="h-4 w-4 shrink-0" />
                        </Link>
                      )
                      return (
                        <Tooltip key={child.href}>
                          <TooltipTrigger asChild>{childLink}</TooltipTrigger>
                          <TooltipContent side="right">{child.label}</TooltipContent>
                        </Tooltip>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          // Regular item
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
        className="absolute -right-3 top-15 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
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
