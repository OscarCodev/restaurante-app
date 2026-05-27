# Diseño de UI — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 16 + Tailwind CSS v4  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## 1. Principios de diseño

- **Funcional sobre decorativo:** el mesero opera bajo presión; la UI debe ser directa y sin fricciones.
- **Responsive mobile-first:** debe funcionar en tablet (768 px) y desktop.
- **Feedback inmediato:** cada acción muestra un estado de carga y confirmación.
- **Paleta reducida:** verde = libre, rojo = ocupada, gris = inactivo. Sin colores decorativos.

---

## 2. Mapa de navegación

```
/login
  └── autenticado
        ├── /mesas                        (mesero + admin)
        │     └── /mesas/[id]             (detalle pedido activo)
        │           └── carta (modal)
        └── /admin                        (solo admin)
              ├── /admin/productos
              ├── /admin/mesas
              └── /admin/historial
```

---

## 3. Pantallas

---

### 3.1 Login — `/login`

**Propósito:** Autenticar al usuario.

**Wireframe:**
```
┌─────────────────────────────────┐
│                                 │
│         🍽  Restaurante         │
│                                 │
│  ┌───────────────────────────┐  │
│  │  email@ejemplo.com        │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  ••••••••                 │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │       Ingresar            │  │
│  └───────────────────────────┘  │
│                                 │
│  [mensaje de error aquí]        │
└─────────────────────────────────┘
```

**Componentes:**
- Input email con validación de formato.
- Input password con toggle mostrar/ocultar.
- Botón "Ingresar" deshabilitado mientras carga.
- Mensaje de error inline (sin toast).

**Comportamiento post-login:**
- Rol `mesero` → redirige a `/mesas`.
- Rol `admin` → redirige a `/mesas` (con barra de admin visible).

---

### 3.2 Vista de planta — `/mesas`

**Propósito:** Mostrar el estado de todas las mesas. Punto de entrada principal.

**Wireframe (tablet 768 px):**
```
┌─────────────────────────────────────────────────────┐
│  🍽 Restaurante           Carlos Quispe  [Salir]    │
│  [Admin ▼]  (solo si es admin)                      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │  Mesa 1 │  │  Mesa 2 │  │  Mesa 3 │            │
│  │  4 pax  │  │  2 pax  │  │  6 pax  │            │
│  │         │  │         │  │         │            │
│  │  LIBRE  │  │ OCUPADA │  │  LIBRE  │            │
│  │ [verde] │  │  [rojo] │  │ [verde] │            │
│  │         │  │ 00:45   │  │         │            │
│  └─────────┘  └─────────┘  └─────────┘            │
│                                                     │
│  ┌─────────┐  ┌─────────┐                          │
│  │  Mesa 4 │  │  Mesa 5 │                          │
│  │  4 pax  │  │  8 pax  │                          │
│  │         │  │         │                          │
│  │ OCUPADA │  │  LIBRE  │                          │
│  │  [rojo] │  │ [verde] │                          │
│  │ 01:20   │  │         │                          │
│  └─────────┘  └─────────┘                          │
└─────────────────────────────────────────────────────┘
```

**Componentes:**
- Header fijo con nombre del usuario y botón salir.
- Dropdown "Admin" visible solo si `rol = admin`.
- Grid de tarjetas de mesa (2 columnas en móvil, 3-4 en tablet/desktop).
- Tarjeta de mesa: número, capacidad, estado (color), tiempo si está ocupada.
- Clic en mesa libre → modal "Abrir pedido".
- Clic en mesa ocupada → navega a `/mesas/[id]`.

**Estados de la tarjeta:**
```
LIBRE:    borde verde, fondo verde claro, sin temporizador
OCUPADA:  borde rojo, fondo rojo claro, temporizador HH:MM
```

---

### 3.3 Modal "Abrir pedido"

**Propósito:** Confirmar apertura de pedido en mesa libre.

**Wireframe:**
```
┌──────────────────────────────────┐
│  Abrir pedido — Mesa 3           │
├──────────────────────────────────┤
│                                  │
│  ¿Cuántas personas?              │
│  ┌──────┐                        │
│  │  2   │  (input numérico)      │
│  └──────┘                        │
│                                  │
│  [Cancelar]        [Abrir mesa]  │
└──────────────────────────────────┘
```

**Comportamiento:**
- Input numérico mínimo 1, máximo = capacidad de la mesa.
- "Abrir mesa" llama a `POST /api/pedidos` y redirige al detalle.
- Si hay conflicto (mesa ya ocupada) → muestra error en el modal sin cerrarlo.

---

### 3.4 Detalle del pedido — `/mesas/[id]`

**Propósito:** Ver y gestionar el pedido activo de una mesa.

**Wireframe:**
```
┌─────────────────────────────────────────────────────┐
│  ← Volver          Mesa 3  ·  2 personas            │
│                             Abierto hace 00:32       │
├──────────────────────────────────┬──────────────────┤
│  Pedido actual                   │   Agregar ítem   │
│                                  │                  │
│  Lomo saltado        x2  S/64.00 │  [Entradas    ▼] │
│  [−] [+]  [🗑]                   │                  │
│                                  │  Causa limeña    │
│  Chicha morada       x1   S/8.50 │  S/18.00  [+]   │
│  [−] [+]  [🗑]                   │                  │
│                                  │  Papa a la huancaína│
│  ─────────────────────────────── │  S/16.00  [+]   │
│  Total:              S/72.50     │                  │
│                                  │  [Platos ▼]      │
│  ┌──────────────────────────┐    │  Lomo saltado    │
│  │        Cobrar            │    │  S/32.00  [+]   │
│  └──────────────────────────┘    │                  │
└──────────────────────────────────┴──────────────────┘
```

