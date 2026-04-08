# Plan de Migracin: Supabase  Coolify Self-Hosted + Better Auth

## Resumen

Migrar RentAR Admin de Supabase (Auth + PostgreSQL) a una infraestructura 100% self-hosted en Coolify: PostgreSQL propio + Better Auth para autenticacin.

---

## Estado Actual

| Componente | Proveedor Actual | Destino |
|---|---|---|
| PostgreSQL | Supabase (pooler) | PostgreSQL en Coolify |
| Auth | Supabase Auth | Better Auth |
| Files | Cloudflare R2 | Sin cambios |
| Cache | Upstash Redis | Sin cambios (o Redis en Coolify si quers) |
| Email | Resend | Sin cambios |

### Archivos que usan Supabase (alcance de la migracin)

| Archivo | Uso | Accin |
|---|---|---|
| `src/lib/supabase/client.ts` | Browser client para auth | ELIMINAR |
| `src/lib/supabase/server.ts` | Server client para auth | ELIMINAR |
| `src/lib/supabase/admin.ts` | Admin client (crear/borrar usuarios) | ELIMINAR |
| `src/lib/auth.ts` | `requireRole()` lee sesin de Supabase | REESCRIBIR con Better Auth |
| `src/proxy.ts` | Middleware auth con Supabase SSR | REESCRIBIR con Better Auth |
| `src/app/(auth)/sign-in/page.tsx` | Login con `signInWithPassword` | REESCRIBIR con Better Auth client |
| `src/app/api/users/route.ts` | POST crea usuario en Supabase Auth + DB | REESCRIBIR con Better Auth admin |
| `src/app/api/users/[id]/route.ts` | DELETE borra usuario de Supabase Auth + DB | REESCRIBIR con Better Auth admin |
| `src/components/layout/Header.tsx` | `signOut()` del cliente Supabase | REESCRIBIR con Better Auth client |
| `src/lib/db.ts` | Connection string apunta a Supabase pooler | ACTUALIZAR URL |
| `src/lib/schema.ts` | Columna `supabaseId` en tabla `users` | MIGRAR a Better Auth schema |

---

## Fase 1: PostgreSQL en Coolify

### 1.1 Crear servicio PostgreSQL en Coolify
- Crear un nuevo servicio PostgreSQL en el dashboard de Coolify
- Anotar la connection string interna (ej: `postgresql://user:pass@postgres:5432/rentar`)
- Configurar backup automatico si Coolify lo soporta

### 1.2 Exportar datos de Supabase
```bash
# Exportar solo el schema public (no auth/storage schemas de Supabase)
pg_dump --no-owner --no-acl --schema=public \
  "postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres" \
  > rentar_dump.sql
```

### 1.3 Importar en PostgreSQL de Coolify
```bash
psql "postgresql://user:pass@coolify-postgres-host:5432/rentar" < rentar_dump.sql
```

### 1.4 Actualizar `DATABASE_URL`
- Cambiar la variable de entorno en Coolify al nuevo PostgreSQL
- En `src/lib/db.ts`: el comentario sobre `prepare: false` ya no aplica si no usas pooler; podrías remover esa opción o dejarlo (no rompe nada)

### 1.5 Verificar con Drizzle
```bash
# Confirmar que el schema matchea
pnpm drizzle-kit push --dry-run
```

---

## Fase 2: Instalar y Configurar Better Auth

### 2.1 Instalar dependencias
```bash
pnpm add better-auth
pnpm remove @supabase/ssr @supabase/supabase-js
```

### 2.2 Crear configuracin de Better Auth

**Nuevo archivo: `src/lib/auth-config.ts`**
- Configurar Better Auth con el plugin `admin` (para CRUD de usuarios)
- Usar Drizzle adapter apuntando a la misma DB
- Configurar email + password como metodo de auth
- Configurar `trustedOrigins` con la URL de la app

Estructura esperada:
```ts
import { betterAuth } from 'better-auth'
import { admin } from 'better-auth/plugins'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [admin()],
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL!],
})
```

### 2.3 Crear API route para Better Auth

