# RentAR Admin — Guía de Usuario

Sistema de gestión de alquileres para el mercado argentino.

---

## Tabla de contenidos

1. [Acceso al sistema](#1-acceso-al-sistema)
2. [Panel principal (Dashboard)](#2-panel-principal-dashboard)
3. [Unidades](#3-unidades)
4. [Inquilinos](#4-inquilinos)
5. [Grupos](#5-grupos)
6. [Contratos](#6-contratos)
7. [Pagos](#7-pagos)
8. [Gastos](#8-gastos)
9. [Reportes PDF](#9-reportes-pdf)
10. [Configuración y usuarios](#10-configuración-y-usuarios)
11. [Alertas por email](#11-alertas-por-email)
12. [Archivos adjuntos](#12-archivos-adjuntos)
13. [Roles y permisos](#13-roles-y-permisos)
14. [Preguntas frecuentes](#14-preguntas-frecuentes)

---

## 1. Acceso al sistema

### Iniciar sesión

1. Ingresá a la URL del sistema.
2. Completá tu **email** y **contraseña**.
3. Hacé clic en **Iniciar sesión**.

Solo pueden ingresar los usuarios creados previamente por un superadmin. No es posible registrarse por cuenta propia.

> **Nota técnica:** La autenticación la maneja Supabase. Las sesiones se mantienen activas automáticamente mientras el navegador esté abierto.

---

## 2. Panel principal (Dashboard)

La pantalla principal muestra un resumen del estado actual del sistema.

### Indicadores principales (KPIs)

| Indicador | Qué muestra |
|-----------|-------------|
| **Ocupación** | Porcentaje de unidades con contrato activo sobre el total |
| **Proyectado del mes** | Suma de todos los montos a cobrar del mes actual |
| **Cobrado** | Suma de los montos efectivamente cobrados del mes actual |
| **Próximas actualizaciones** | Cantidad de contratos con actualización de precio en los próximos 30 días |

### Gráficos

- **Ocupación por tipo de unidad** — Gráfico de torta que muestra cuántas unidades de cada tipo (departamento, local, terreno, casa, otro) están ocupadas vs. vacantes.
- **Ingresos últimos 6 meses** — Gráfico de barras comparando el monto proyectado vs. el monto cobrado de cada mes.

---

## 3. Unidades

Una **unidad** es cada propiedad individual que se alquila: un departamento, un local, un terreno, una casa, etc.

### Ver listado de unidades

Desde la barra lateral, hacé clic en **Unidades**. Se muestra una tabla con:

- Identificador (ej: "1A", "PB", "Local 3")
- Tipo (Departamento, Local, Terreno, Casa, Otro)
- Grupo al que pertenece (si tiene)
- Estado: **Ocupada** (tiene contrato activo) o **Vacante**

Podés buscar por nombre o filtrar desde la barra superior de la tabla.

### Crear una unidad

1. Desde el listado, clic en **Nueva unidad**.
2. Completá los campos:
   - **Tipo** (obligatorio) — Seleccioná el tipo de propiedad.
   - **Identificador** (obligatorio) — Un nombre corto para identificarla (ej: "Depto 2B", "Local 5").
   - **Grupo** (opcional) — Si la unidad pertenece a un edificio o grupo de propiedades, seleccionalo acá.
   - **Piso/Planta** (opcional) — Número de piso o descripción.
   - **Descripción** (opcional) — Notas adicionales.
3. Clic en **Crear unidad**.

### Ver detalle de una unidad

Hacé clic en cualquier unidad del listado para ver:

- Información básica (tipo, identificador, piso, grupo)
- Contrato activo actual (si existe), con datos del inquilino y precio actual
- **Calculadora de actualización** — Si hay contrato activo, permite calcular y aplicar la próxima actualización de precio (ver [sección Contratos](#actualización-de-precio))
- **Archivos adjuntos** — Documentos, fotos o PDFs asociados a la unidad

### Editar o eliminar

- Desde el detalle, clic en **Editar** para modificar los datos.
- Desde el listado, usá el botón de eliminar (icono de papelera) para borrar una unidad.

> **Importante:** Si una unidad tiene un contrato activo, no se puede eliminar hasta que el contrato finalice o se rescinda.

---

## 4. Inquilinos

Un **inquilino** es la persona que alquila una unidad.

### Ver listado

Desde la barra lateral → **Inquilinos**. La tabla muestra nombre, DNI, teléfono, email y si tiene contratos activos.

### Crear un inquilino

1. Clic en **Nuevo inquilino**.
2. Completá:
   - **Nombre** y **Apellido** (obligatorios)
   - **DNI** (obligatorio, entre 7 y 20 caracteres)
   - **Teléfono** (obligatorio, mínimo 6 caracteres)
   - **Email** (opcional)
   - **Dirección** (opcional)
   - **Datos del garante** (todos opcionales): nombre, teléfono y DNI
   - **Notas** (opcional)
3. Clic en **Guardar inquilino**.

### Ver detalle

Hacé clic en un inquilino para ver todos sus datos personales, incluyendo la información del garante si fue cargada.

---

## 5. Grupos

Un **grupo** agrupa varias unidades que comparten una misma propiedad o edificio. Sirve para distribuir gastos comunes entre las unidades.

### Crear un grupo

1. Desde **Grupos** → **Nuevo grupo**.
2. Completá:
   - **Nombre** (obligatorio) — Ej: "Edificio Rivadavia 450"
   - **Dirección** (obligatorio)
   - **Descripción** (opcional)
3. Clic en **Crear grupo**.

### Detalle del grupo

La página de detalle tiene tres pestañas:

#### Pestaña: Unidades

Muestra todas las unidades que pertenecen al grupo con su estado (ocupada/vacante). Desde acá podés agregar nuevas unidades al grupo.

#### Pestaña: Gastos

Lista de todos los gastos comunes cargados para este grupo (ej: expensas, mantenimiento, servicios comunes).

**Crear un gasto de grupo:**

1. Clic en **Agregar gasto**.
2. Completá:
   - **Nombre** (obligatorio) — Ej: "Expensas Marzo 2026"
   - **Monto** (obligatorio)
   - **Mes** y **Año** del período
   - **Notas** (opcional)
3. Al crear el gasto, el sistema distribuye automáticamente el monto entre las unidades del grupo según la configuración de costos.

#### Pestaña: Configuración

Acá se define cómo se reparten los gastos comunes entre los distintos tipos de unidad:

| Tipo de unidad | Porcentaje |
|----------------|-----------|
| Departamento   | Ej: 60%   |
| Local          | Ej: 30%   |
| Terreno        | Ej: 10%   |
| Casa           | Ej: 0%    |
| Otro           | Ej: 0%    |

**La suma de todos los porcentajes no puede superar 100%.** Cada unidad de un tipo dado recibe proporcionalmente su parte del porcentaje asignado a ese tipo.

**Ejemplo:** Si hay 2 departamentos y el tipo "Departamento" tiene 60%, cada departamento recibe 30% del gasto total.

---

## 6. Contratos

Un **contrato** vincula una unidad con un inquilino durante un período determinado, con un precio y reglas de actualización.

### Crear un contrato

1. Desde **Contratos** → **Nuevo contrato**.
2. Completá las secciones:

**Partes:**
- **Unidad** (obligatorio) — Solo se muestran unidades sin contrato activo.
- **Inquilino** (obligatorio) — Seleccioná de la lista.

**Vigencia:**
- **Fecha de inicio** (obligatorio)
- **Fecha de fin** (obligatorio) — Debe ser posterior al inicio.

**Precio y depósito:**
- **Precio primer mes** (obligatorio) — El monto del alquiler del primer mes en ARS.
- **Depósito** (opcional) — Monto de garantía.

**Actualización:**
- **Tipo de actualización** (obligatorio):
  - **ICL** — Índice para Contratos de Locación (publicado por el BCRA). Recomendado para contratos de vivienda.
  - **IPC** — Índice de Precios al Consumidor (publicado por el INDEC). Sigue la inflación general.
  - **Monto fijo** — Se suma un monto fijo en pesos cada vez que se actualiza.
  - **Porcentaje fijo** — Se aplica un porcentaje fijo de aumento.
- **Frecuencia** (obligatorio) — Cada cuántos meses se actualiza (ej: 3, 6, 12).
- **Valor** (solo para monto fijo o porcentaje fijo) — El monto en pesos o porcentaje a aplicar.

3. Clic en **Crear contrato**.

### Estados de un contrato

| Estado | Significado |
|--------|-------------|
| **Activo** | Vigente, con pagos y actualizaciones |
| **Expirado** | Pasó la fecha de fin |
| **Rescindido** | Finalizado anticipadamente |

### Actualización de precio

Cuando se acerca la fecha de actualización de un contrato, podés calcular y aplicar el nuevo precio:

1. Entrá al detalle del contrato (o de la unidad).
2. En la sección **Próxima actualización**, hacé clic en **Calcular**.
3. El sistema muestra una vista previa con:
   - Precio actual
   - Precio nuevo calculado
   - Diferencia y porcentaje de variación
   - Para ICL/IPC: valores del índice utilizados
4. Si estás de acuerdo, hacé clic en **Aplicar actualización**.

El sistema actualiza el precio del contrato y programa la próxima fecha de actualización automáticamente.

**¿Cómo se calcula cada tipo?**

- **ICL:** Busca el valor del índice ICL en la fecha actual y en la fecha base (fecha actual menos la frecuencia en meses). Calcula la variación porcentual entre ambos y la aplica al precio actual.
- **IPC:** Acumula las variaciones mensuales del IPC durante el período de frecuencia. Es un cálculo compuesto (cada mes sobre el anterior).
- **Monto fijo:** Suma directamente el valor configurado al precio actual.
- **Porcentaje fijo:** Aplica el porcentaje configurado sobre el precio actual.

> **Nota técnica:** Los índices ICL e IPC se obtienen de las APIs del BCRA y de datos.gob.ar respectivamente, y se cachean durante 24 horas para evitar consultas innecesarias.

---

## 7. Pagos

La sección de pagos permite llevar el registro de cobranzas mes a mes.

### Cómo funciona

1. Desde **Pagos**, seleccioná el **mes** y **año** que querés ver.
2. El sistema genera automáticamente una fila de pago por cada contrato activo del período, con el monto a cobrar según el precio vigente del contrato.
3. La tabla muestra:

| Columna | Descripción |
|---------|-------------|
| Unidad | Identificador de la unidad |
| Inquilino | Nombre del inquilino |
| Vencimiento | Día 5 de cada mes |
| A cobrar | Monto según el contrato |
| Cobrado | Monto efectivamente recibido |
| Estado | Pendiente / Pagado / Parcial |

### Registrar un pago

1. En la fila del pago pendiente, hacé clic en el botón de **registrar pago**.
2. En el diálogo que se abre, completá:
   - **Monto cobrado** — El monto que efectivamente recibiste. Puede ser igual, mayor o menor al monto a cobrar.
   - **Fecha de pago** — Cuándo se recibió.
   - **Notas** (opcional).
3. Clic en **Confirmar pago**.

El estado se actualiza automáticamente:
- Si cobraste **todo o más** → Estado: **Pagado**
- Si cobraste **menos** → Estado: **Parcial**

### Recibos

Una vez registrado el pago, podés generar un **recibo en PDF** para entregar al inquilino:

1. En la fila del pago, hacé clic en el botón de **recibo**.
2. Se abre un editor con vista previa del recibo, donde podés personalizar:
   - **Número de recibo** — Se genera automáticamente, pero podés cambiarlo.
   - **Medio de pago** — Efectivo, Transferencia bancaria, Cheque, Mercado Pago, u Otro.
   - **Notas** — Texto adicional para incluir en el recibo.
3. Hacé clic en **Actualizar vista previa** para ver los cambios.
4. Hacé clic en **Descargar PDF** para obtener el archivo.

El recibo incluye: datos del locador, datos del inquilino, unidad, período, monto, medio de pago y observaciones.

---

## 8. Gastos

Los **gastos** son egresos generales del negocio que no están vinculados a un grupo específico (ej: factura del contador, reparación puntual, impuestos).

> Para gastos de un grupo de unidades (expensas, mantenimiento de edificio), usá los **gastos de grupo** desde la [sección Grupos](#pestaña-gastos).

### Crear un gasto

1. Desde **Gastos** → **Nuevo gasto**.
2. Completá:
   - **Título** (obligatorio) — Descripción breve del gasto.
   - **Monto** (obligatorio) — En ARS.
   - **Categoría** (opcional) — Ej: "Servicios", "Mantenimiento", "Impuestos".
   - **Fecha** (obligatorio) — Fecha en que se produjo el gasto.
   - **Notas** (opcional).
3. Clic en **Guardar gasto**.
4. Después de guardar, podés **adjuntar archivos** (facturas, comprobantes) al gasto recién creado.

### Filtrar gastos

En el listado de gastos podés filtrar por:
- **Rango de fechas** (Desde / Hasta)
- **Categoría** (búsqueda parcial por texto)

Usá el botón **Limpiar filtros** para quitar todos los filtros activos.

---

## 9. Reportes PDF

Desde **Reportes** en la barra lateral, podés generar tres tipos de informes descargables en PDF.

### Reporte Mensual

Tabla con todos los pagos de un período determinado.

**Contenido:**
- Listado de todos los pagos del mes seleccionado
- Por cada pago: unidad, inquilino, monto a cobrar, monto cobrado, fecha de pago, estado
- Resumen al inicio: total proyectado, total cobrado, cantidad de pagos pagados/pendientes/vencidos

**Cómo generar:**
1. Seleccioná **Mes** y **Año**.
2. Clic en **Descargar PDF**.

### Historial por Unidad

Historial completo de una unidad específica.

**Contenido:**
- Datos de la unidad y grupo al que pertenece
- Todos los contratos que tuvo (activos y pasados)
- Por cada contrato: inquilino, fechas, precio inicial y actual
- Todos los pagos registrados por contrato
- Historial de actualizaciones de precio aplicadas

**Cómo generar:**
1. Seleccioná la **unidad** del desplegable.
2. Clic en **Descargar PDF**.

### Reporte Completo

Resumen total del estado del sistema para un mes dado.

**Contenido:**
- Resumen general: total de unidades, contratos activos, ocupación
- Desglose de unidades por tipo
- Lista de todos los contratos activos con datos resumidos
- Pagos del período seleccionado
- Gastos de grupos del período

**Cómo generar:**
1. Seleccioná **Mes** y **Año**.
2. Clic en **Descargar PDF**.

---

## 10. Configuración y usuarios

### Gestión de usuarios

Accesible solo para usuarios con rol **superadmin** desde **Configuración** → **Usuarios** en la barra lateral.

**Ver usuarios:** Se muestra una tabla con todos los usuarios del sistema: email, nombre, rol y fecha de creación.

**Crear un usuario:**

1. Completá el formulario debajo de la tabla:
   - **Nombre** (obligatorio)
   - **Email** (obligatorio, debe ser único)
   - **Contraseña** (obligatorio, mínimo 8 caracteres)
   - **Rol** — Superadmin o Viewer
2. Clic en **Crear usuario**.

**Cambiar rol:** Desde la tabla, podés cambiar el rol de un usuario existente.

**Eliminar usuario:** Desde la tabla, podés eliminar un usuario (excepto a vos mismo).

---

## 11. Alertas por email

El sistema envía emails automáticos a todos los usuarios **superadmin** para avisar sobre eventos importantes.

### Tipos de alerta

| Alerta | Cuándo se envía | Frecuencia |
|--------|-----------------|------------|
| **Vencimiento de contrato** | Cuando un contrato activo vence en los próximos 30 días | Una vez por contrato |
| **Actualización de precio próxima** | Cuando la fecha de actualización de un contrato es dentro de los próximos 7 días | Una vez por fecha de actualización |

### Contenido de los emails

**Vencimiento de contrato:**
- Nombre del inquilino
- Unidad (identificador y tipo)
- Fecha de vencimiento
- Días restantes
- Precio mensual actual

**Actualización próxima:**
- Nombre del inquilino
- Unidad
- Fecha de actualización
- Días restantes
- Precio actual
- Tipo de actualización (ICL, IPC, monto fijo o porcentaje)

> **Nota técnica:** Las alertas se ejecutan una vez al día a las 9:00 AM (hora Argentina) mediante una tarea programada. El sistema usa Redis para recordar qué alertas ya fueron enviadas y evitar duplicados.

---

## 12. Archivos adjuntos

Podés adjuntar documentos a distintas entidades del sistema.

### Dónde se pueden adjuntar archivos

- **Unidades** — Fotos, planos, escrituras
- **Contratos** — Contratos firmados, adendas, documentación
- **Gastos** — Facturas, comprobantes de pago
- **Gastos de grupo** — Recibos de expensas, facturas de servicios

### Formatos y límites

| Propiedad | Valor |
|-----------|-------|
| Formatos aceptados | JPEG, PNG, WebP, PDF |
| Tamaño máximo | 10 MB por archivo |

### Cómo subir un archivo

1. En la sección de archivos de la entidad correspondiente, hacé clic en **Subir archivo** o arrastrá el archivo al área indicada.
2. El sistema valida el formato y tamaño.
3. El archivo se sube y queda vinculado a la entidad.

### Cómo eliminar un archivo

Hacé clic en el botón de eliminar junto al archivo. Esta acción requiere confirmación y rol superadmin.

> **Nota técnica:** Los archivos se almacenan en Cloudflare R2 (almacenamiento en la nube). En la base de datos solo se guarda la referencia, no el archivo en sí.

---

## 13. Roles y permisos

El sistema tiene dos roles de usuario:

### Superadmin

Acceso completo al sistema:

- Crear, editar y eliminar unidades, inquilinos, grupos, contratos y gastos
- Registrar pagos y generar recibos
- Calcular y aplicar actualizaciones de precio
- Crear y gestionar usuarios
- Subir y eliminar archivos
- Generar reportes PDF
- Recibir alertas por email

### Viewer

Acceso de solo lectura con capacidad de carga de datos:

- Ver toda la información del sistema (dashboard, listados, detalles)
- Crear unidades, inquilinos y gastos (carga de datos)
- Subir archivos
- Generar reportes PDF
- **No puede:** registrar pagos, aplicar actualizaciones de precio, gestionar usuarios ni eliminar archivos

> **Nota técnica:** Las restricciones de rol se validan en el servidor, no solo en la interfaz. Aunque un elemento no sea visible para un viewer, el servidor rechazaría cualquier intento de ejecutar una acción restringida.

---

## 14. Preguntas frecuentes

### ¿Qué pasa si un inquilino paga de más?

Podés registrar el monto exacto que cobró. El sistema lo marca como "Pagado" si el monto cobrado es igual o mayor al monto a cobrar. El excedente queda registrado en las notas si querés anotarlo.

### ¿Puedo tener más de un contrato activo para la misma unidad?

No. Cada unidad solo puede tener un contrato activo a la vez. Para crear un nuevo contrato, el anterior debe estar expirado o rescindido.

### ¿Los índices ICL/IPC se actualizan solos?

Los índices se consultan automáticamente cuando calculás una actualización de precio. Se cachean durante 24 horas para no sobrecargar las fuentes externas. No necesitás actualizarlos manualmente.

### ¿Puedo editar un pago ya registrado?

No directamente. Si necesitás corregir un error, contactá al superadmin para gestionar el ajuste desde la base de datos.

### ¿Qué pasa cuando vence un contrato?

El contrato pasa a estado "Expirado" automáticamente. La unidad vuelve a mostrarse como vacante. Los pagos pendientes del período permanecen en el sistema para su seguimiento.

### ¿Las alertas por email se envían a todos los usuarios?

No, solo a los usuarios con rol **superadmin**. Los viewers no reciben emails automáticos.

### ¿Puedo cambiar el tipo de actualización de un contrato existente?

Sí, editando el contrato desde su página de detalle. El cambio aplicará a la próxima actualización programada.

### ¿Cómo se distribuyen los gastos de un grupo?

El sistema multiplica el monto total del gasto por el porcentaje asignado al tipo de unidad, y luego divide entre la cantidad de unidades de ese tipo. Por ejemplo: gasto de $100.000, tipo "Departamento" al 60%, 3 departamentos → cada uno recibe $20.000.

---

*Documento generado para RentAR Admin. Para soporte técnico, contactá al administrador del sistema.*
