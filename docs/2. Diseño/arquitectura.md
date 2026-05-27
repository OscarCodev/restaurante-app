# Arquitectura del sistema — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 16 (App Router) + Supabase  
**Patrón:** Clean Architecture (Arquitectura Limpia)  
**Versión:** 2.0  
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
│                    NEXT.JS 16 SERVER                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Middleware  │  │   Server     │  │    API Routes        │  │
│  │  (auth/rol)  │  │  Components  │  │    /api/...          │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                           │                      │              │
│               ┌───────────┴──────────────────────┘              │
│               │       container/index.ts                        │
│               │   (inyección de dependencias)                   │
│               ▼                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  APPLICATION LAYER                       │   │
│  │    casos de uso: CrearPedido, AgregarItem, CerrarPedido… │   │
│  └─────────────────────────┬────────────────────────────────┘   │
│                            │  interfaces (IRepo)                │
│  ┌─────────────────────────▼────────────────────────────────┐   │
│  │                    DOMAIN LAYER                          │   │
│  │    entidades: Mesa, Pedido, Producto, DetallePedido…     │   │
│  │    repos:     IMesaRepository, IPedidoRepository…        │   │
│  └─────────────────────────▲────────────────────────────────┘   │
│                            │  implementaciones                  │
│  ┌─────────────────────────┴────────────────────────────────┐   │
│  │               INFRASTRUCTURE LAYER                       │   │
│  │    SupabaseMesaRepository, SupabasePedidoRepository…     │   │
│  └─────────────────────────┬────────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────────┘
                             │  Supabase JS Client
┌────────────────────────────▼────────────────────────────────────┐
│                          SUPABASE                               │
│                                                                 │
│  ┌────────────┐  ┌────────────┐  ┌──────────┐  ┌───────────┐  │
│  │ PostgreSQL │  │    Auth    │  │ Realtime │  │  Storage  │  │
│  │  (tablas)  │  │  (sesión)  │  │ (activo) │  │  (futuro) │  │
│  └────────────┘  └────────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Capas de la arquitectura

El proyecto aplica **Clean Architecture**: el núcleo de negocio (dominio) es completamente independiente de los detalles de infraestructura (Supabase, Next.js). Las dependencias siempre apuntan hacia adentro.

```
Presentación  ──▶  Application  ──▶  Domain  ◀──  Infrastructure
(Next.js)          (use cases)      (entities)     (Supabase repos)
```

---

### 2.1 Domain — `/domain/`

El núcleo del sistema. **Sin dependencias externas.**

- **`domain/entities/`** — Objetos de negocio: `Mesa`, `Pedido`, `Producto`, `DetallePedido`, `Perfil`
- **`domain/repositories/`** — Interfaces: `IMesaRepository`, `IPedidoRepository`, `IProductoRepository`, `IDetalleRepository`
- **`domain/errors/`** — Errores tipados de dominio: `DomainErrors`

```typescript
// domain/repositories/IPedidoRepository.ts
export interface IPedidoRepository {
  findAll(filters: PedidoFilters): Promise<PedidoConMesa[]>
  findAllAbiertos(): Promise<Pedido[]>
  findConDetalle(id: string): Promise<PedidoConDetalle | null>
  create(mesaId: string, usuarioId: string, comensales: number): Promise<Pedido>
  close(id: string, mesaId: string): Promise<void>
}
```

---

### 2.2 Application — `/application/`

Contiene los **casos de uso**. Cada uno es una clase con `execute()`. Solo depende de interfaces del dominio.

| Área | Casos de uso |
|---|---|
| **Mesas** | `GetMesasConEstado`, `CrearMesa`, `EditarMesa` |
| **Productos** | `GetProductos`, `CrearProducto`, `EditarProducto` |
| **Pedidos** | `GetPedidos`, `GetPedidoConDetalle`, `GetHistorial`, `CrearPedido`, `CerrarPedido`, `CancelarPedido` |
| **Detalle** | `AgregarItem`, `EditarItem`, `EliminarItem` |

```typescript
// application/pedidos/CrearPedido.ts
export class CrearPedido {
  constructor(
    private mesaRepo: IMesaRepository,
    private pedidoRepo: IPedidoRepository,
  ) {}

  async execute(mesaId: string, usuarioId: string, comensales: number): Promise<Pedido> {
    // validaciones de dominio → crea el pedido vía repositorio
  }
}
```

---

### 2.3 Infrastructure — `/infrastructure/`

Implementa las interfaces del dominio usando Supabase. La capa de dominio nunca sabe que Supabase existe.

