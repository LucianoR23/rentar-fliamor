# Plan de Migracin: Supabase  Coolify Self-Hosted + Better Auth

## Resumen

Migrar RentAR Admin de Supabase (Auth + PostgreSQL) a una infraestructura 100% self-hosted en Coolify: PostgreSQL propio + Better Auth para autenticacin.

---

## Infraestructura en Coolify

Project **"infrastructure"** con los siguientes resources:
- **PostgreSQL** (reemplaza Supabase PostgreSQL pooler)
- **Dragonfly** (reemplaza Upstash Redis — compatible con protocolo Redis vía TCP)

## Estado Actual

| Componente | Proveedor Actual | Destino |
|---|---|---|
| PostgreSQL | Supabase (pooler) | PostgreSQL en Coolify (infrastructure) |
| Auth | Supabase Auth | Better Auth |
| Cache/Redis | Upstash Redis (HTTP SDK) | Dragonfly en Coolify (TCP, ioredis) |
| Files | Cloudflare R2 | Sin cambios |
| Email | Resend | Sin cambios |

### Archivos que usan Supabase o Upstash (alcance de la migracin)

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
| `src/lib/redis.ts` | Cliente Upstash Redis (HTTP SDK) | REESCRIBIR con ioredis (TCP para Dragonfly) |
| `src/app/api/cron/alerts/route.ts` | Importa `redis` de `@/lib/redis` | VERIFICAR compatibilidad (misma API) |

---

## Fase 1: PostgreSQL en Coolify

### 1.1 Servicio PostgreSQL en Coolify (ya existe)
- Ya existe en el project **"infrastructure"** de Coolify
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

## Fase 2: Dragonfly en Coolify (reemplaza Upstash Redis)

### 2.1 Servicio Dragonfly en Coolify (ya existe)
- Ya existe en el project **"infrastructure"** de Coolify
- Anotar la connection string interna (ej: `redis://dragonfly:6379` o `redis://user:pass@dragonfly:6379`)
- Dragonfly es drop-in replacement de Redis — soporta todos los comandos estándar

### 2.2 Reescribir `src/lib/redis.ts`
Reemplazar `@upstash/redis` (HTTP) por `ioredis` (TCP), que es compatible con Dragonfly:

```bash
pnpm add ioredis
pnpm remove @upstash/redis
```

**Nuevo contenido de `src/lib/redis.ts`:**
```ts
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!)
```

### 2.3 Verificar compatibilidad de uso
- `src/app/api/cron/alerts/route.ts` importa `redis` de `@/lib/redis` — verificar que los métodos usados (`get`, `set`, `del`, etc.) tienen la misma firma en `ioredis`
- `ioredis` usa la misma API de comandos Redis que Upstash para operaciones básicas, pero `ioredis` retorna tipos nativos (no necesita `.json()` ni similar)

### 2.4 Migrar datos de cache (opcional)
- El cache de índices ICL/IPC tiene TTL 24h — se regenera solo, no hace falta migrar datos
- Si hay datos persistentes en Upstash, exportar con `redis-cli --rdb` o recrearlos

---

## Fase 3: Instalar y Configurar Better Auth

### 3.1 Instalar dependencias
```bash
pnpm add better-auth
pnpm remove @supabase/ssr @supabase/supabase-js
```

### 3.2 Crear configuracin de Better Auth

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

### 3.3 Crear API route para Better Auth

**Nuevo archivo: `src/app/api/auth/[...all]/route.ts`**
- Expone los endpoints de Better Auth (`/api/auth/*`)
- Maneja sign-in, sign-out, session, etc.

