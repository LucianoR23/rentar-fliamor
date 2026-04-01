import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let dbUser
  try {
    dbUser = await requireRole('viewer')
  } catch {
    redirect('/sign-in')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          userName={dbUser.name}
          userEmail={dbUser.email}
          userRole={dbUser.role}
        />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