**Nuevo archivo: `src/app/api/auth/[...all]/route.ts`**
- Expone los endpoints de Better Auth (`/api/auth/*`)
- Maneja sign-in, sign-out, session, etc.

```ts
import { auth } from '@/lib/auth-config'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

### 2.4 Crear cliente de Better Auth

**Nuevo archivo: `src/lib/auth-client.ts`** (reemplaza `supabase/client.ts`)
```ts
import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [adminClient()],
})
```

### 2.5 Generar tablas de Better Auth
```bash
pnpm dlx @better-auth/cli generate --config src/lib/auth-config.ts
# O usar: pnpm dlx @better-auth/cli migrate
```
Esto crear tablas: `user`, `session`, `account`, `verification`.

---

## Fase 3: Migrar Schema de Usuarios

### 3.1 Reconciliar tabla `users` existente con Better Auth

Better Auth espera una tabla `user` con campos: `id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`.

**Opciones:**
- **Opcin A (recomendada):** Configurar Better Auth para usar tu tabla `users` existente con field mapping. Better Auth soporta `user.modelName` y `user.fields` para mapear campos custom.
- **Opcin B:** Dejar que Better Auth cree su propia tabla `user` y mantener tu tabla `users` con una referencia.

**Con Opcin A**, el config quedara:
```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  user: {
    modelName: 'users', // tu tabla existente
    additionalFields: {
      role: { type: 'string', defaultValue: 'viewer', input: false },
    },
  },
  emailAndPassword: { enabled: true },
  plugins: [admin()],
})
```

### 3.2 Migrar columna `supabaseId`
- La columna `supabase_id` ya no se necesita
- Better Auth usa su propio `id` como PK de usuario
- Crear migracin Drizzle para:
  1. Agregar columnas requeridas por Better Auth (`email_verified`, `image`, `updated_at` si no existe)
  2. Eliminar columna `supabase_id`
  3. Crear tablas `session`, `account`, `verification`

### 3.3 Crear tu usuario en Better Auth
Como solo tens un usuario, lo ms simple:
```bash
# Despus de migrar, crear tu usuario via la API o un script seed:
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Tu Nombre","email":"tu@email.com","password":"tu-password"}'
```
Luego asignarle `role: 'superadmin'` directamente en la DB.

---

## Fase 4: Reescribir Archivos de Auth

### 4.1 `src/lib/auth.ts` — `requireRole()`
```ts
import { auth } from './auth-config'
import { headers } from 'next/headers'
import { db } from './db'
import { users } from './schema'
import { eq } from 'drizzle-orm'

export async function requireRole(role: 'superadmin' | 'viewer') {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })
  if (!dbUser) throw new Error('Unauthorized')

  if (role === 'superadmin' && dbUser.role !== 'superadmin') {
    throw new Error('Forbidden')
  }

  return dbUser
}
```

### 4.2 `src/proxy.ts` — Middleware
```ts
import { auth } from '@/lib/auth-config'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers })

  const { pathname } = request.nextUrl
  const isPublic = pathname.startsWith('/sign-in')
  const isAuthApi = pathname.startsWith('/api/auth')
  const isProtectedApi = pathname.startsWith('/api') && !pathname.startsWith('/api/indices') && !isAuthApi

  if ((!isPublic || isProtectedApi) && !session) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  if (pathname === '/sign-in' && session) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}
