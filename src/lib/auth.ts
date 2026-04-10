import { auth } from './auth-config'
import { headers } from 'next/headers'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'

const ROLE_LEVEL = { superadmin: 3, admin: 2, viewer: 1, user: 0 } as const

export async function requireRole(minRole: 'superadmin' | 'admin' | 'viewer') {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })
  if (!dbUser) throw new Error('Unauthorized')

  if (ROLE_LEVEL[dbUser.role] < ROLE_LEVEL[minRole]) {
    throw new Error('Forbidden')
  }

  return dbUser
}
