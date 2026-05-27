# Implementación — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 16 (App Router) + Supabase  
**Fecha:** Mayo 2026

---

## Configuración inicial

- [x] Crear proyecto con Next.js 16 (App Router)
- [x] Configurar Tailwind CSS v4
- [x] Configurar variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- [x] Configurar alias de paths en `tsconfig.json` (`@/`)

---

## Base de datos — Supabase

- [x] Crear tabla `perfiles` (id, nombre, rol)
- [x] Crear tabla `mesas` (id, numero, capacidad, estado)
- [x] Crear tabla `productos` (id, nombre, descripcion, precio, disponible)
- [x] Crear tabla `pedidos` (id, mesa_id, usuario_id, estado, comensales, total, fechas)
- [x] Crear tabla `detalle_pedido` (id, pedido_id, producto_id, cantidad, precio_unitario, subtotal)
- [x] Crear trigger SQL para calcular `subtotal` y `total` automáticamente al insertar/editar ítems
- [x] Configurar Row Level Security (RLS) en todas las tablas
- [x] Crear usuario admin y mesero de prueba en Supabase Auth

---

## Domain layer — `/domain/`

- [x] Entidad `Mesa`
- [x] Entidad `Pedido`
- [x] Entidad `Producto`
- [x] Entidad `DetallePedido`
- [x] Entidad `Perfil`
- [x] Interfaz `IMesaRepository`
- [x] Interfaz `IPedidoRepository`
- [x] Interfaz `IProductoRepository`
- [x] Interfaz `IDetalleRepository`
- [x] Errores tipados de dominio (`DomainErrors`)

---

## Application layer — `/application/`

- [x] `GetMesasConEstado`
- [x] `CrearMesa`
- [x] `EditarMesa`
- [x] `GetProductos`
- [x] `CrearProducto`
- [x] `EditarProducto`
- [x] `GetPedidos`
- [x] `GetPedidoConDetalle`
- [x] `GetHistorial`
- [x] `CrearPedido`
- [x] `CerrarPedido`
- [x] `CancelarPedido`
- [x] `AgregarItem`
- [x] `EditarItem`
- [x] `EliminarItem`

---

## Infrastructure layer — `/infrastructure/`

- [x] Cliente Supabase para Client Components (`supabase/client.ts`)
- [x] Cliente Supabase para Server Components y API Routes (`supabase/server.ts`)
- [x] Helper `getCurrentUser` — lee usuario y rol desde la sesión activa
- [x] `SupabaseMesaRepository`
- [x] `SupabasePedidoRepository`
- [x] `SupabaseProductoRepository`
- [x] `SupabaseDetalleRepository`

---

## Contenedor DI — `/container/index.ts`

- [x] Función `createContainer()` que instancia repositorios e inyecta todos los casos de uso

---

## Middleware — `middleware.ts`

- [x] Protección global de rutas (redirige a `/login` si no hay sesión)
- [x] Guard de rol para `/admin/*` (redirige a `/mesas` si el rol no es `admin`)

---

## API Routes — `/app/api/`

- [x] `POST /api/auth/login`
- [x] `POST /api/auth/logout`
- [x] `GET  /api/mesas`
- [x] `POST /api/mesas`
- [x] `PATCH /api/mesas/:id`
- [x] `GET  /api/productos`
- [x] `POST /api/productos`
- [x] `PATCH /api/productos/:id`
- [x] `GET  /api/pedidos`
- [x] `POST /api/pedidos`
- [x] `GET  /api/pedidos/:id`
- [x] `PUT  /api/pedidos/:id/cerrar`
- [x] `POST /api/pedidos/:id/items`
- [x] `PATCH /api/pedidos/:id/items/:itemId`
- [x] `DELETE /api/pedidos/:id/items/:itemId`

---

## Utilidades — `/lib/`

- [x] `lib/http/mapError.ts` — convierte errores de dominio a respuestas HTTP (400, 404, 409…)
- [x] `lib/validaciones.ts` — esquemas Zod para validar body de requests
- [x] `lib/calculos.ts` — cálculo de subtotales y totales

---

## Páginas y componentes

- [x] `app/page.tsx` — redirect a `/login` o `/mesas` según sesión
- [x] `app/login/page.tsx` — formulario de acceso
- [x] `app/mesas/page.tsx` — vista de planta con estado de cada mesa
- [x] `app/mesas/[id]/page.tsx` — detalle del pedido activo de una mesa
- [x] `app/admin/layout.tsx` — layout con guard de rol admin
- [x] `app/admin/productos/page.tsx` — CRUD de carta
- [x] `app/admin/mesas/page.tsx` — configuración de mesas
- [x] `app/admin/historial/page.tsx` — pedidos cerrados y reporte
- [x] `components/ui/` — Badge, Drawer, EmptyState
- [x] `components/mesas/` — MesaGrid, MesaCard, AbrirPedidoModal
- [x] `components/pedidos/` — PedidoDetalle, AgregarItemForm, CobrarModal
- [x] `components/admin/` — ProductoForm, HistorialTable
- [x] `app/mesas/loading.tsx` y `error.tsx` — estados de carga y error
- [x] `app/admin/loading.tsx` y `error.tsx` — estados de carga y error

---

## Realtime — Supabase

- [x] Suscripción `postgres_changes` en `MesaGrid` — actualiza la vista de planta en vivo
- [x] Suscripción `postgres_changes` en `app/mesas/[id]` — refleja cambios de ítems en tiempo real

---

## Testing — `/__tests__/`

- [x] Tests unitarios de dominio (`domain/errors`)
- [x] Tests unitarios de casos de uso: mesas, productos, pedidos, detalle, cancelar pedido
- [x] Tests unitarios de utilidades: `validaciones`, `calculos`, `mapError`
- [x] Tests de integración de API Routes: mesas, productos, pedidos, pedidos/:id
