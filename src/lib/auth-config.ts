import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  user: {
    modelName: 'users',
    additionalFields: {
      role: { type: 'string', defaultValue: 'viewer', input: false },
    },
  },
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  plugins: [admin()],
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
})
