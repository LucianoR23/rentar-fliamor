# Plan de Remediación de Seguridad — RentAR Admin

**Fecha:** 2026-04-01  
**Severidad:** 3 CRITICAL, 4 HIGH, 4 MEDIUM, 3 LOW

---

## FASE 1: CRITICAL (Ejecutar HOY)

### 1.1 Rotar todos los secrets

**Acciones:**
1. En Vercel → Settings → Environment Variables → delete `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, `UPSTASH_REDIS_REST_TOKEN`, `RESEND_API_KEY`, `CRON_SECRET`
2. En Supabase → regenerar API keys
3. En Upstash → regenerar tokens Redis
4. En Resend → regenerar API key
5. En Cloudflare R2 → regenerar access keys
6. Volver a agregar todas las variables a Vercel con nuevos valores

**Tiempo:** 20 mins  
**Verificación:** Deploya y testa signin

---

### 1.2 Crear `.env.example`

**Acción:** Crear archivo con contenido seguro:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=token_xxxxx

# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=rentar-files
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev

# Resend Email
RESEND_API_KEY=re_xxxxx
RESEND_FROM=RentAR <noreply@tudominio.com>

# Cron Jobs
CRON_SECRET=generate_random_hex_secret_32_chars_minimum
```

**Tiempo:** 5 mins  
**Archivo:** `.env.example` (agregar a git)

---

### 1.3 Verificar `.gitignore`

**Acción:** Asegurar que `.env` y `.env.local` estén ignorados:

```bash
cat .gitignore | grep -E "\.env"
```

Si no están, agregar:
```
.env
.env.local
.env.*.local
```

**Tiempo:** 2 mins

---

### 1.4 Fijar auto-user creation en `auth.ts`

**Archivo:** `src/lib/auth.ts`

**Cambio:**
```typescript
// ANTES:
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

// DESPUÉS:
if (!dbUser) {
  throw new Error('Unauthorized - User account not provisioned by superadmin')
}
```

**Impacto:** Solo usuarios creados explícitamente por superadmin pueden acceder  
**Tiempo:** 5 mins

---

### 1.5 Configurar R2 o deshabilitar uploads

**Opción A — Configurar R2:**
1. En Vercel → agregar `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
2. Redeploy

**Opción B — Deshabilitar uploads:**
En `/src/app/api/files/upload/route.ts`, línea 1, agregar:
```typescript
export async function POST() {
  return NextResponse.json({ error: 'File uploads disabled' }, { status: 503 })
}
```

**Tiempo:** 10 mins (opción A) o 2 mins (opción B)

---

## FASE 2: HIGH (Esta semana)

### 2.1 Agregar security headers

**Crear archivo:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'"
  )

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**Tiempo:** 10 mins  
**Verificación:** `curl -I http://localhost:3000` → verify headers

---

### 2.2 Validar query parameters en reports

**Archivo 1:** `src/app/api/reports/monthly/route.ts`

Cambiar líneas 14-15:
```typescript
// ANTES:
const month = sp.get('month') ? Number(sp.get('month')!) : now.getMonth() + 1
const year = sp.get('year') ? Number(sp.get('year')!) : now.getFullYear()

// DESPUÉS:
const monthSchema = z.coerce.number().int().min(1).max(12)
const yearSchema = z.coerce.number().int().min(2000).max(2099)

const month = monthSchema.parse(sp.get('month') ?? now.getMonth() + 1)
const year = yearSchema.parse(sp.get('year') ?? now.getFullYear())
```

**Archivo 2:** `src/app/api/reports/complete/route.ts` — aplicar cambio idéntico

**Archivo 3:** `src/app/api/reports/unit/route.ts`

Cambiar línea 12:
```typescript
// ANTES:
const unitId = req.nextUrl.searchParams.get('unitId')

// DESPUÉS:
const unitIdSchema = z.string().uuid()
const unitId = unitIdSchema.parse(req.nextUrl.searchParams.get('unitId'))
```

**Tiempo:** 10 mins  
**Verificación:** Testa con `?month=13` → debe rechazar

---

### 2.3 Implementar Rate Limiting

**Instalar:**
```bash
pnpm add next-rate-limit
```

**Crear archivo:** `src/middleware/rate-limit.ts`

```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { redis } from '@/lib/redis'

// By IP
export const rateLimitByIP = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  ephemeralCache: new Map(),
  prefix: 'ratelimit:ip',
})

// By User ID
export const rateLimitByUser = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 h'),
  ephemeralCache: new Map(),
  prefix: 'ratelimit:user',
})

export async function checkRateLimit(
  key: string,
  limiter: Ratelimit
): Promise<{ success: boolean; remaining: number; resetTime: number }> {
  const result = await limiter.limit(key)
  return {
    success: result.success,
    remaining: result.remaining,
    resetTime: result.resetTime,
  }
}
```

**Actualizar:** `src/middleware.ts`

```typescript
import { checkRateLimit, rateLimitByIP } from '@/middleware/rate-limit'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const ip = request.ip ?? 'unknown'

  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const { success } = await checkRateLimit(ip, rateLimitByIP)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }
  }

  // ... resto del middleware ...
}
```

**Tiempo:** 30 mins  
**Verificación:** Haz 101 requests al mismo endpoint en 1 hora → rechaza con 429

---

### 2.4 Agregar auth a endpoints de índices

**Archivo:** `src/app/api/indices/icl/route.ts`

Agregar línea 1:
```typescript
import { requireRole } from '@/lib/auth'

export async function GET() {
  await requireRole('viewer')  // ← Agregar
  // ... resto del código ...
}
```