```

### 4.3 `src/app/(auth)/sign-in/page.tsx`
- Reemplazar `supabase.auth.signInWithPassword()` por `authClient.signIn.email()`
- Eliminar import de Supabase client

### 4.4 `src/components/layout/Header.tsx`
- Reemplazar `supabase.auth.signOut()` por `authClient.signOut()`

### 4.5 `src/app/api/users/route.ts` — POST (crear usuario)
- Reemplazar `supabase.auth.admin.createUser()` por `auth.api.createUser()` del plugin admin de Better Auth
- Ya no necesita crear en dos lugares (auth + DB) porque Better Auth usa la misma tabla

### 4.6 `src/app/api/users/[id]/route.ts` — DELETE (borrar usuario)
- Reemplazar `supabase.auth.admin.deleteUser()` por la API admin de Better Auth
- Eliminar import de `createAdminClient`

### 4.7 Eliminar directorio `src/lib/supabase/`
- Borrar `client.ts`, `server.ts`, `admin.ts`
- Todo reemplazado por `auth-config.ts` y `auth-client.ts`

---

## Fase 5: Variables de Entorno

### Eliminar
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### Actualizar
```
DATABASE_URL=postgresql://user:pass@postgres:5432/rentar  # PostgreSQL de Coolify
```

### Agregar
```
BETTER_AUTH_SECRET=<random-string-de-32-chars>  # Para firmar sesiones
BETTER_AUTH_URL=https://tu-dominio.com          # URL base de la app
```

---

## Fase 6: Deploy en Coolify

### 6.1 Crear servicios en Coolify
1. **PostgreSQL** — servicio de base de datos
2. **Next.js App** — servicio de aplicacin (Dockerfile o Nixpacks)

### 6.2 Dockerfile (si Nixpacks no funciona bien)
```dockerfile
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### 6.3 Configurar Next.js para standalone output
En `next.config.ts`:
```ts
output: 'standalone'
```

### 6.4 Variables de entorno en Coolify
Configurar todas las env vars en el dashboard de Coolify para el servicio Next.js:
- `DATABASE_URL` (connection string interna de Coolify, ej: `postgresql://...@postgres:5432/rentar`)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `R2_*` (mantener las mismas)
- `UPSTASH_*` (mantener las mismas)
- `RESEND_API_KEY`
- Etc.

### 6.5 Red interna
- PostgreSQL y Next.js deben estar en la misma red de Coolify para que la app acceda a la DB por hostname interno

---

## Orden de Ejecucin

| # | Tarea | Dependencia |
|---|---|---|
| 1 | Configurar PostgreSQL en Coolify | - |
| 2 | Exportar/importar datos de Supabase | 1 |
| 3 | Instalar Better Auth, remover Supabase deps | - |
| 4 | Crear `auth-config.ts` y `auth-client.ts` | 3 |
| 5 | Crear API route `/api/auth/[...all]` | 4 |
| 6 | Generar/migrar tablas de Better Auth en DB | 2, 4 |
| 7 | Migrar schema `users` (quitar `supabaseId`, agregar campos) | 6 |
| 8 | Reescribir `auth.ts` (`requireRole`) | 4 |
| 9 | Reescribir `proxy.ts` (middleware) | 4 |
| 10 | Reescribir `sign-in/page.tsx` | 4 |
| 11 | Reescribir `Header.tsx` (signOut) | 4 |
| 12 | Reescribir `api/users/route.ts` (crear usuario) | 4 |
| 13 | Reescribir `api/users/[id]/route.ts` (borrar usuario) | 4 |
| 14 | Eliminar `src/lib/supabase/` | 8-13 |
| 15 | Actualizar variables de entorno | 7 |
| 16 | Crear usuario superadmin en Better Auth | 7 |
| 17 | Configurar `output: 'standalone'` en next.config | - |
| 18 | Crear Dockerfile | 17 |
| 19 | Deploy en Coolify | 15, 16, 18 |
| 20 | Test end-to-end: login, CRUD, roles | 19 |

---

## Riesgos y Notas

- **Un solo usuario**: la migracin de datos de auth es trivial. Solo necesits crear tu usuario de nuevo con Better Auth.
- **Datos de negocio**: no cambian. Las tablas de contratos, pagos, inquilinos, etc. se copian tal cual con `pg_dump`.
- **Downtime**: mnimo. Pods hacer todo el desarrollo de auth en local, y al deployar en Coolify solo necesits crear tu usuario nuevo.
- **Rollback**: manten la cuenta de Supabase activa hasta confirmar que todo funciona en Coolify.
- **Redis**: Upstash funciona desde cualquier host. Si en el futuro quers Redis self-hosted tambin, pods agregar un servicio Redis en Coolify.