```ts
import { auth } from '@/lib/auth-config'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

### 3.4 Crear cliente de Better Auth

**Nuevo archivo: `src/lib/auth-client.ts`** (reemplaza `supabase/client.ts`)
```ts
import { createAuthClient } from 'better-auth/react'
import { adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [adminClient()],
})
```

### 3.5 Generar tablas de Better Auth
```bash
pnpm dlx @better-auth/cli generate --config src/lib/auth-config.ts
# O usar: pnpm dlx @better-auth/cli migrate
```
Esto crear tablas: `user`, `session`, `account`, `verification`.

---

## Fase 4: Migrar Schema de Usuarios

### 4.1 Reconciliar tabla `users` existente con Better Auth

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

### 4.2 Migrar columna `supabaseId`
- La columna `supabase_id` ya no se necesita
- Better Auth usa su propio `id` como PK de usuario
- Crear migracin Drizzle para:
  1. Agregar columnas requeridas por Better Auth (`email_verified`, `image`, `updated_at` si no existe)
  2. Eliminar columna `supabase_id`
  3. Crear tablas `session`, `account`, `verification`

### 4.3 Crear tu usuario en Better Auth
Como solo tens un usuario, lo ms simple:
```bash
# Despus de migrar, crear tu usuario via la API o un script seed:
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"name":"Tu Nombre","email":"tu@email.com","password":"tu-password"}'
```
Luego asignarle `role: 'superadmin'` directamente en la DB.

---

## Fase 5: Reescribir Archivos de Auth

### 5.1 `src/lib/auth.ts` — `requireRole()`
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

### 5.2 `src/proxy.ts` — Middleware
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

### 5.3 `src/app/(auth)/sign-in/page.tsx`
- Reemplazar `supabase.auth.signInWithPassword()` por `authClient.signIn.email()`
- Eliminar import de Supabase client

### 5.4 `src/components/layout/Header.tsx`
- Reemplazar `supabase.auth.signOut()` por `authClient.signOut()`

### 5.5 `src/app/api/users/route.ts` — POST (crear usuario)
- Reemplazar `supabase.auth.admin.createUser()` por `auth.api.createUser()` del plugin admin de Better Auth
- Ya no necesita crear en dos lugares (auth + DB) porque Better Auth usa la misma tabla

### 5.6 `src/app/api/users/[id]/route.ts` — DELETE (borrar usuario)
- Reemplazar `supabase.auth.admin.deleteUser()` por la API admin de Better Auth
- Eliminar import de `createAdminClient`

### 5.7 Eliminar directorio `src/lib/supabase/`
- Borrar `client.ts`, `server.ts`, `admin.ts`
- Todo reemplazado por `auth-config.ts` y `auth-client.ts`

---

## Fase 6: Variables de Entorno

### Eliminar
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
SUPABASE_SERVICE_ROLE_KEY
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### Actualizar
```
DATABASE_URL=postgresql://user:pass@postgres:5432/rentar  # PostgreSQL de Coolify (infrastructure)
```

### Agregar
```
BETTER_AUTH_SECRET=<random-string-de-32-chars>  # Para firmar sesiones
BETTER_AUTH_URL=https://tu-dominio.com          # URL base de la app
REDIS_URL=redis://dragonfly:6379               # Dragonfly en Coolify (infrastructure)
```

---

## Fase 7: Deploy en Coolify

### 7.1 Servicios en Coolify
Los servicios de datos ya existen en el project **"infrastructure"**:
1. **PostgreSQL** — ya configurado
2. **Dragonfly** — ya configurado
3. **Next.js App** — servicio de aplicacin (Dockerfile o Nixpacks) — crear si no existe

### 7.2 Dockerfile (si Nixpacks no funciona bien)
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

### 7.3 Configurar Next.js para standalone output
En `next.config.ts`:
```ts
output: 'standalone'
```

### 7.4 Variables de entorno en Coolify
Configurar todas las env vars en el dashboard de Coolify para el servicio Next.js:
- `DATABASE_URL` (connection string interna de Coolify, ej: `postgresql://...@postgres:5432/rentar`)
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `REDIS_URL` (connection string interna de Dragonfly, ej: `redis://dragonfly:6379`)
- `R2_*` (mantener las mismas)
- `RESEND_API_KEY`
- Etc.

### 7.5 Red interna
- PostgreSQL, Dragonfly y Next.js deben estar en la misma red de Coolify para que la app acceda a los servicios por hostname interno

---

## Fase 8: Configurar Cron Jobs en Coolify

### 8.1 Estado actual de los crons

| Cron | Endpoint | Schedule (UTC) | Invocacin actual |
|---|---|---|---|
| Expirar contratos | `GET /api/cron/expire-contracts` | `0 10 * * *` (07:00 ART) | GitHub Actions |
| Alertas por email | `GET /api/cron/alerts` | `0 12 * * *` (09:00 ART) | GitHub Actions |

### 8.2 Email: Resend (sin cambios)
Los crons de alertas usan **Resend** (`src/lib/resend.ts`) para enviar emails. No usa Supabase ni Cloudflare Email para esto. Resend es un servicio externo que funciona desde cualquier host — **no requiere migracin**.

Variables que se mantienen:
- `RESEND_API_KEY`
- `RESEND_FROM` (opcional, default: `RentAR <noreply@rentar.app>`)

### 8.3 Redis dedup: Dragonfly (ya migrado en Fase 2)
El cron de alertas usa Redis para dedup (evitar emails duplicados):
- `alert:expiry:{contractId}` — TTL 35 das
- `alert:update:{contractId}:{date}` — TTL 10 das

Estos keys se recrean solos cuando el cron corre. No hace falta migrar datos de Upstash — al correr sobre Dragonfly simplemente empieza limpio (peor caso: se reenva 1 alerta ya enviada).

### 8.4 Migrar de GitHub Actions a Coolify Scheduled Tasks
Con la app corriendo en Coolify, conviene centralizar los crons ah en vez de depender de GitHub Actions.

