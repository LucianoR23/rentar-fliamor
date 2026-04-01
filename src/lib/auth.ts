import { createClient } from './supabase/server'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'

export async function requireRole(role: 'superadmin' | 'viewer') {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Unauthorized')

  let dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  })

  if (!dbUser) {
    const [created] = await db
      .insert(users)
      .values({
        supabaseId: user.id,
        email: user.email!,
        name: (user.user_metadata?.full_name as string | undefined) ?? user.email!,
        role: 'viewer',
      })
      .returning()
    dbUser = created
  }

  if (role === 'superadmin' && dbUser.role !== 'superadmin') {
    throw new Error('Forbidden')
  }

  return dbUser
}
