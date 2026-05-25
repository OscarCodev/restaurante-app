# Casos de uso — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js + Supabase  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## 1. Diagrama de actores y casos de uso

```
┌─────────────────────────────────────────────────────────┐
│                     Sistema                             │
│                                                         │
│  ┌─────────────┐        ┌──────────────────────────┐   │
│  │   Mesero    │───────▶│ CU-01 Ver mesas          │   │
│  └─────────────┘        │ CU-02 Abrir pedido       │   │
│         │               │ CU-03 Agregar ítem       │   │
│         │               │ CU-04 Modificar ítem     │   │
│         │               │ CU-05 Cerrar pedido      │   │
│         │               │ CU-06 Ver carta          │   │
│         │               └──────────────────────────┘   │
│                                                         │
│  ┌─────────────┐        ┌──────────────────────────┐   │
│  │   Admin     │───────▶│ CU-07 Gestionar productos│   │
│  └─────────────┘        │ CU-08 Gestionar mesas    │   │
│         │               │ CU-09 Ver historial      │   │
│         │               │ CU-10 Ver reporte diario │   │
│         │               └──────────────────────────┘   │
│                                                         │
│  ┌─────────────┐        ┌──────────────────────────┐   │
│  │   Ambos     │───────▶│ CU-11 Iniciar sesión     │   │
│  └─────────────┘        │ CU-12 Cerrar sesión      │   │
│                         └──────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Especificación de casos de uso

---

### CU-01 — Ver estado de mesas

| Campo | Detalle |
|---|---|
| **Actor principal** | Mesero, Administrador |
| **Precondición** | Usuario autenticado |
| **Postcondición** | Se muestra la vista de planta con el estado de cada mesa |

**Flujo principal:**
1. El usuario accede a la pantalla principal.
2. El sistema consulta todas las mesas en Supabase.
3. El sistema muestra cada mesa con su número, capacidad y estado (libre / ocupada).
4. Las mesas ocupadas muestran el tiempo transcurrido desde que se abrió el pedido.

**Flujos alternativos:**
- 2a. Sin conexión → el sistema muestra el último estado en caché y una advertencia.

---

### CU-02 — Abrir pedido

| Campo | Detalle |
|---|---|
| **Actor principal** | Mesero |
| **Precondición** | La mesa seleccionada está en estado **libre** |
| **Postcondición** | Se crea un pedido en estado **abierto**; la mesa pasa a **ocupada** |

**Flujo principal:**
1. El mesero selecciona una mesa libre en la vista de planta.
2. El sistema muestra un modal para confirmar apertura e ingresar número de comensales.
3. El mesero confirma.
4. El sistema crea el registro en `pedidos` y actualiza el estado de la mesa.
5. El sistema redirige al detalle del pedido recién creado.

**Flujos alternativos:**
- 2a. La mesa ya fue ocupada por otro mesero en el ínterin → el sistema muestra un mensaje de error y refresca la vista.

---

### CU-03 — Agregar ítem al pedido

| Campo | Detalle |
|---|---|
| **Actor principal** | Mesero |
| **Precondición** | Existe un pedido abierto para la mesa |
| **Postcondición** | El ítem se agrega al pedido; el total se recalcula |

**Flujo principal:**
1. El mesero abre el detalle del pedido activo.
2. El sistema muestra la carta (productos activos agrupados por categoría).
3. El mesero selecciona un producto y especifica la cantidad.
4. El sistema inserta un registro en `detalle_pedido` y recalcula el total del pedido.
5. El sistema muestra el pedido actualizado en tiempo real.

---

### CU-04 — Modificar o eliminar ítem

| Campo | Detalle |
|---|---|
| **Actor principal** | Mesero |
| **Precondición** | El pedido está en estado **abierto** |
| **Postcondición** | El ítem es actualizado o eliminado; el total se recalcula |

**Flujo principal:**
1. El mesero selecciona un ítem del pedido.
2. El mesero elige modificar cantidad o eliminar.
3. El sistema actualiza o elimina el registro en `detalle_pedido`.
4. El sistema recalcula el total.

**Flujos alternativos:**
- 2a. Si se elimina el último ítem, el pedido permanece abierto (sin ítems).

---

### CU-05 — Cerrar pedido (cobrar)

| Campo | Detalle |
|---|---|
| **Actor principal** | Mesero |
| **Precondición** | El pedido tiene al menos un ítem |
| **Postcondición** | El pedido pasa a estado **cerrado**; la mesa vuelve a **libre** |

**Flujo principal:**
1. El mesero pulsa "Cobrar" en el detalle del pedido.
2. El sistema muestra el resumen con el total a cobrar.
3. El mesero confirma el cobro.
4. El sistema actualiza el pedido a `estado = cerrado` y registra `fecha_cierre`.
5. El sistema actualiza la mesa a `estado = libre`.
6. El sistema redirige a la vista de planta.

---

### CU-06 — Ver carta

| Campo | Detalle |
|---|---|
| **Actor principal** | Mesero |
| **Precondición** | Usuario autenticado |
| **Postcondición** | Se muestra la lista de productos activos |

**Flujo principal:**
1. El mesero accede a la sección "Carta".
2. El sistema consulta los productos con `activo = true`.
3. El sistema los muestra agrupados por categoría con nombre y precio.

---

### CU-07 — Gestionar productos

| Campo | Detalle |
|---|---|
| **Actor principal** | Administrador |
| **Precondición** | Usuario autenticado con rol admin |
| **Postcondición** | El producto es creado, editado, activado o desactivado |

**Flujo principal (crear):**
1. El administrador accede a "Gestión de productos".
2. Pulsa "Nuevo producto".
3. Completa el formulario (nombre, descripción, precio, categoría).
4. El sistema valida y guarda en Supabase.

**Flujos alternativos:**
- 3a. Precio negativo o nombre vacío → el sistema muestra errores de validación.

---

### CU-08 — Gestionar mesas

| Campo | Detalle |
|---|---|
| **Actor principal** | Administrador |
| **Precondición** | Usuario autenticado con rol admin |
| **Postcondición** | La mesa es creada o editada |

**Flujo principal:**
1. El administrador accede a "Configuración de mesas".
2. Puede agregar una mesa nueva (número, capacidad) o editar una existente.
3. El sistema guarda los cambios.

**Restricción:** No se puede eliminar una mesa que tenga pedidos abiertos.

---

### CU-09 — Ver historial de pedidos

| Campo | Detalle |
|---|---|
| **Actor principal** | Administrador |
| **Precondición** | Usuario autenticado con rol admin |
| **Postcondición** | Se muestra la lista de pedidos cerrados según filtros |

**Flujo principal:**
1. El administrador accede a "Historial".
2. Selecciona un rango de fechas (por defecto: hoy).
3. El sistema consulta pedidos con `estado = cerrado` en ese rango.
4. El sistema muestra tabla con mesa, hora apertura/cierre y total.
5. El administrador puede expandir cada pedido para ver el detalle.

---

### CU-11 — Iniciar sesión

| Campo | Detalle |
|---|---|
| **Actor principal** | Mesero, Administrador |
| **Precondición** | El usuario tiene cuenta creada en Supabase Auth |
| **Postcondición** | El usuario queda autenticado y es redirigido a la vista principal |

**Flujo principal:**
1. El usuario accede a `/login`.
2. Ingresa email y contraseña.
3. Next.js llama a `supabase.auth.signInWithPassword()`.
4. Supabase valida y devuelve el token de sesión.
5. El middleware de Next.js lee el rol del usuario y redirige a `/dashboard` (admin) o `/mesas` (mesero).

**Flujos alternativos:**
- 3a. Credenciales incorrectas → el sistema muestra "Email o contraseña inválidos".