| Archivo | Responsabilidad |
|---|---|
| `infrastructure/supabase/client.ts` | `createBrowserClient()` para Client Components |
| `infrastructure/supabase/server.ts` | `createServerClient()` para Server Components y API Routes |
| `infrastructure/auth/getCurrentUser.ts` | Lee el usuario autenticado desde la sesión |
| `infrastructure/repositories/SupabaseMesaRepository.ts` | Implementa `IMesaRepository` |
| `infrastructure/repositories/SupabasePedidoRepository.ts` | Implementa `IPedidoRepository` |
| `infrastructure/repositories/SupabaseProductoRepository.ts` | Implementa `IProductoRepository` |
| `infrastructure/repositories/SupabaseDetalleRepository.ts` | Implementa `IDetalleRepository` |

---

### 2.4 Presentation — `/app/` y `/components/`

Next.js 16 App Router. Las API Routes obtienen los casos de uso del contenedor y los ejecutan. Los Server Components pueden hacer lo mismo para lectura directa.

---

### 2.5 Contenedor DI — `/container/index.ts`

Instancia los repositorios y los inyecta en los casos de uso. Es el único lugar donde las capas se conectan.

```typescript
// container/index.ts
export function createContainer() {
  const mesaRepo     = new SupabaseMesaRepository()
  const pedidoRepo   = new SupabasePedidoRepository()
  const productoRepo = new SupabaseProductoRepository()
  const detalleRepo  = new SupabaseDetalleRepository()

  return {
    crearPedido: new CrearPedido(mesaRepo, pedidoRepo),
    agregarItem: new AgregarItem(detalleRepo, productoRepo),
    cerrarPedido: new CerrarPedido(pedidoRepo, detalleRepo),
    // … todos los demás casos de uso
  }
}
```

---

## 3. Estructura de carpetas

```
restaurante/
├── app/                              # Next.js 16 App Router — presentación
│   ├── layout.tsx
│   ├── page.tsx                      # Redirect → /login o /mesas
│   ├── login/
│   │   └── page.tsx
│   ├── mesas/
│   │   ├── page.tsx                  # Vista de planta (mesero + admin)
│   │   └── [id]/
│   │       └── page.tsx              # Detalle del pedido activo
│   ├── admin/
│   │   ├── layout.tsx                # Guard: solo rol admin
│   │   ├── productos/page.tsx        # CRUD carta
│   │   ├── mesas/page.tsx            # Configuración de mesas
│   │   └── historial/page.tsx        # Pedidos cerrados + reporte
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts        # POST /api/auth/login
│       │   └── logout/route.ts       # POST /api/auth/logout
│       ├── mesas/
│       │   ├── route.ts              # GET, POST /api/mesas
│       │   └── [id]/route.ts         # PATCH /api/mesas/:id
│       ├── productos/
│       │   ├── route.ts              # GET, POST /api/productos
│       │   └── [id]/route.ts         # PATCH /api/productos/:id
│       └── pedidos/
│           ├── route.ts              # GET, POST /api/pedidos
│           └── [id]/
│               ├── route.ts          # GET /api/pedidos/:id
│               ├── cerrar/
│               │   └── route.ts      # PUT /api/pedidos/:id/cerrar
│               └── items/
│                   ├── route.ts      # POST /api/pedidos/:id/items
│                   └── [itemId]/
│                       └── route.ts  # PATCH, DELETE /api/pedidos/:id/items/:itemId
│
├── domain/                           # Capa de dominio (sin dependencias externas)
│   ├── entities/                     # Mesa, Pedido, Producto, DetallePedido, Perfil
│   ├── repositories/                 # Interfaces: IMesaRepository, IPedidoRepository…
│   └── errors/                       # DomainErrors
│
├── application/                      # Casos de uso
│   ├── mesas/                        # GetMesasConEstado, CrearMesa, EditarMesa
│   ├── productos/                    # GetProductos, CrearProducto, EditarProducto
│   ├── pedidos/                      # GetPedidos, GetPedidoConDetalle, GetHistorial,
│   │                                 # CrearPedido, CerrarPedido, CancelarPedido
│   └── detalle/                      # AgregarItem, EditarItem, EliminarItem
│
├── infrastructure/                   # Implementaciones de repositorios
│   ├── supabase/                     # client.ts, server.ts
│   ├── auth/                         # getCurrentUser.ts
│   └── repositories/                 # SupabaseMesaRepository, SupabasePedidoRepository…
│
├── container/
│   └── index.ts                      # createContainer() — inyección de dependencias
│
├── components/                       # Componentes React
│   ├── ui/                           # Badge, Modal, Drawer, EmptyState
│   ├── mesas/                        # MesaGrid, MesaCard, AbrirPedidoModal
│   ├── pedidos/                      # PedidoDetalle, AgregarItemForm, CobrarModal
│   └── admin/                        # ProductoForm, HistorialTable
│
├── lib/                              # Utilidades transversales
│   ├── http/
│   │   └── mapError.ts               # Convierte errores de dominio a HTTP responses
│   ├── validaciones.ts               # Validaciones de input de API
│   └── calculos.ts                   # Cálculos de negocio (subtotales, totales)
│
├── middleware.ts                     # Protección de rutas + lectura de rol
└── .env.local                        # NEXT_PUBLIC_SUPABASE_URL, ANON_KEY
```