**Layout:**
- Dos columnas en tablet/desktop. En móvil: tabs "Pedido" / "Carta".
- Lista izquierda: ítems del pedido con controles de cantidad y eliminar.
- Panel derecho: carta filtrable por categoría, botón `[+]` por producto.
- Total siempre visible y fijo abajo.
- Botón "Cobrar" deshabilitado si no hay ítems.

**Flujo "Cobrar":**
1. Clic en "Cobrar" → modal de confirmación con el total.
2. Confirmar → `PUT /api/pedidos/[id]/cerrar` → redirige a `/mesas`.

---

### 3.5 Admin — Gestión de productos — `/admin/productos`

**Propósito:** CRUD de la carta del restaurante.

**Wireframe:**
```
┌─────────────────────────────────────────────────────┐
│  ← Volver a mesas          [+ Nuevo producto]       │
│  Gestión de productos                               │
├──────┬──────────────────┬──────────┬────────────────┤
│ Cat. │ Nombre           │  Precio  │ Estado  Acciones│
├──────┼──────────────────┼──────────┼────────────────┤
│ Plat.│ Lomo saltado     │  S/32.00 │ ● Activo [✏][⊘]│
│ Beb. │ Chicha morada    │   S/8.50 │ ● Activo [✏][⊘]│
│ Entr.│ Causa limeña     │  S/18.00 │ ○ Inactivo [✏][●]│
└──────┴──────────────────┴──────────┴────────────────┘
```

**Componentes:**
- Tabla con columnas: categoría (badge), nombre, precio, estado, acciones.
- Botón editar → abre drawer lateral con el formulario.
- Botón activar/desactivar → toggle inline.
- Botón "+ Nuevo producto" → abre drawer con formulario vacío.

**Formulario de producto (drawer lateral):**
```
┌──────────────────────────────────┐
│  Nuevo producto              [✕] │
├──────────────────────────────────┤
│  Nombre *                        │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  Descripción                     │
│  ┌──────────────────────────┐    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  Precio (S/) *   Categoría *     │
│  ┌───────┐       ┌────────────┐  │
│  │ 0.00  │       │ Principal ▼│  │
│  └───────┘       └────────────┘  │
│                                  │
│  [Cancelar]           [Guardar]  │
└──────────────────────────────────┘
```

---

### 3.6 Admin — Historial — `/admin/historial`

**Propósito:** Consultar pedidos cerrados y total del día.

**Wireframe:**
```
┌─────────────────────────────────────────────────────┐
│  ← Volver a mesas                                   │
│  Historial de pedidos                               │
├─────────────────────────────────────────────────────┤
│  Desde: [2026-05-23]   Hasta: [2026-05-23]  [Buscar]│
│                                                     │
│  Total recaudado hoy: S/ 1,240.00                   │
├──────┬───────┬───────────┬───────────┬──────────────┤
│ Mesa │ Pax   │ Apertura  │ Cierre    │ Total        │
├──────┼───────┼───────────┼───────────┼──────────────┤
│  3   │  2    │ 19:30     │ 21:10     │ S/72.50  [▼] │
│  1   │  4    │ 18:00     │ 20:45     │S/180.00  [▼] │
└──────┴───────┴───────────┴───────────┴──────────────┘
```

**Comportamiento:**
- Filtro de rango de fechas; por defecto muestra el día actual.
- Card de total recaudado del día (suma de pedidos cerrados hoy).
- Botón `[▼]` en cada fila expande el detalle de ítems del pedido.
- Tabla paginada (10 filas por página).

---

## 4. Componentes reutilizables

| Componente | Uso |
|---|---|
| `MesaCard` | Tarjeta de mesa con estado y temporizador |
| `ProductoItem` | Fila de producto en la carta (nombre, precio, botón `+`) |
| `PedidoItem` | Fila de ítem en el pedido (nombre, controles cantidad, eliminar) |
| `Modal` | Overlay genérico con fondo oscuro (abrir pedido, confirmar cobro) |
| `Drawer` | Panel lateral para formularios (crear/editar producto) |
| `Badge` | Etiqueta de categoría o estado con color semántico |
| `EmptyState` | Pantalla vacía con icono y mensaje (ej. "No hay ítems en el pedido") |

---

## 5. Paleta de colores y tokens

| Token | Color | Uso |
|---|---|---|
| `green-100 / green-600` | Verde | Mesa libre, estado activo |
| `red-100 / red-600` | Rojo | Mesa ocupada, error |
| `gray-100 / gray-500` | Gris | Producto inactivo, texto secundario |
| `amber-100 / amber-700` | Ámbar | Advertencias, tiempo límite |
| `white` | Blanco | Fondo de tarjetas y modales |
| `slate-900` | Casi negro | Texto principal |

---

## 6. Flujos de navegación principales

```
Login exitoso (mesero)
  └─▶ /mesas
        ├─▶ [clic mesa libre] → modal "Abrir pedido" → /mesas/[id]
        │                          └─▶ [Cobrar] → confirmar → /mesas
        └─▶ [clic mesa ocupada] → /mesas/[id]
                                    └─▶ [+ ítem] → actualiza lista
                                    └─▶ [Cobrar] → confirmar → /mesas

Login exitoso (admin)
  └─▶ /mesas  (igual que mesero, + menú Admin)
        └─▶ Admin ▼
              ├─▶ /admin/productos → [+ Nuevo] o [✏ Editar] → drawer
              ├─▶ /admin/mesas    → [+ Nueva mesa]
              └─▶ /admin/historial → filtrar fechas → expandir pedido
```
