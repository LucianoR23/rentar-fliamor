# Setup: Sentry + PostHog (Cloud Free Tier)

Guía paso a paso para configurar error tracking (Sentry) y analytics (PostHog) en rentar-admin usando los free tiers cloud.

---

## 1. Sentry (Error Tracking)

### 1.1 Crear cuenta y proyecto (TÚ)

1. Ir a [sentry.io](https://sentry.io) y crear cuenta (o loguearte con GitHub)
2. Crear una **Organization** (ej: `fliamor` o `rentar`)
3. Crear un **Project**:
   - Platform: **Next.js**
   - Nombre: `rentar-admin`
4. Copiar el **DSN** que te da (tiene formato `https://xxx@yyy.ingest.sentry.io/zzz`)
5. Ir a Settings → Auth Tokens → crear un **Auth Token** con scope `org:ci` (se usa en build para subir source maps)

### 1.2 Instalar SDK (CLAUDE)

```bash
pnpm add @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

> El wizard crea automáticamente `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` y modifica `next.config.ts`. Si ya tenés `@sentry/nextjs` en package.json, correr solo el wizard.

### 1.3 Archivos que se crean/modifican (CLAUDE)

**`sentry.client.config.ts`** (raíz del proyecto)
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,        // 10% de transacciones (free tier tiene límite)
  replaysSessionSampleRate: 0,   // desactivar replays (consume cuota)
  replaysOnErrorSampleRate: 0.1, // solo grabar replay si hay error
});
```

**`sentry.server.config.ts`** (raíz del proyecto)
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

**`sentry.edge.config.ts`** (raíz del proyecto)
```ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
});
```

**`next.config.ts`** — se wrappea con `withSentryConfig`:
```ts
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // ... config existente
};

export default withSentryConfig(nextConfig, {
  org: "TU_ORG",           // ← reemplazar
  project: "rentar-admin",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",  // evita ad-blockers
  disableLogger: true,
});
```

**`src/app/global-error.tsx`** — captura errores del root layout:
```tsx
"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <h2>Algo salió mal</h2>
        <button onClick={() => reset()}>Reintentar</button>
      </body>
    </html>
  );
}
```

### 1.4 Variables de entorno (TÚ)

Agregar en Coolify (o `.env.local` para desarrollo):

| Variable | Dónde | Valor |
|----------|-------|-------|
| `NEXT_PUBLIC_SENTRY_DSN` | Build + Runtime | El DSN del paso 1.1 |
| `SENTRY_AUTH_TOKEN` | Solo Build | El Auth Token del paso 1.1 |
| `SENTRY_ORG` | Solo Build | Nombre de tu org en Sentry |
| `SENTRY_PROJECT` | Solo Build | `rentar-admin` |

### 1.5 Verificar (TÚ)

1. Correr `pnpm dev`
2. En cualquier componente agregar temporalmente: `throw new Error("Test Sentry")`
3. Verificar que aparece en el dashboard de Sentry
4. Borrar el throw

### 1.6 Configurar Alertas (TÚ)

Sentry permite crear alertas por frecuencia y enviarlas a servicios de mensajería.

**Crear la alerta inicial:**

1. Ir a **Alerts** → **Create Alert** → **Issues** → **Number of Errors**
2. Configurar:
   - **When**: there are more than **10** occurrences of a unique error
   - **In**: **1 minute**
   - **Priority**: High
   - **Environment**: production
3. Guardar

> Estos valores (cantidad y tiempo) los podés cambiar cuando quieras desde el mismo panel. También podés crear alertas distintas para distintos niveles (ej: 50 errores en 5 min → critical, 5 errores en 10 min → warning).

**Conectar a mensajería:**

Ir a **Settings → Integrations** y elegir uno:

| Servicio | Cómo |
|----------|------|
| **Telegram** | Instalar integración [Sentry Telegram Plugin](https://sentry.io/integrations/telegram/) o usar un webhook → bot de Telegram |
| **Discord** | Settings → Integrations → Discord → autorizar bot → elegir canal → asignar a la alerta |
| **Slack** | Settings → Integrations → Slack → autorizar → elegir canal → asignar a la alerta |
| **Webhook genérico** | Settings → Integrations → WebHooks → poner URL de cualquier servicio (n8n, Make, etc.) |
| **Email** | Viene por defecto, se envía al mail de tu cuenta |

**Asignar mensajería a la alerta:**

1. Editar la alerta creada
2. En **Actions** → **Send a notification to** → elegir la integración configurada
3. Guardar

> Recomendación: empezá con **Discord o Telegram** (gratis, notificación push inmediata). Slack también funciona bien si ya lo usás.

### 1.7 Límites del free tier

- 5.000 errores/mes
- 10.000 transacciones de performance/mes
- 500 replays/mes
- 1 GB de attachments
- Retención: 30 días

---

## 2. PostHog (Analytics + Feature Flags)

### 2.1 Crear cuenta y proyecto (TÚ)

1. Ir a [posthog.com](https://posthog.com) y crear cuenta
2. Se crea un proyecto automáticamente
3. Ir a Settings → Project → copiar el **API Key** (empieza con `phc_`)
4. Copiar el **Host** (normalmente `https://us.i.posthog.com` o `https://eu.i.posthog.com`)
   - Elegir **EU** si querés que los datos estén en Europa

### 2.2 Instalar SDK (CLAUDE)

```bash
pnpm add posthog-js posthog-node
```

- `posthog-js` — para el client-side (navegador)
- `posthog-node` — para server-side (API routes, Server Actions)

### 2.3 Archivos que se crean (CLAUDE)

**`src/lib/posthog.ts`** — client-side provider
```ts
import posthog from 'posthog-js'

export function initPostHog() {
  if (typeof window === 'undefined') return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return

  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false,   // lo manejamos manual con el router
    capture_pageleave: true,
  })
}

export { posthog }
```

**`src/lib/posthog-server.ts`** — server-side client
```ts
import { PostHog } from 'posthog-node'

let posthogServer: PostHog | null = null

export function getPostHogServer() {
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return null

  if (!posthogServer) {
    posthogServer = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    })
  }

  return posthogServer
}
```

**`src/components/layout/PostHogProvider.tsx`** — provider + pageview tracker
```tsx
'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, posthog } from '@/lib/posthog'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initPostHog()
  }, [])

  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (pathname && posthog) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString()
      }
      posthog.capture('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
```

**`src/components/layout/Providers.tsx`** — agregar PostHogProvider al árbol:
```tsx
// Agregar dentro del return, wrapping los children:
<PostHogProvider>
  {children}
</PostHogProvider>
```

**`next.config.ts`** — agregar rewrite para evitar ad-blockers:
```ts
// Dentro de nextConfig:
async rewrites() {
  return [
    {
      source: '/ingest/static/:path*',
      destination: 'https://us-assets.i.posthog.com/static/:path*', // o eu-assets
    },
    {
      source: '/ingest/:path*',
      destination: 'https://us.i.posthog.com/:path*', // o eu
    },
    {
      source: '/ingest/decide',
      destination: 'https://us.i.posthog.com/decide', // o eu
    },
  ]
}
```

> Si usás el rewrite, cambiar `api_host` en `posthog.ts` a `'/ingest'`.

### 2.4 Identificar usuarios (CLAUDE)

Después del login, identificar al usuario para asociar eventos a personas:

```ts
// En el componente o layout que carga post-login:
import { posthog } from '@/lib/posthog'

// Cuando tenés la sesión del usuario:
posthog.identify(user.id, {
  email: user.email,
  name: user.name,
  role: user.role,
})
```

### 2.5 Eventos custom útiles para rentar-admin (CLAUDE)

```ts
// Ejemplos de eventos que tiene sentido trackear:
posthog.capture('contract_created', { unit_id, update_type })
posthog.capture('payment_registered', { amount, status })
posthog.capture('rent_calculated', { update_type, old_amount, new_amount })
posthog.capture('report_exported', { report_type: 'pdf' | 'monthly' })
```

> Estos se agregan gradualmente, no todos de entrada.

### 2.6 Variables de entorno (TÚ)

Agregar en Coolify (o `.env.local`):

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_POSTHOG_KEY` | El API Key `phc_...` del paso 2.1 |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` (o `eu`) |

### 2.7 Verificar (TÚ)

1. Correr `pnpm dev`
2. Navegar por el dashboard
3. Ir a PostHog → Activity → verificar que llegan pageviews
4. Si no llega nada, revisar la consola del navegador por errores

### 2.8 Límites del free tier

- 1.000.000 eventos/mes
- 5.000 session recordings/mes
- 1.000.000 feature flag requests/mes
- Surveys, A/B tests incluidos
- Sin límite de usuarios en el equipo

---

## 3. Resumen de env vars nuevas

```env
# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
SENTRY_AUTH_TOKEN=sntrys_xxx          # solo en build/CI
SENTRY_ORG=tu-org                     # solo en build/CI
SENTRY_PROJECT=rentar-admin           # solo en build/CI

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

---

## 4. Orden de ejecución

| Paso | Quién | Qué |
|------|-------|-----|
| 1 | TÚ | Crear cuenta en sentry.io, copiar DSN y Auth Token |
| 2 | TÚ | Crear cuenta en posthog.com, copiar API Key y Host |
| 3 | CLAUDE | Instalar `@sentry/nextjs`, correr wizard, configurar archivos |
| 4 | CLAUDE | Instalar `posthog-js` + `posthog-node`, crear archivos |
| 5 | CLAUDE | Modificar `next.config.ts`, `Providers.tsx`, crear `global-error.tsx` |
| 6 | TÚ | Agregar env vars en `.env.local` (dev) y en Coolify (prod) |
| 7 | TÚ | Verificar Sentry: provocar error → ver en dashboard |
| 8 | TÚ | Configurar alerta de frecuencia en Sentry (10 errores / 1 min) |
| 9 | TÚ | Conectar integración de mensajería (Discord/Telegram/Slack) y asignarla a la alerta |
| 10 | TÚ | Verificar PostHog: navegar → ver pageviews en dashboard |
| 11 | CLAUDE | Agregar `posthog.identify()` post-login |
| 12 | CLAUDE | Agregar eventos custom gradualmente |

---

## 5. Actualizar CLAUDE.md

Después de configurar, actualizar la sección de env vars en CLAUDE.md para incluir las nuevas variables de Sentry y PostHog.
