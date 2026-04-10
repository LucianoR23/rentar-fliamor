import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'
import * as schema from './schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  user: {
    modelName: 'users',
    additionalFields: {
      role: { type: 'string', defaultValue: 'viewer', input: false },
    },
  },
  session: { modelName: 'sessions' },
  account: { modelName: 'accounts' },
  verification: { modelName: 'verifications' },
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
  },
  plugins: [admin()],
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
})
