# Plan de Implementación: Comisión Inmobiliaria

## Resumen

Agregar comisión inmobiliaria configurable al sistema. La comisión es un porcentaje global que se aplica **solo sobre el alquiler cobrado** (no expensas ni gastos grupales). Es informativa: muestra cuánto corresponde a la inmobiliaria de lo que se cobra. Los recibos al inquilino NO muestran comisión.

## Decisiones de diseño

| Tema | Decisión |
|------|----------|
| Alcance | Solo sobre alquiler (`amountPaid` en payments) |
| Porcentaje | Global, mismo para todos, configurable en Settings |
| Historial | Se guarda `commissionRate` en cada payment al momento de registrar el cobro |
| Excepciones | Checkbox "Aplicar comisión" por pago, marcado por defecto |
| IVA | No aplica |
| Pagos parciales | Comisión sobre lo efectivamente pagado |
| Visibilidad | Todos los roles ven comisión (incluido viewer) |
| Recibos | NO muestran comisión |

---

## Fase 1: Modelo de datos

### 1.1 — Tabla `settings`

Crear tabla en `src/lib/schema.ts`:

```
settings
├── id          uuid PK
├── key         varchar(100) UNIQUE NOT NULL
├── value       text NOT NULL
├── updatedAt   timestamp
```

Registros iniciales:
- `commission_percentage` → `"0"` (desactivada hasta que el usuario configure)

### 1.2 — Nuevas columnas en `payments`

Agregar a la tabla `payments`:

```
├── commissionRate       decimal(5,2)   nullable  — porcentaje vigente al cobrar (ej: 10.00)
├── applyCommission      boolean        NOT NULL DEFAULT true  — si este pago lleva comisión
```

La comisión calculada (`amountPaid * commissionRate / 100`) NO se almacena: se calcula al vuelo. Solo se persiste el rate y si aplica.

### 1.3 — Migración

- `pnpm drizzle-kit generate` para generar la migración
- `pnpm drizzle-kit push` para aplicar

---

## Fase 2: Backend — Helper de comisión

### 2.1 — `src/lib/commission.ts`

```ts
// Funciones:
getCommissionRate()        // Lee commission_percentage de tabla settings
calculateCommission(amountPaid, commissionRate, applyCommission)
  → { commission: number, net: number }
  // Si !applyCommission o rate es 0 → commission=0, net=amountPaid
```

### 2.2 — API para settings de comisión

`src/app/api/settings/commission/route.ts`

- `GET` → devuelve el porcentaje actual
- `PUT` → actualiza el porcentaje (`requireRole('admin')`)

---

## Fase 3: Configuración (UI)

### 3.1 — Nueva página o sección en Settings

`src/app/(dashboard)/settings/page.tsx` — Agregar una sección "Comisión inmobiliaria" arriba de la tabla de usuarios, o crear una tab/sub-página `settings/commission`.

Contenido:
- Input numérico: "Porcentaje de comisión (%)" con valor actual
- Botón guardar
- Texto informativo: "Se aplica sobre el alquiler cobrado. No afecta recibos."

---

## Fase 4: Registro de pago

### 4.1 — `RegisterPaymentDialog`

Modificar `src/components/payments/RegisterPaymentDialog.tsx`:

- Agregar checkbox "Aplicar comisión inmobiliaria" (checked por defecto)
- Al enviar: incluir `applyCommission` y el `commissionRate` vigente (leído del server)
- Preview: mostrar debajo del monto "Comisión: $X.XXX | Neto: $X.XXX" antes de confirmar

### 4.2 — API/Action de registro de pago

Al guardar el pago:
1. Leer `commission_percentage` actual de settings
2. Guardar en payment: `commissionRate = porcentaje`, `applyCommission = checkbox`

---

## Fase 5: Visualización en tablas y dashboard

### 5.1 — PaymentsTable

`src/components/payments/PaymentsTable.tsx`

