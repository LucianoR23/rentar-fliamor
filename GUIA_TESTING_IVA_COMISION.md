# Guia de Testing: IVA + Comision Inmobiliaria

## Prerequisitos

Antes de probar, asegurate de haber corrido:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Esto aplica las columnas nuevas en `contracts` (`applies_vat`, `vat_percentage`, `managed_since`), en `payments` (`commission_rate`, `apply_commission`) y crea la tabla `settings`.

---

## 1. IVA

### 1.1 Crear contrato con IVA

- [ ] Ir a Contratos > Nuevo contrato
- [ ] Activar toggle "Aplica IVA 21%"
- [ ] Verificar que aparece el campo "Porcentaje gravado" (default 100%)
- [ ] Cambiar porcentaje gravado a 20%
- [ ] Verificar preview en vivo debajo del precio:
  ```
  Alquiler:            $500.000
  Base gravada (20%):  $100.000
  IVA 21%:             $ 21.000
  Total a cobrar:      $521.000
  ```
- [ ] Guardar contrato
- [ ] Verificar en DB: `applies_vat = true`, `vat_percentage = 20.00`

### 1.2 Crear contrato SIN IVA

- [ ] Crear contrato con toggle IVA desactivado
- [ ] Verificar que NO aparece campo porcentaje gravado
- [ ] Guardar y verificar en DB: `applies_vat = false`, `vat_percentage = 100.00` (default)

### 1.3 Editar contrato existente y activar IVA

- [ ] Ir a un contrato existente (sin IVA) > Editar
- [ ] Activar toggle IVA, configurar porcentaje
- [ ] Guardar y verificar que se actualizaron los valores en DB

### 1.4 Tabla de contratos

- [ ] Verificar que contratos con IVA muestran badge "+IVA $X.XXX" en la columna de precio
- [ ] Verificar que contratos sin IVA NO muestran el badge

### 1.5 Generacion de pagos con IVA

- [ ] Ir a Pagos del mes actual
- [ ] Verificar que el `amountDue` de contratos con IVA incluye el IVA calculado
  - Ejemplo: precio $500.000 con IVA 20% -> amountDue debe ser $521.000
- [ ] Verificar que contratos sin IVA tienen `amountDue` = precio del alquiler

### 1.6 Tabla de pagos - columna IVA

- [ ] Verificar que aparece columna "IVA" en la tabla de pagos
- [ ] Contratos con IVA muestran el monto de IVA
- [ ] Contratos sin IVA muestran "—"

### 1.7 Registrar pago con IVA

- [ ] Click "Registrar" en un pago con IVA
- [ ] Verificar desglose en el dialog:
  ```
  Alquiler:              $500.000
  Base gravada (20%):    $100.000
  IVA 21%:               $ 21.000
  Total:                 $521.000
  ```
- [ ] Confirmar pago con el monto total
- [ ] Verificar que el estado cambia a "Pagado"

### 1.8 Recibo con IVA

- [ ] Generar recibo de un pago con IVA (boton "Recibo")
- [ ] Verificar que el PDF muestra desglose IVA (alquiler, base gravada, IVA 21%, total)
- [ ] Generar recibo de un pago SIN IVA
- [ ] Verificar que el PDF NO muestra desglose IVA

---

## 2. managedSince (Fecha de administracion)

### 2.1 Crear contrato con managedSince

- [ ] Crear contrato nuevo con fecha de inicio enero 2025
- [ ] Completar "Administrado desde" con marzo 2025
- [ ] Guardar y verificar en DB: `managed_since = '2025-03-01'`

### 2.2 Verificar que no genera pagos anteriores

- [ ] Ir a Pagos > seleccionar enero 2025
- [ ] Verificar que NO aparece pago para ese contrato (es anterior a managedSince)
- [ ] Ir a Pagos > seleccionar marzo 2025
- [ ] Verificar que SI aparece pago para ese contrato
- [ ] Ir a Pagos > seleccionar febrero 2025
- [ ] Verificar que NO aparece (febrero < marzo)

### 2.3 Contrato sin managedSince

- [ ] Crear contrato sin completar "Administrado desde"
- [ ] Verificar que genera pagos desde la fecha de inicio del contrato normalmente

### 2.4 Tabla de contratos

- [ ] Verificar que contratos con `managedSince` muestran badge "Desde DD/MM/YYYY"
- [ ] Verificar que contratos sin `managedSince` NO muestran el badge

### 2.5 Dashboard

- [ ] Verificar que los KPIs del dashboard no incluyen montos de meses pre-administracion
  (esto es automatico: si no hay payments, no se cuentan)

---

## 3. Comision Inmobiliaria

### 3.1 Configurar comision

- [ ] Ir a Settings (menu lateral)
- [ ] Verificar que aparece seccion "Comision inmobiliaria"
- [ ] Ingresar porcentaje (ej: 10%)
- [ ] Guardar
- [ ] Recargar pagina y verificar que el valor persiste
- [ ] Verificar en DB: tabla `settings`, key `commission_percentage`, value `10`

### 3.2 Permisos

- [ ] Con rol `admin`: verificar que puede editar la comision
- [ ] Con rol `viewer`: verificar que el input esta deshabilitado (solo lectura)

