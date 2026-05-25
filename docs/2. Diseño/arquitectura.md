# Arquitectura del sistema — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 14 (App Router) + Supabase  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## 1. Vista general

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTE (Browser)                        │
│                                                                 │
│   React Components (Server + Client)                           │
│   └── /app  (Next.js App Router)                               │
└────────────────────────┬────────────────────────────────────────┘
                         │  HTTPS
┌────────────────────────▼────────────────────────────────────────┐
│                    NEXT.JS SERVER                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Middleware  │  │ Server       │  │  API Routes          │  │
│  │  (auth/rol)  │  │ Components   │  │  /api/...            │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                           │                      │              │
│               ┌───────────┴──────────────────────┘              │
│               │         /lib/supabase/                          │
│               │    (capa de acceso a datos)                     │
└───────────────┼─────────────────────────────────────────────────┘
                │  Supabase JS Client
┌───────────────▼─────────────────────────────────────────────────┐
│                        SUPABASE                                 │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐  │
│  │ PostgreSQL │  │    Auth    │  │ Realtime │  │ Storage (futuro) │  │
│  │  (tablas)  │  │  (sesión)  │  │ (WS)     │  │ (futuro)  │  │
│  └────────────┘  └────────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Estructura de carpetas

```
restaurante/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Layout raíz (providers, fonts)
│   ├── page.tsx                  # Redirect → /login o /mesas
│   ├── login/
│   │   └── page.tsx              # Pantalla de autenticación
│   ├── mesas/
│   │   ├── page.tsx              # Vista de planta (mesero + admin)
│   │   └── [id]/
│   │       └── page.tsx          # Detalle de pedido activo
│   ├── admin/
│   │   ├── layout.tsx            # Guard: solo rol admin
│   │   ├── productos/
│   │   │   └── page.tsx          # CRUD carta
│   │   ├── mesas/
│   │   │   └── page.tsx          # Configuración de mesas
│   │   └── historial/
│   │       └── page.tsx          # Pedidos cerrados + reporte
│   └── api/
│       ├── pedidos/
│       │   ├── route.ts          # GET, POST /api/pedidos
│       │   └── [id]/
│       │       ├── route.ts      # GET /api/pedidos/:id
│       │       ├── cerrar/
│       │       │   └── route.ts  # PUT /api/pedidos/:id/cerrar
│       │       └── items/
│       │           └── route.ts  # POST /api/pedidos/:id/items
│       └── productos/
│           └── route.ts          # GET, POST /api/productos
│
├── components/
│   ├── ui/                       # Componentes base reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Modal.tsx
│   │   └── Badge.tsx
│   ├── mesas/
│   │   ├── MesaGrid.tsx          # Cuadrícula de mesas
│   │   └── MesaCard.tsx          # Tarjeta individual de mesa
│   ├── pedidos/
│   │   ├── PedidoDetalle.tsx     # Ítem list + total
│   │   └── AgregarItemForm.tsx   # Selección de producto + cantidad
│   └── admin/
│       ├── ProductoForm.tsx
│       └── HistorialTable.tsx
│
├── lib/
│   └── supabase/
│       ├── client.ts             # createBrowserClient (uso en Client Components)
│       ├── server.ts             # createServerClient (uso en Server Components)
│       ├── mesas.ts              # getMesas, updateEstadoMesa
│       ├── pedidos.ts            # getPedido, crearPedido, cerrarPedido
│       ├── detalle.ts            # agregarItem, editarItem, eliminarItem
│       └── productos.ts          # getProductos, crearProducto, toggleActivo
│
├── middleware.ts                 # Protección de rutas + lectura de rol
├── types/
│   └── database.ts               # Tipos TypeScript generados desde Supabase
└── .env.local                    # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY
```

---

## 3. Capas de la arquitectura

### 3.1 Presentación — React Components