---

## 4. Middleware — Autenticación y autorización

`middleware.ts` intercepta cada request:

1. Lee la cookie de sesión de Supabase.
2. Si no hay sesión activa → redirige a `/login`.
3. Si la ruta empieza por `/admin` → consulta el rol en `perfiles`; si no es `admin` → redirige a `/mesas`.

```
Request → middleware.ts → ¿sesión? → ¿rol correcto? → Handler
                              ↓ no          ↓ no
                           /login         /mesas
```

---

## 5. Flujo de una request (API Route → Use Case → Supabase)

```
API Route: app/api/pedidos/route.ts
  │
  ├─ 1. createContainer()              // instancia repos y casos de uso
  ├─ 2. getCurrentUser(request)        // lee sesión → usuarioId
  │
  └─ 3. container.crearPedido.execute(mesaId, usuarioId, comensales)
              │
              ├─ mesaRepo.findById(mesaId)
              │       └─▶ SupabaseMesaRepository → Supabase SELECT
              │
              ├─ [validar: mesa debe estar libre] ← lógica de dominio
              │
              └─ pedidoRepo.create(mesaId, usuarioId, comensales)
                      └─▶ SupabasePedidoRepository → Supabase INSERT
```

Los errores de dominio (`DomainErrors`) son capturados por `lib/http/mapError.ts` y traducidos al código HTTP correspondiente (409, 404, 400…).

---

## 6. Flujo de un pedido completo (happy path)

```
Mesero            Next.js (API)          Application          Supabase
  │                    │                      │                   │
  │── selecciona ─────▶│ GET /api/mesas       │                   │
  │   mesa             │── getMesasConEstado ─▶│                   │
  │                    │   .execute()         │── findAll() ─────▶│
  │                    │◀─────────────────────│◀── [rows] ────────│
  │◀── vista planta ───│                      │                   │
  │                    │                      │                   │
  │── abre pedido ────▶│ POST /api/pedidos    │                   │
  │                    │── crearPedido ───────▶│                   │
  │                    │   .execute()         │── create() ──────▶│
  │                    │◀─────────────────────│◀── pedido ────────│
  │◀── redirige a ─────│ 201 { pedido }       │                   │
  │   /mesas/[id]      │                      │                   │
  │                    │                      │                   │
  │── agrega ítem ────▶│ POST /items          │                   │
  │                    │── agregarItem ───────▶│                   │
  │                    │   .execute()         │── create() ──────▶│
  │◀── ítem en lista ──│ 201 { item }         │◀── detalle ───────│
  │                    │                      │                   │
  │── cobra ──────────▶│ PUT /cerrar          │                   │
  │                    │── cerrarPedido ──────▶│                   │
  │                    │   .execute()         │── close() ───────▶│
  │◀── vista planta ───│ 200 { cerrado }      │                   │
```

---

## 7. Supabase

| Servicio | Uso en el proyecto |
|---|---|
| **PostgreSQL** | Persistencia de todas las entidades del dominio |
| **Auth** | Autenticación con email/password; gestión de sesiones con cookies httpOnly |
| **Realtime** | Suscripciones `postgres_changes` activas: `MesaGrid` escucha cambios en `mesas`; `app/mesas/[id]` escucha cambios en `detalle_pedido` del pedido activo |
| **Storage** | Futuro v2 — imágenes de productos |

---

## 8. Decisiones técnicas

| Decisión | Alternativa considerada | Razón de elección |
|---|---|---|
| **Next.js 16 App Router** | Pages Router | RSC reduce JS en cliente; layouts anidados simplifican auth |
| **Clean Architecture** | Acceso directo a Supabase en cada route | Desacopla dominio de infraestructura; facilita testing y futuros cambios de BD |
| **Repository pattern** | Llamadas directas en use cases | Abstrae la fuente de datos; permite mocks en tests unitarios |
| **DI Container (`container/`)** | Singleton global | Instanciación explícita, sin magia; fácil de reemplazar en tests |
| **Supabase** | Firebase, PlanetScale | PostgreSQL relacional, Auth + RLS integrados, SDK JS maduro |
| **RLS en Supabase** | Validaciones solo en API | Seguridad en la capa de datos, independiente del frontend |
| **Trigger SQL para `total`** | Calcular en use case | Garantiza consistencia aunque se inserte desde cualquier cliente |
| **`precio_unitario` en detalle** | JOIN a productos | Preserva el precio histórico si el producto es editado posteriormente |
| **`mapError.ts`** | try/catch en cada route | Centraliza la traducción de errores de dominio a HTTP; routes quedan limpias |