### 3.3 Tabla de pagos - columnas comision

- [ ] Con comision configurada (>0): verificar que aparecen columnas "Comision" y "Neto"
- [ ] Sin comision (0): verificar que NO aparecen esas columnas
- [ ] Los valores de comision se calculan sobre el precio del alquiler (sin IVA)

### 3.4 Registrar pago con comision

- [ ] Click "Registrar" en un pago
- [ ] Verificar que aparece seccion de comision con toggle "Aplicar comision (X%)"
- [ ] Verificar preview: Comision $X.XXX / Neto $X.XXX
- [ ] Confirmar pago con comision activada
- [ ] Verificar en DB: `commission_rate` guardado, `apply_commission = true`

### 3.5 Registrar pago SIN comision

- [ ] Click "Registrar" en un pago
- [ ] Desactivar toggle de comision
- [ ] Confirmar pago
- [ ] Verificar en DB: `apply_commission = false`
- [ ] Verificar en tabla: comision muestra "—", neto = monto cobrado

### 3.6 Dashboard - KPI comision

- [ ] Con comision configurada: verificar que aparece card "Comision del mes" con icono %
- [ ] Verificar que el card "Cobrado" muestra "Neto: $X.XXX" en la descripcion
- [ ] Sin comision (0%): verificar que el card de comision NO aparece
- [ ] Verificar que el grid pasa de 4 a 5 columnas cuando hay comision

### 3.7 Comision sobre alquiler sin IVA

- [ ] Contrato con IVA: verificar que la comision se calcula sobre `currentPrice` (sin IVA), no sobre el total con IVA
  - Ejemplo: alquiler $500.000, IVA $21.000, comision 10%
  - Comision debe ser $50.000 (10% de $500.000), NO $52.100

---

## 4. Reportes PDF

### 4.1 Reporte Mensual

- [ ] Generar reporte mensual con pagos que tienen IVA
- [ ] Verificar columna IVA en tabla de detalle
- [ ] Verificar box "IVA" en resumen (si hay IVA > 0)
- [ ] Con comision configurada: verificar columnas "Comision" y "Neto" en tabla
- [ ] Verificar boxes "Comision" y "Neto" en resumen
- [ ] Sin comision: verificar que NO aparecen columnas ni boxes de comision

### 4.2 Reporte Completo

- [ ] Generar reporte completo
- [ ] Verificar seccion de pagos con columnas IVA, Comision (condicional), Neto (condicional)
- [ ] Verificar resumen con totales IVA, Comision, Neto
- [ ] Sin comision: verificar que no aparecen columnas/boxes de comision

### 4.3 Reporte por Unidad

- [ ] Generar reporte de una unidad con contrato que tiene IVA
- [ ] Verificar linea "IVA 21%: Sobre X% -> $base -> $iva -> Total $total" en info del contrato
- [ ] Con comision: verificar columnas Comision y Neto en tabla de pagos
- [ ] Sin comision: solo columnas estandar

### 4.4 Recibo

- [ ] Generar recibo de un pago con IVA
- [ ] Verificar que muestra desglose IVA
- [ ] Verificar que NO muestra comision (nunca, independientemente de la configuracion)
- [ ] Generar recibo de un pago sin IVA
- [ ] Verificar formato normal sin desglose

---

## 5. Casos borde

### 5.1 IVA 100%

- [ ] Contrato con IVA al 100% (caso estandar)
- [ ] Verificar: base gravada = precio completo, IVA = precio * 0.21

### 5.2 Cambio de porcentaje de comision

- [ ] Configurar comision al 10%, registrar un pago
- [ ] Cambiar comision al 15%, registrar otro pago
- [ ] Verificar que el primer pago muestra 10% y el segundo 15% (rate guardado por pago)

### 5.3 Comision en 0%

- [ ] Configurar comision en 0%
- [ ] Verificar que desaparecen todas las columnas/cards de comision
- [ ] Los pagos existentes con commission_rate guardado siguen mostrando sus valores historicos? (verificar)

### 5.4 Contrato con IVA + comision

- [ ] Contrato con IVA 20% + comision 10%
- [ ] Alquiler $500.000
- [ ] Verificar:
  - IVA: base gravada $100.000, IVA $21.000, total $521.000
  - Comision: 10% de $500.000 = $50.000 (sobre alquiler, no sobre total con IVA)
  - Neto: $500.000 - $50.000 = $450.000

### 5.5 managedSince igual a startDate

- [ ] Configurar managedSince = startDate
- [ ] Verificar que se comporta igual que sin managedSince (genera todos los pagos)

### 5.6 Pago parcial con comision

- [ ] Registrar un pago parcial (monto menor al total)
- [ ] Verificar estado "Parcial"
- [ ] Verificar que la comision se muestra correctamente

---

## 6. Migracion de datos existentes

- [ ] Verificar que todos los contratos existentes tienen `applies_vat = false` (default)
- [ ] Verificar que todos los contratos existentes tienen `managed_since = null` (default)
- [ ] Verificar que todos los pagos existentes tienen `commission_rate = null` y `apply_commission = true` (defaults)
- [ ] Editar manualmente los contratos que correspondan: activar IVA, configurar porcentaje, configurar managedSince
