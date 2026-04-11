# Plan de Implementación: IVA 21% + Fecha de administración

## Resumen

Dos features en una sola migración:

1. **IVA 21%** con porcentaje gravado configurable por contrato
2. **`managedSince`** — fecha desde la que la inmobiliaria administra el contrato (para contratos que se toman en curso)

**Fórmula IVA:**
```
baseGravada = currentPrice * (vatPercentage / 100)
iva = baseGravada * 0.21
total = currentPrice + iva
```

**Ejemplo:** Alquiler $500.000, porcentaje gravado 20%:
```
Base gravada:   500.000 * 0.20 = $100.000
IVA 21%:        100.000 * 0.21 = $ 21.000
Total a cobrar: 500.000 + 21.000 = $521.000
```

## Decisiones de diseño

| Tema | Decisión |
|------|----------|
| IVA — Aplica a | Cualquier tipo de unidad (toggle por contrato) |
| IVA — Tasa | 21% fijo (constante `VAT_RATE`) |
| IVA — Porcentaje gravado | Configurable por contrato (`vatPercentage`, default 100%) |
| IVA — Precio almacenado | `currentPrice` guarda el alquiler completo (sin IVA). El IVA se suma encima |
| IVA — Actualizaciones ICL/IPC | Se aplican sobre `currentPrice`. Sin cambios en `rent-calculator.ts` |
| IVA — Recibos | SÍ muestran desglose IVA (obligación legal) |
| IVA — Comisión (futuro) | Se calculará sobre `currentPrice` sin IVA |
| Administración — `managedSince` | Fecha desde la que se administra. Si es null, se usa `startDate` |
| Administración — Pagos | Solo se generan desde `managedSince` en adelante |
| Administración — Reportes/Dashboard | Solo cuentan datos desde `managedSince` |

---

## Paso 1: Schema + Migración

**Archivo:** `src/lib/schema.ts`

Agregar en tabla `contracts`:

```
appliesVat      boolean       NOT NULL  DEFAULT false    — si el contrato lleva IVA
vatPercentage   decimal(5,2)  NOT NULL  DEFAULT 100.00   — porcentaje del alquiler sobre el que se calcula IVA
managedSince    date          nullable                   — desde cuándo administra la inmobiliaria (null = desde startDate)
```

- `appliesVat = false` → no hay IVA, `vatPercentage` se ignora
- `appliesVat = true, vatPercentage = 100` → IVA sobre el 100% del alquiler (caso estándar)
- `appliesVat = true, vatPercentage = 20` → IVA solo sobre el 20% del alquiler
- `managedSince = null` → se administra desde `startDate` (caso normal)
- `managedSince = '2025-06-01'` → el contrato empezó antes pero se administra desde junio 2025

**Comandos:**
```bash
pnpm drizzle-kit generate   # genera migración SQL
pnpm drizzle-kit push       # aplica a la DB de Coolify (via SSH tunnel, sslmode=disable)
```

---

## Paso 2: Helper de IVA

**Archivo NUEVO:** `src/lib/vat.ts`

```ts
export const VAT_RATE = 0.21

// Calcula IVA sobre un precio con porcentaje gravado configurable
calculateVat(price: number, appliesVat: boolean, vatPercentage: number = 100)
  → { price, vatableBase, vat, total }
  // price:        alquiler completo ($500.000)
  // vatableBase:  price * vatPercentage / 100 ($100.000)
  // vat:          vatableBase * 0.21 ($21.000)
  // total:        price + vat ($521.000)
  // Si !appliesVat → vat=0, vatableBase=0, total=price
```

---

## Paso 3: Formulario de contrato (crear/editar)

**Archivo:** `src/components/contracts/ContractForm.tsx` (o equivalente)

### IVA:
- Toggle "Aplica IVA 21%" → controla `appliesVat`
- Si activado: aparece input numérico "Porcentaje gravado" (default 100, rango 1-100)
- Preview en vivo debajo del campo precio:
  ```
  Alquiler:            $500.000
  Base gravada (20%):  $100.000
  IVA 21%:             $ 21.000
  Total a cobrar:      $521.000
  ```
- Al guardar: `currentPrice` = precio cargado tal cual, `appliesVat` y `vatPercentage` se guardan

### managedSince:
- Campo date "Administrado desde" (opcional)
- Hint: "Dejar vacío si se administra desde el inicio del contrato"
- Validación: `managedSince` debe ser >= `startDate` y <= hoy
- Si se completa, la UI podría mostrar: "Los pagos se generarán desde [fecha]"

**`firstMonthPrice`** sigue la misma lógica: es el alquiler sin IVA.

**Actualizaciones ICL/IPC:** se aplican sobre `currentPrice`. El IVA se recalcula automáticamente.

---

## Paso 4: Generación mensual de payments

**Archivo:** `src/app/(dashboard)/payments/page.tsx` (o la action/API que auto-genera pagos mensuales)

### IVA:
- Leer `appliesVat` y `vatPercentage` del contrato
- Calcular con `calculateVat(currentPrice, appliesVat, vatPercentage)`
- `amountDue` = `total` (alquiler + IVA)

### managedSince:
- Al generar pagos, determinar la fecha efectiva de inicio:
  ```
  effectiveStart = contract.managedSince ?? contract.startDate
  ```
- Si el mes/año solicitado es anterior a `effectiveStart` → NO generar payment para ese contrato
- Esto evita que aparezcan pagos pendientes de meses que no administramos

> El `amountDue` refleja lo que el inquilino DEBE pagar, IVA incluido.

