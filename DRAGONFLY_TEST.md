# Test Dragonfly en Producción

## Contexto
- Dragonfly reemplaza Upstash Redis (HTTP → TCP via ioredis)
- Connection string usa `rediss://` (SSL) en puerto 6380
- Solo se usa en `src/app/api/cron/alerts/route.ts` para dedup de emails

## Tests a realizar post-deploy

### 1. Conexión básica
Desde la app deployada en Coolify, verificar que ioredis conecta sin error.
- Si falla con error de certificado SSL (`UNABLE_TO_VERIFY_LEAF_SIGNATURE`), hay que agregar `rejectUnauthorized: false` en `src/lib/redis.ts`:
```ts
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL!, {
  tls: { rejectUnauthorized: false },
})
```

### 2. Operaciones básicas (via logs o endpoint temporal)
Verificar que los comandos usados funcionan:
- `redis.get(key)` — debe retornar `null` si no existe, o el valor string
- `redis.set(key, value, 'EX', seconds)` — debe retornar `'OK'`

### 3. Cron de alertas (`/api/cron/alerts`)
```bash
curl -sf -H "Authorization: Bearer $CRON_SECRET" https://TU_DOMINIO/api/cron/alerts
```
Respuesta esperada: `{"ok":true,"sent":N,"skipped":N,"ts":"..."}`

Verificar en Dragonfly (via Beekeeper o redis-cli) que se crearon keys:
- `alert:expiry:{contractId}` con TTL ~35 días
- `alert:update:{contractId}:{date}` con TTL ~10 días

### 4. Dedup funciona
Correr el cron dos veces seguidas:
- Primera vez: `sent > 0` (si hay contratos por vencer/actualizar)
- Segunda vez: `sent: 0, skipped > 0` (dedup evita reenvío)

## Notas
- El cache de alertas empieza limpio — peor caso se reenvía 1 email ya enviado
- No hay datos que migrar de Upstash, todo se regenera solo
- Si Dragonfly no está en la misma red que la app en Coolify, la conexión va a fallar