Repetir en `src/app/api/indices/ipc/route.ts`

**Tiempo:** 5 mins  
**Impacto:** Índices solo accesibles para usuarios logged-in

---

### 2.5 Quitar parameter injection en receipts

**Archivo:** `src/app/api/payments/[id]/receipt/route.ts`

**Cambiar líneas 40, 57-58:**

```typescript
// ANTES:
const data: ReceiptData = {
  receiptNumber: sp.get('receiptNumber') ?? receiptNumber,
  ...
  paymentMethod: sp.get('paymentMethod') ?? 'Efectivo',
  notes: sp.get('notes') ?? payment.notes ?? null,
}

// DESPUÉS:
const data: ReceiptData = {
  receiptNumber,  // Solo usar DB value
  ...
  paymentMethod: 'Efectivo',  // Default solo
  notes: payment.notes ?? null,  // Solo DB
}
```

**Tiempo:** 5 mins  
**Impacto:** Previene PDF tampering

---

## FASE 3: MEDIUM (Próximas 2 semanas)

### 3.1 Mejorar validaciones en schemas

**Archivo:** `src/lib/validations/tenant.ts`

```typescript
// Agregar:
.max(255) a garantorName, guarantorPhone, guarantorDni, notes

// Cambiar DNI validation:
dni: z.string().regex(/^\d{7,11}$/, 'DNI debe ser 7-11 dígitos'),

// Cambiar email:
email: z.string().email().optional(),  // Remove .or(z.literal(''))
```

**Archivo:** `src/lib/validations/group.ts`

```typescript
// Agregar max length:
address: z.string().max(500),
description: z.string().max(2000),
```

**Tiempo:** 15 mins

---

### 3.2 Structured logging

**Crear archivo:** `src/lib/logger.ts`

```typescript
export function logError(context: string, error: Error, metadata?: Record<string, unknown>) {
  const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  
  // Log con ID solo (no full error)
  console.error(JSON.stringify({
    timestamp: new Date().toISOString(),
    errorId,
    context,
    message: error.message,
    ...metadata,
  }))

  return errorId
}
```

**Usar en todos los try-catch:**

```typescript
// ANTES:
} catch (e) {
  console.error('[cron/alerts] expiry send failed:', error.message)
}

// DESPUÉS:
} catch (e) {
  const errorId = logError('cron/alerts', e as Error, { contractId: contract.id })
  console.error(`Failed: ${errorId}`)
}
```

**Tiempo:** 30 mins  
**Beneficio:** Production logs seguros de información sensitive

---

### 3.3 Validar Supabase user metadata

**Archivo:** `src/lib/auth.ts`

```typescript
import { z } from 'zod'

const userMetadataSchema = z.object({
  full_name: z.string().max(255).optional(),
  // ... otros campos esperados
})

export async function requireRole(role: 'superadmin' | 'viewer') {
  // ... código existente ...

  // Validar metadata
  const validated = userMetadataSchema.safeParse(user.user_metadata)
  if (!validated.success) {
    console.warn('Invalid Supabase metadata for user', user.id)
  }

  const fullName = validated.data?.full_name ?? user.email!
  // ...
}
```

**Tiempo:** 10 mins

---

## FASE 4: LOW (Documentación & optimización)

### 4.1 Email compliance

**Archivo:** `src/lib/resend.ts`

Agregar helper:
```typescript
export const EMAIL_CONFIG = {
  from: FROM_EMAIL,
  replyTo: 'support@rentar.app',
  // Para GDPR: agregar unsubscribe link en template
}
```

**Tiempo:** 10 mins

---

### 4.2 Security headers en metadata

**Archivo:** `src/app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: "RentAR Admin",
  description: "Sistema de gestión de alquileres para el mercado argentino",
  referrer: 'strict-origin-when-cross-origin',
  // ...
};
```

**Tiempo:** 5 mins

---

## CHECKLIST DE IMPLEMENTACIÓN

### Día 1 (CRITICAL):
- [ ] Rotar all secrets
- [ ] Create `.env.example`
- [ ] Verify `.gitignore`
- [ ] Fix auto-user creation
- [ ] Configure R2 or disable uploads

### Semana 1 (HIGH):
- [ ] Add security headers middleware
- [ ] Validate query params in reports
- [ ] Implement rate limiting
- [ ] Add auth to indices endpoints
- [ ] Remove parameter injection in receipts

### Semana 2 (MEDIUM):
- [ ] Enhance input validation schemas
- [ ] Implement structured logging
- [ ] Validate user metadata

### Semana 3 (LOW):
- [ ] Email compliance setup
- [ ] Security headers in metadata
- [ ] Penetration testing

---

## TESTING DESPUÉS DE CADA FASE

**Fase 1:**
```bash
curl -X GET http://localhost:3000/api/contracts
# Debe rechazar sin auth token
```

**Fase 2:**
```bash
curl -I http://localhost:3000/
# Verificar headers de seguridad presentes
```

**Fase 3:**
```bash
curl -X GET "http://localhost:3000/api/reports/monthly?month=13&year=2000"
# Debe rechazar mes 13
```

---

## NOTAS

- Después de cada fase, pushear cambios a `develop` y crear PR
- NO pushear `.env` bajo ninguna circunstancia
- Después de todo, hacer pentest profesional ($500-1000 recomendado)
- Documentar todos los secretos en Vercel (no en .env local)

---

**Total estimado:** ~3 horas implementación + testing