---

## Paso 5: Registro de pago

**Archivo:** `src/components/payments/RegisterPaymentDialog.tsx`

Cambios:
- Si el contrato `appliesVat`, mostrar desglose antes de confirmar:
  ```
  Alquiler:            $500.000
  Base gravada (20%):  $100.000
  IVA 21%:             $ 21.000
  Total a cobrar:      $521.000
  ```
- El monto que se registra (`amountPaid`) es el total con IVA (lo que paga el inquilino)

---

## Paso 6: PaymentsTable

**Archivo:** `src/components/payments/PaymentsTable.tsx`

Cambios:
- Columna "IVA" que muestra el monto de IVA calculado o "—" si no aplica
- Tooltip o badge indicando el porcentaje gravado si es distinto de 100%

---

## Paso 7: ContractsTable

**Archivo:** `src/components/contracts/ContractsTable.tsx`

Cambios:
- En la columna de precio, si `appliesVat`: mostrar "$500.000 + IVA" con tooltip del desglose
- Badge "IVA" en contratos que aplican
- Si `managedSince` != null: indicador "Desde [fecha]" o badge "Tomado en curso"

---

## Paso 8: Dashboard

**Archivo:** `src/app/(dashboard)/page.tsx`

Cambios para `managedSince`:
- Los KPIs y el IncomeChart ya se basan en payments existentes, así que si no se generan payments antes de `managedSince`, los totales son correctos automáticamente
- No debería necesitar cambios específicos si la generación de payments respeta `managedSince`

---

## Paso 9: Reportes PDF

### 9.1 — Reporte Mensual (`src/lib/pdf/monthly-report.tsx`)
- Resumen: Total Alquiler, Total IVA, Total (alquiler + IVA)
- Detalle: columna IVA por pago
- Contratos no administrados en ese período simplemente no aparecen (no hay payment)

### 9.2 — Reporte por Unidad (`src/lib/pdf/unit-report.tsx`)
- En cada pago: desglose si aplica IVA
- Resumen: total IVA histórico de la unidad
- Historial empieza desde `managedSince` (solo hay payments desde esa fecha)

### 9.3 — Reporte Completo (`src/lib/pdf/complete-report.tsx`)
- Totales generales con desglose IVA

### 9.4 — Recibo (`src/lib/pdf/receipt.tsx`)
- **SÍ muestra IVA** (obligación legal)
- Desglose:
  ```
  Alquiler:            $500.000
  Base gravada (20%):  $100.000
  IVA 21%:             $ 21.000
  Total:               $521.000
  ```
- Si no aplica IVA: se muestra como ahora, sin desglose

---

## Paso 10: Tipos TypeScript

**Archivo:** `src/types/`
- Actualizar tipos inferidos de `contracts` con `appliesVat`, `vatPercentage`, `managedSince`
- Tipo helper: `VatBreakdown = { price, vatableBase, vat, total }`

---

## Orden de implementación

```
1. Schema + migración + push a Coolify (appliesVat, vatPercentage, managedSince)
2. Helper src/lib/vat.ts
3. Tipos TypeScript
4. Formulario de contrato (crear/editar) — toggle IVA + porcentaje + managedSince
5. Generación mensual de payments (amountDue con IVA + respetar managedSince)
6. RegisterPaymentDialog (desglose IVA)
7. PaymentsTable (columna IVA)
8. ContractsTable (indicador IVA + indicador managedSince)
9. Reportes PDF (mensual → unidad → completo → recibo)
```

---

## Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| `src/lib/schema.ts` | Columnas `appliesVat`, `vatPercentage`, `managedSince` en contracts |
| `src/lib/vat.ts` | **NUEVO** — helper de cálculo IVA |
| `src/lib/rent-calculator.ts` | Sin cambios |
| `src/components/contracts/ContractForm.tsx` | Toggle IVA + input porcentaje gravado + campo managedSince + preview |
| `src/app/(dashboard)/payments/page.tsx` | amountDue con IVA + no generar antes de managedSince |
| `src/components/payments/RegisterPaymentDialog.tsx` | Desglose IVA |
| `src/components/payments/PaymentsTable.tsx` | Columna IVA |
| `src/components/contracts/ContractsTable.tsx` | Indicador IVA + indicador managedSince |
| `src/lib/pdf/monthly-report.tsx` | Desglose IVA |
| `src/lib/pdf/unit-report.tsx` | Desglose IVA |
| `src/lib/pdf/complete-report.tsx` | Desglose IVA |
| `src/lib/pdf/receipt.tsx` | Desglose IVA legal |
| `src/types/` | Tipos actualizados |

---

## Lo que necesitás hacer vos

1. **Antes de arrancar:** confirmar que el SSH tunnel está activo y `DATABASE_URL` en `.env` apunta al puerto 5433 local (tunnel a Coolify)
2. **Después del paso 1:** verificar que `pnpm drizzle-kit push` corrió OK
3. **Después del paso 4:** probar crear/editar un contrato con IVA y managedSince, verificar en DB
4. **Después del paso 9:** flujo completo:
   - Editar contrato del local → activar IVA con porcentaje gravado correcto
   - Editar contrato tomado en curso → configurar managedSince
   - Generar pagos del mes → verificar que no aparecen meses pre-administración
   - Registrar cobro → generar recibo (debe mostrar desglose IVA)
   - Generar reportes → verificar totales correctos
5. **Datos existentes:** todos los contratos quedan con `appliesVat=false` y `managedSince=null` por defecto. Editar manualmente después del deploy los que correspondan