Agregar columnas después de "Cobrado":
- **Comisión** — `amountPaid * commissionRate / 100` (o $0 si no aplica)
- **Neto** — `amountPaid - comisión`

Formato: `formatCurrency()`, font mono.

### 5.2 — Dashboard KPIs

`src/app/(dashboard)/page.tsx`

Nuevo KPI card:
- **"Comisión del mes"** — suma de comisiones de todos los pagos del mes actual
- Descripción del KPI "Cobrado": agregar "(Neto: $X.XXX)" como subtexto

### 5.3 — IncomeChart

`src/components/dashboard/IncomeChart.tsx`

Opción recomendada: stacked bar con "Neto" + "Comisión" = "Cobrado total". Así se visualiza la proporción sin agregar complejidad.

### 5.4 — Detalle de contrato / unidad

Si hay vistas de historial de pagos en contratos o unidades, agregar las mismas columnas de comisión y neto.

---

## Fase 6: Reportes PDF

### 6.1 — Reporte Mensual (`src/lib/pdf/monthly-report.tsx`)

**Resumen:**
- Total Cobrado (como está)
- Total Comisión (nuevo)
- Total Neto (nuevo)

**Tabla de detalle:**
- Agregar columnas: Comisión, Neto

### 6.2 — Reporte por Unidad (`src/lib/pdf/unit-report.tsx`)

En cada pago del historial:
- Agregar: Comisión, Neto

Resumen de la unidad:
- Total comisión histórica de esa unidad

### 6.3 — Reporte Completo (`src/lib/pdf/complete-report.tsx`)

**Resumen general:**
- Total Comisión del período
- Total Neto del período

**Detalle por unidad:**
- Columnas: Comisión, Neto

### 6.4 — Recibos (`src/lib/pdf/receipt.tsx`)

**SIN CAMBIOS.** El recibo muestra lo que el inquilino paga, punto.

---

## Fase 7: Tipos TypeScript

### 7.1 — Actualizar tipos en `src/types/`

- Tipo inferido de `settings` (si no existe)
- Tipo inferido de `payments` actualizado con los nuevos campos
- Tipo helper: `PaymentWithCommission` si hace falta para los componentes

---

## Orden de implementación recomendado

```
1. Schema + migración (settings + columnas en payments)
2. Helper src/lib/commission.ts
3. API settings/commission (GET/PUT)
4. UI de configuración en Settings
5. Modificar RegisterPaymentDialog (checkbox + guardar rate)
6. Columnas en PaymentsTable
7. KPIs del dashboard
8. IncomeChart
9. Reportes PDF (mensual → unidad → completo)
```

Cada paso es deployable independientemente. El sistema funciona sin comisión configurada (rate = 0, todo se muestra como $0 de comisión).

---

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/lib/schema.ts` | Tabla `settings`, columnas nuevas en `payments` |
| `src/lib/commission.ts` | **NUEVO** — helper de cálculo |
| `src/app/api/settings/commission/route.ts` | **NUEVO** — CRUD de config |
| `src/app/(dashboard)/settings/page.tsx` | Sección comisión |
| `src/components/settings/CommissionForm.tsx` | **NUEVO** — form de config |
| `src/components/payments/RegisterPaymentDialog.tsx` | Checkbox + preview |
| `src/components/payments/PaymentsTable.tsx` | Columnas comisión/neto |
| `src/app/(dashboard)/page.tsx` | KPI comisión |
| `src/components/dashboard/IncomeChart.tsx` | Stacked bar neto+comisión |
| `src/lib/pdf/monthly-report.tsx` | Columnas y resumen |
| `src/lib/pdf/unit-report.tsx` | Columnas y resumen |
| `src/lib/pdf/complete-report.tsx` | Columnas y resumen |
| `src/lib/pdf/receipt.tsx` | Sin cambios |
| `src/types/` | Tipos actualizados |