- **Server Components** (por defecto en App Router): renderizan HTML en el servidor, hacen `fetch` a Supabase directamente usando el cliente de servidor. No incluyen estado de React.
- **Client Components** (`'use client'`): usados cuando se necesita interactividad (formularios, modales, suscripciones Realtime).

### 3.2 Middleware — Autenticación y autorización

`middleware.ts` intercepta cada request:
1. Lee la cookie de sesión de Supabase.
2. Si no hay sesión activa → redirige a `/login`.
3. Si la ruta empieza por `/admin` → consulta el rol en `perfiles`; si no es `admin` → redirige a `/mesas`.

```
Request → middleware.ts → ¿sesión? → ¿rol correcto? → Handler
                              ↓ no         ↓ no
                           /login        /mesas
```

### 3.3 Capa de datos — `/lib/supabase/`

Todas las consultas a Supabase están centralizadas aquí. Los componentes y API Routes nunca llaman directamente al cliente de Supabase; siempre usan las funciones de esta capa. Esto facilita el testing y el mantenimiento.

```typescript
// Ejemplo: lib/supabase/pedidos.ts
export async function crearPedido(mesaId: string, usuarioId: string, comensales: number) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pedidos')
    .insert({ mesa_id: mesaId, usuario_id: usuarioId, comensales })
    .select()
    .single()
  if (error) throw error
  return data
}
```

### 3.4 Supabase

| Servicio | Uso en el proyecto |
|---|---|
| **PostgreSQL** | Persistencia de todas las entidades del dominio |
| **Auth** | Autenticación con email/password; gestión de sesiones con cookies |
| **Realtime** | Suscripción a cambios en `mesas` y `pedidos` para actualización en vivo |
| **Storage** | Futuro v2 para imágenes de productos |

---

## 4. Flujo de autenticación

```
1. Usuario → POST /api/auth (email + password)
2. Supabase Auth valida credenciales → devuelve JWT
3. Next.js setea cookie httpOnly con el token
4. Cada request: middleware lee cookie → verifica JWT con Supabase
5. Server Components usan createServerClient() que lee la misma cookie
```

---

## 5. Flujo de un pedido (happy path)

```
Mesero                 Next.js                   Supabase
  │                       │                          │
  │── selecciona mesa ───▶│                          │
  │                       │── getMesas() ───────────▶│
  │                       │◀── [mesas] ──────────────│
  │◀── vista planta ──────│                          │
  │                       │                          │
  │── abre pedido ───────▶│── crearPedido() ────────▶│
  │                       │                          │── INSERT pedidos
  │                       │                          │── UPDATE mesas (ocupada)
  │                       │◀── pedido creado ────────│
  │◀── detalle pedido ────│                          │
  │                       │                          │
  │── agrega ítem ───────▶│── agregarItem() ────────▶│
  │                       │                          │── INSERT detalle_pedido
  │                       │                          │── trigger: UPDATE pedidos.total
  │                       │◀── detalle actualizado ──│
  │◀── ítem en lista ─────│                          │
  │                       │                          │
  │── cobra ─────────────▶│── cerrarPedido() ───────▶│
  │                       │                          │── UPDATE pedidos (cerrado)
  │                       │                          │── UPDATE mesas (libre)
  │◀── vista planta ──────│                          │
```

---

## 6. Decisiones técnicas

| Decisión | Alternativa considerada | Razón de elección |
|---|---|---|
| Next.js App Router | Pages Router | RSC reduce JS en cliente; layouts anidados simplifican auth |
| Supabase | Firebase, PlanetScale | PostgreSQL relacional, Auth + RLS integrados, SDK JS maduro |
| RLS en Supabase | Validaciones solo en API | Seguridad en la capa de datos, independiente del frontend |
| Trigger SQL para total | Calcular en API | Garantiza consistencia aunque se inserte desde cualquier cliente |
| `precio_unitario` en detalle | JOIN a productos | Preserva el precio histórico si el producto es editado |
| Supabase Realtime | Polling | Actualizaciones en vivo sin costo de polling constante |
