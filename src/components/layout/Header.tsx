'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from './ThemeToggle'
import { createClient } from '@/lib/supabase/client'
import type { UserRole } from '@/types'

interface HeaderProps {
  userName: string
  userEmail: string
  userRole: UserRole
}

const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  units: 'Unidades',
  tenants: 'Inquilinos',
  groups: 'Grupos',
  contracts: 'Contratos',
  payments: 'Pagos',
  expenses: 'Gastos',
  reports: 'Reportes',
  settings: 'Configuración',
  new: 'Nuevo',
  edit: 'Editar',
  receipt: 'Recibo',
  costs: 'Distribución',
}

export function Header({ userName, userEmail, userRole }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs = segments.map((seg) => segmentLabels[seg] ?? seg)

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-muted-foreground/50 mx-0.5">/</span>}
            <span
              className={
                i === breadcrumbs.length - 1
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground'
              }
            >
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Right */}
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className='cursor-pointer' asChild>
            <button className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-muted outline-none">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-foreground">
                {userName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-2">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {userRole}
              </span>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