**En Coolify dashboard** → Aplicacin → Settings → Scheduled Tasks:

```
# Expirar contratos — 07:00 ART (10:00 UTC) — DEBE correr ANTES de alertas
0 10 * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/expire-contracts

# Alertas por email — 09:00 ART (12:00 UTC)
0 12 * * *  curl -sf -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/alerts
```

> **Nota:** Al correr dentro de Coolify, el curl va a `localhost:3000` (misma red interna), no necesita la URL pblica.

### 8.5 Eliminar GitHub Actions de crons
Una vez verificado que los Coolify Scheduled Tasks funcionan:
- Eliminar `.github/workflows/cron-alerts.yml`
- Eliminar `.github/workflows/cron-expire-contracts.yml`
- Remover `APP_URL` de GitHub Secrets (ya no se necesita para crons)

### 8.6 Crons futuros a considerar post-migracin

| Cron | Descripcin | Prioridad |
|---|---|---|
| Pagos vencidos | Marcar como `overdue` pagos con `status = 'pending'` y `dueDate < hoy` | Alta |
| Limpieza archivos hurfanos | Eliminar archivos en R2 sin registro en tabla `files` | Baja |
| Backup de ndices | Snapshot ICL/IPC en DB por si APIs externas caen | Media |

---

## Orden de Ejecucin

| # | Tarea | Fase | Dependencia |
|---|---|---|---|
| 1 | PostgreSQL en Coolify (ya existe en infrastructure) | 1 | - |
| 2 | Exportar/importar datos de Supabase | 1 | 1 |
| 3 | Instalar ioredis, remover @upstash/redis | 2 | - |
| 4 | Reescribir `src/lib/redis.ts` (Upstash HTTP → ioredis TCP) | 2 | 3 |
| 5 | Verificar `src/app/api/cron/alerts/route.ts` compatibilidad ioredis | 2 | 4 |
| 6 | Instalar Better Auth, remover Supabase deps | 3 | - |
| 7 | Crear `auth-config.ts` y `auth-client.ts` | 3 | 6 |
| 8 | Crear API route `/api/auth/[...all]` | 3 | 7 |
| 9 | Generar/migrar tablas de Better Auth en DB | 3 | 2, 7 |
| 10 | Migrar schema `users` (quitar `supabaseId`, agregar campos) | 4 | 9 |
| 11 | Reescribir `auth.ts` (`requireRole`) | 5 | 7 |
| 12 | Reescribir `proxy.ts` (middleware) | 5 | 7 |
| 13 | Reescribir `sign-in/page.tsx` | 5 | 7 |
| 14 | Reescribir `Header.tsx` (signOut) | 5 | 7 |
| 15 | Reescribir `api/users/route.ts` (crear usuario) | 5 | 7 |
| 16 | Reescribir `api/users/[id]/route.ts` (borrar usuario) | 5 | 7 |
| 17 | Eliminar `src/lib/supabase/` | 5 | 11-16 |
| 18 | Actualizar variables de entorno | 6 | 10, 4 |
| 19 | Crear usuario superadmin en Better Auth | 4 | 10 |
| 20 | Configurar `output: 'standalone'` en next.config | 7 | - |
| 21 | Crear Dockerfile | 7 | 20 |
| 22 | Deploy en Coolify | 7 | 18, 19, 21 |
| 23 | Configurar Scheduled Tasks en Coolify (crons) | 8 | 22 |
| 24 | Verificar crons: expire-contracts + alerts con Dragonfly | 8 | 23 |
| 25 | Eliminar GitHub Actions de crons (.github/workflows/cron-*.yml) | 8 | 24 |
| 26 | Test end-to-end: login, CRUD, roles, cache, crons, emails | 8 | 24 |

---

## Riesgos y Notas

- **Un solo usuario**: la migracin de datos de auth es trivial. Solo necesits crear tu usuario de nuevo con Better Auth.
- **Datos de negocio**: no cambian. Las tablas de contratos, pagos, inquilinos, etc. se copian tal cual con `pg_dump`.
- **Downtime**: mnimo. Pods hacer todo el desarrollo de auth en local, y al deployar en Coolify solo necesits crear tu usuario nuevo.
- **Rollback**: manten la cuenta de Supabase y Upstash activas hasta confirmar que todo funciona en Coolify.
- **Dragonfly vs Redis**: Dragonfly es compatible con protocolo Redis. Los comandos bsicos (`GET`, `SET`, `DEL`, `EXPIRE`, etc.) funcionan igual. La diferencia principal es que se conecta por TCP (ioredis) en vez de HTTP (Upstash SDK).
- **Cache no necesita migracin**: los datos de cache (ndices ICL/IPC) tienen TTL 24h y se regeneran solos. No hace falta exportar/importar datos de Upstash.
