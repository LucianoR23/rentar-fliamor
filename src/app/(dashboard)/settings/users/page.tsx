import { desc } from 'drizzle-orm'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/shared/PageHeader'
import { UsersTable } from '@/components/settings/UsersTable'
import { CreateUserForm } from '@/components/settings/CreateUserForm'

export default async function UsersSettingsPage() {
  let currentUser
  try {
    currentUser = await requireRole('superadmin')
  } catch {
    redirect('/sign-in')
  }

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt))

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Usuarios"
        description="Gestioná quién tiene acceso y con qué permisos."
      />

      <section className="space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Usuarios activos
        </h2>
        <UsersTable data={allUsers} currentUserId={currentUser.id} />
      </section>

      <section className="rounded-lg border border-border bg-card p-6 space-y-4">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Crear usuario
        </h2>
        <CreateUserForm />
      </section>
    </div>
  )
}
