# Plan de implementación — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 14 (App Router) + Supabase  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## Cómo usar este documento

Este plan conecta directamente con los artefactos de análisis y diseño ya producidos:

| Referencia | Artefacto |
|---|---|
| `[REQ]` | `requerimientos.md` |
| `[CU]` | `casos-de-uso.md` |
| `[HU]` | `historias-de-usuario.md` |
| `[MOD]` | `modelo-datos.md` |
| `[ARQ]` | `arquitectura.md` |
| `[API]` | `diseno-api.md` |
| `[UI]` | `diseno-ui.md` |

Cada fase indica qué artefacto consultar, qué construir exactamente y cómo verificar que está bien antes de avanzar.

---

## Resumen de fases

```
FASE 0 — Entorno y repositorio          (≈ 30 min)
FASE 1 — Base de datos en Supabase      (≈ 1 h)
FASE 2 — Autenticación y middleware     (≈ 1.5 h)
FASE 3 — Módulo de mesas                (≈ 2 h)
FASE 4 — Módulo de productos            (≈ 1.5 h)
FASE 5 — Módulo de pedidos              (≈ 3 h)
FASE 6 — Panel de administración        (≈ 2 h)
FASE 7 — Pulido y datos de prueba       (≈ 1 h)
```

**Total estimado: 12–13 horas de desarrollo.**

---

## FASE 0 — Entorno y repositorio

**Objetivo:** tener el proyecto Next.js corriendo localmente y conectado a Supabase.

**Referencia:** `[ARQ]` §2 (estructura de carpetas), `[ARQ]` §6 (decisiones técnicas).

### 0.1 Crear el proyecto Next.js

```bash
npx create-next-app@latest restaurante \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias "@/*"

cd restaurante
```

### 0.2 Instalar dependencias

```bash
# Cliente de Supabase
npm install @supabase/supabase-js @supabase/ssr

# Utilidades de formularios y validación
npm install zod react-hook-form @hookform/resolvers

# Íconos
npm install lucide-react
```

### 0.3 Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project.
2. Elegir región más cercana (São Paulo para Perú).
3. Guardar la contraseña de la base de datos.
4. En **Project Settings → API**, copiar:
   - `Project URL`
   - `anon public key`

### 0.4 Variables de entorno

Crear `.env.local` en la raíz (nunca subir al repositorio):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Crear `.env.example` para el repositorio:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 0.5 Estructura de carpetas inicial

Crear la estructura definida en `[ARQ]` §2:

```bash
mkdir -p app/{login,mesas,admin/{productos,mesas,historial},"api/{auth,mesas,productos,pedidos}"}
mkdir -p components/{ui,mesas,pedidos,admin}
mkdir -p lib/supabase
mkdir -p types
```

### 0.6 Clientes de Supabase

Crear `lib/supabase/client.ts` (uso en Client Components):

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

Crear `lib/supabase/server.ts` (uso en Server Components y API Routes):

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options))
        },
      },
    }
  )
}
```

**✅ Verificación de fase:**
- `npm run dev` inicia sin errores.
- `.env.local` tiene las variables de Supabase.
- Los dos clientes existen en `lib/supabase/`.

---

## FASE 1 — Base de datos en Supabase

**Objetivo:** tener todas las tablas, índices, RLS y datos de prueba listos.

**Referencia:** `[MOD]` §2–5 (definición de tablas, índices, RLS, trigger).

### 1.1 Ejecutar el schema

En Supabase → **SQL Editor**, ejecutar el siguiente script completo en orden:

```sql
-- 1. Tabla mesas
CREATE TABLE mesas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero     integer NOT NULL UNIQUE,
  capacidad  integer NOT NULL CHECK (capacidad >= 1),
  estado     text    NOT NULL DEFAULT 'libre'
               CHECK (estado IN ('libre', 'ocupada')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabla productos
CREATE TABLE productos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text           NOT NULL,
  descripcion text,
  precio      numeric(10,2)  NOT NULL CHECK (precio > 0),
  categoria   text           NOT NULL
                CHECK (categoria IN ('entrada', 'principal', 'bebida', 'postre')),
  activo      boolean        NOT NULL DEFAULT true,
  created_at  timestamptz    NOT NULL DEFAULT now()
);

-- 3. Tabla perfiles (extiende auth.users)
CREATE TABLE perfiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     text NOT NULL,
  rol        text NOT NULL DEFAULT 'mesero'
               CHECK (rol IN ('mesero', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Tabla pedidos
CREATE TABLE pedidos (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mesa_id        uuid           NOT NULL REFERENCES mesas(id),
  usuario_id     uuid           NOT NULL REFERENCES auth.users(id),
  estado         text           NOT NULL DEFAULT 'abierto'
                   CHECK (estado IN ('abierto', 'cerrado')),
  total          numeric(10,2)  NOT NULL DEFAULT 0,
  comensales     integer        NOT NULL CHECK (comensales >= 1),
  fecha_apertura timestamptz    NOT NULL DEFAULT now(),
  fecha_cierre   timestamptz,
  created_at     timestamptz    NOT NULL DEFAULT now()
);

-- 5. Tabla detalle_pedido
CREATE TABLE detalle_pedido (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid          NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     uuid          NOT NULL REFERENCES productos(id),
  cantidad        integer       NOT NULL CHECK (cantidad >= 1),
  precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario > 0),
  subtotal        numeric(10,2) NOT NULL,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- 6. Índices
CREATE INDEX idx_pedidos_mesa_id   ON pedidos(mesa_id);
CREATE INDEX idx_pedidos_fecha     ON pedidos(fecha_apertura);
CREATE INDEX idx_detalle_pedido_id ON detalle_pedido(pedido_id);
CREATE INDEX idx_productos_activo  ON productos(activo);

-- 7. Trigger: recalcular total del pedido
CREATE OR REPLACE FUNCTION recalcular_total_pedido()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pedidos
  SET total = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM detalle_pedido
    WHERE pedido_id = COALESCE(NEW.pedido_id, OLD.pedido_id)
  )
  WHERE id = COALESCE(NEW.pedido_id, OLD.pedido_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_total_pedido
AFTER INSERT OR UPDATE OR DELETE ON detalle_pedido
FOR EACH ROW EXECUTE FUNCTION recalcular_total_pedido();

-- 8. Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION crear_perfil_usuario()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO perfiles (id, nombre, rol)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'nombre', 'mesero');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_crear_perfil
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION crear_perfil_usuario();
```

### 1.2 Habilitar RLS

```sql
ALTER TABLE mesas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido  ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles        ENABLE ROW LEVEL SECURITY;

-- Mesas: todos los autenticados pueden leer
CREATE POLICY "leer mesas" ON mesas FOR SELECT TO authenticated USING (true);

-- Mesas: solo admin puede escribir
CREATE POLICY "admin mesas" ON mesas FOR ALL TO authenticated
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin');

-- Productos: todos ven los activos
CREATE POLICY "leer productos activos" ON productos FOR SELECT TO authenticated
  USING (activo = true);

-- Productos: admin ve todos y puede escribir
CREATE POLICY "admin productos" ON productos FOR ALL TO authenticated
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin');

-- Pedidos: mesero ve los suyos; admin ve todos
CREATE POLICY "ver pedidos" ON pedidos FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid() OR
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "crear pedidos" ON pedidos FOR INSERT TO authenticated
  WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "editar pedidos propios" ON pedidos FOR UPDATE TO authenticated
  USING (
    usuario_id = auth.uid() OR
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
  );

-- Detalle: acceso ligado al pedido padre
CREATE POLICY "ver detalle" ON detalle_pedido FOR SELECT TO authenticated USING (true);
CREATE POLICY "escribir detalle" ON detalle_pedido FOR ALL TO authenticated USING (true);

-- Perfiles: cada usuario ve el suyo; admin ve todos
CREATE POLICY "ver perfil propio" ON perfiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR
    (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin');
```

### 1.3 Datos de prueba (seed)

```sql
-- Mesas (RF-01)
INSERT INTO mesas (numero, capacidad) VALUES
  (1, 4), (2, 2), (3, 6), (4, 4), (5, 8);

-- Productos (RF-02)
INSERT INTO productos (nombre, descripcion, precio, categoria) VALUES
  ('Ceviche',          'Clásico peruano con leche de tigre', 28.00, 'entrada'),
  ('Causa limeña',     'Con atún y palta',                   18.00, 'entrada'),
  ('Lomo saltado',     'Con papas fritas y arroz',           32.00, 'principal'),
  ('Ají de gallina',   'Con arroz blanco y aceituna',        28.00, 'principal'),
  ('Arroz con leche',  'Con canela',                          8.00, 'postre'),
  ('Chicha morada',    'Bebida tradicional 500 ml',           8.50, 'bebida'),
  ('Inca Kola 500 ml', '',                                    5.00, 'bebida');
```

Para crear el usuario admin, ir a Supabase → **Authentication → Users → Add user** con email `admin@restaurante.com`. Luego en SQL Editor:

```sql
UPDATE perfiles
SET rol = 'admin', nombre = 'Administrador'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@restaurante.com');
```

**✅ Verificación de fase:**
- Las 5 tablas aparecen en Supabase → Table Editor.
- El trigger de total existe en Database → Functions.
- Los seeds se ven en la tabla `mesas` y `productos`.
- El usuario admin tiene `rol = 'admin'` en `perfiles`.

---

## FASE 2 — Autenticación y middleware

**Objetivo:** login funcional, sesión persistente, rutas protegidas por rol.

**Referencia:** `[CU]` CU-11, CU-12 · `[HU]` HU-01, HU-02 · `[ARQ]` §3.2 · `[API]` §1 · `[UI]` §3.1.

### 2.1 Tipos TypeScript

Crear `types/database.ts` con los tipos del dominio:

```typescript
export type Rol = 'mesero' | 'admin'
export type EstadoMesa = 'libre' | 'ocupada'
export type EstadoPedido = 'abierto' | 'cerrado'
export type Categoria = 'entrada' | 'principal' | 'bebida' | 'postre'

export interface Mesa {
  id: string
  numero: number
  capacidad: number
  estado: EstadoMesa
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  categoria: Categoria
  activo: boolean
  created_at: string
}

export interface Pedido {
  id: string
  mesa_id: string
  usuario_id: string
  estado: EstadoPedido
  total: number
  comensales: number
  fecha_apertura: string
  fecha_cierre: string | null
  created_at: string
}

export interface DetallePedido {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at: string
}

export interface Perfil {
  id: string
  nombre: string
  rol: Rol
  created_at: string
}
```

### 2.2 Middleware de autenticación

Crear `middleware.ts` en la raíz:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Ruta pública: login
  if (request.nextUrl.pathname === '/login') {
    if (user) return NextResponse.redirect(new URL('/mesas', request.url))
    return response
  }

  // Sin sesión → login
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Rutas de admin: verificar rol
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      return NextResponse.redirect(new URL('/mesas', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

### 2.3 Pantalla de login

Crear `app/login/page.tsx` — implementar el wireframe de `[UI]` §3.1:

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña inválidos')
      setLoading(false)
      return
    }
    router.push('/mesas')
    router.refresh()
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900 text-center">🍽 Restaurante</h1>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="email@ejemplo.com" required
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña" required
          className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  )
}
```

**✅ Verificación de fase:**
- Login con credenciales correctas redirige a `/mesas`.
- Login con credenciales incorrectas muestra el mensaje de error.
- Acceder a `/mesas` sin sesión redirige a `/login`.
- Acceder a `/admin/productos` como mesero redirige a `/mesas`.

---

## FASE 3 — Módulo de mesas

**Objetivo:** vista de planta con estado en tiempo real y apertura de pedidos.

**Referencia:** `[CU]` CU-01, CU-02 · `[HU]` HU-03, HU-04 · `[API]` §2 · `[UI]` §3.2, §3.3.

### 3.1 Capa de datos — `lib/supabase/mesas.ts`

```typescript
import { createClient } from './server'
import type { Mesa } from '@/types/database'

export async function getMesas(): Promise<Mesa[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .order('numero')
  if (error) throw error
  return data
}

export async function updateEstadoMesa(id: string, estado: 'libre' | 'ocupada') {
  const supabase = await createClient()
  const { error } = await supabase
    .from('mesas')
    .update({ estado })
    .eq('id', id)
  if (error) throw error
}
```

### 3.2 API Route — `app/api/mesas/route.ts`

Implementar según `[API]` §2: `GET /api/mesas` y `POST /api/mesas`.

Los endpoints validan sesión, llaman a `getMesas()` o insertan en Supabase y retornan JSON.

### 3.3 Componente `MesaCard`

Crear `components/mesas/MesaCard.tsx` — implementar el diseño de `[UI]` §3.2:
- Verde con borde si `estado = 'libre'`, rojo si `estado = 'ocupada'`.
- Mostrar número, capacidad y temporizador si está ocupada.
- `onClick` recibido como prop (el padre decide si abre modal o navega).

### 3.4 Vista de planta — `app/mesas/page.tsx`

Server Component que:
1. Llama a `getMesas()` para renderizar el grid inicial.
2. Pasa los datos a `MesaGrid` (Client Component) que se suscribe a Supabase Realtime para actualizaciones en vivo (`[ARQ]` §3.4).

```typescript
// Suscripción Realtime en MesaGrid.tsx
useEffect(() => {
  const supabase = createClient()
  const channel = supabase
    .channel('mesas-cambios')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'mesas' },
      (payload) => {
        // Actualizar la mesa correspondiente en el estado local
        setMesas(prev => prev.map(m => m.id === payload.new.id ? payload.new as Mesa : m))
      })
    .subscribe()
  return () => { supabase.removeChannel(channel) }
}, [])
```

### 3.5 Modal "Abrir pedido"

Crear `components/mesas/AbrirPedidoModal.tsx` — wireframe en `[UI]` §3.3:
- Input numérico de comensales (mín 1, máx capacidad de la mesa).
- Al confirmar llama a `POST /api/pedidos` y redirige a `/mesas/[id]`.

**✅ Verificación de fase:**
- La vista de planta muestra las 5 mesas del seed con estado correcto.
- Al abrir un pedido la mesa cambia a rojo en tiempo real (sin recargar).
- El modal valida que el número de comensales no supere la capacidad.
- Intentar abrir una mesa ocupada muestra error.

---

## FASE 4 — Módulo de productos

**Objetivo:** carta disponible para el mesero y CRUD completo para el admin.

**Referencia:** `[CU]` CU-06, CU-07 · `[HU]` HU-09, HU-10, HU-11 · `[API]` §3 · `[UI]` §3.5.

### 4.1 Capa de datos — `lib/supabase/productos.ts`

```typescript
import { createClient } from './server'
import type { Producto } from '@/types/database'

export async function getProductos(soloActivos = true): Promise<Producto[]> {
  const supabase = await createClient()
  let query = supabase.from('productos').select('*').order('categoria').order('nombre')
  if (soloActivos) query = query.eq('activo', true)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function crearProducto(datos: Omit<Producto, 'id' | 'created_at' | 'activo'>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').insert(datos).select().single()
  if (error) throw error
  return data
}

export async function editarProducto(id: string, datos: Partial<Producto>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('productos').update(datos).eq('id', id).select().single()
  if (error) throw error
  return data
}
```

### 4.2 API Routes — `app/api/productos/route.ts`

Implementar `GET /api/productos` y `POST /api/productos` según `[API]` §3.
El GET detecta el rol del usuario para decidir si incluye inactivos.

### 4.3 Esquema de validación con Zod

```typescript
// lib/validaciones.ts
import { z } from 'zod'

export const productoSchema = z.object({
  nombre:      z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio:      z.number().positive('El precio debe ser mayor a 0'),
  categoria:   z.enum(['entrada', 'principal', 'bebida', 'postre']),
})
```

### 4.4 Página admin de productos — `app/admin/productos/page.tsx`

Implementar la tabla y el drawer de `[UI]` §3.5:
- Tabla con columnas: categoría (badge de color), nombre, precio, estado, acciones.
- Botón editar → abre `ProductoForm` en drawer lateral.
- Toggle activo/inactivo hace `PATCH /api/productos/[id]` optimistamente.

**✅ Verificación de fase:**
- La carta muestra los 7 productos del seed agrupados por categoría.
- Un producto desactivado no aparece en la carta del mesero.
- El formulario valida precio negativo y nombre vacío.
- Editar el precio de un producto lo actualiza inmediatamente en la tabla.

---

## FASE 5 — Módulo de pedidos

**Objetivo:** flujo completo de gestión de pedido: abrir, agregar ítems, cobrar.

**Referencia:** `[CU]` CU-03, CU-04, CU-05 · `[HU]` HU-05, HU-06, HU-07, HU-08 · `[API]` §4, §5 · `[UI]` §3.4.

### 5.1 Capa de datos — `lib/supabase/pedidos.ts`

```typescript
import { createClient } from './server'

export async function crearPedido(mesaId: string, usuarioId: string, comensales: number) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .insert({ mesa_id: mesaId, usuario_id: usuarioId, comensales })
    .select()
    .single()
  if (error) throw error
  // Actualizar estado de la mesa
  await supabase.from('mesas').update({ estado: 'ocupada' }).eq('id', mesaId)
  return data
}

export async function getPedidoConDetalle(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pedidos')
    .select(`
      *,
      mesa:mesas(id, numero),
      items:detalle_pedido(
        *,
        producto:productos(id, nombre, categoria)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function cerrarPedido(id: string, mesaId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('pedidos')
    .update({ estado: 'cerrado', fecha_cierre: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
  await supabase.from('mesas').update({ estado: 'libre' }).eq('id', mesaId)
}
```

### 5.2 Capa de datos — `lib/supabase/detalle.ts`

```typescript
import { createClient } from './server'

export async function agregarItem(pedidoId: string, productoId: string, cantidad: number) {
  const supabase = await createClient()
  // Obtener precio actual del producto
  const { data: producto } = await supabase
    .from('productos')
    .select('precio')
    .eq('id', productoId)
    .single()
  if (!producto) throw new Error('Producto no encontrado')

  const subtotal = producto.precio * cantidad
  const { data, error } = await supabase
    .from('detalle_pedido')
    .insert({ pedido_id: pedidoId, producto_id: productoId, cantidad,
              precio_unitario: producto.precio, subtotal })
    .select()
    .single()
  if (error) throw error
  return data
  // El trigger recalcula el total del pedido automáticamente
}

export async function editarItem(id: string, cantidad: number) {
  const supabase = await createClient()
  const { data: item } = await supabase
    .from('detalle_pedido').select('precio_unitario').eq('id', id).single()
  if (!item) throw new Error('Ítem no encontrado')

  const { error } = await supabase
    .from('detalle_pedido')
    .update({ cantidad, subtotal: item.precio_unitario * cantidad })
    .eq('id', id)
  if (error) throw error
}

export async function eliminarItem(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('detalle_pedido').delete().eq('id', id)
  if (error) throw error
}
```

### 5.3 API Routes de pedidos

Implementar según `[API]` §4 y §5:
- `app/api/pedidos/route.ts` — GET y POST
- `app/api/pedidos/[id]/route.ts` — GET con detalle
- `app/api/pedidos/[id]/cerrar/route.ts` — PUT
- `app/api/pedidos/[id]/items/route.ts` — POST
- `app/api/pedidos/[id]/items/[itemId]/route.ts` — PATCH y DELETE

Cada route valida: sesión activa, pedido no cerrado antes de mutaciones, al menos un ítem antes de cerrar.

### 5.4 Página de detalle — `app/mesas/[id]/page.tsx`

Implementar el layout de dos columnas de `[UI]` §3.4:

**Panel izquierdo (`PedidoDetalle`):**
- Lista de ítems con controles `[−]` `[+]` y `[🗑]`.
- Total siempre visible y actualizado.
- Botón "Cobrar" que abre modal de confirmación.
- Deshabilitado si no hay ítems.

**Panel derecho (`AgregarItemForm`):**
- Carta filtrable por categoría.
- Botón `[+]` por producto llama a `POST /api/pedidos/[id]/items`.
- En móvil: tabs "Pedido" / "Carta" en lugar de dos columnas.

### 5.5 Modal de confirmación de cobro

```
┌──────────────────────────────────┐
│  Confirmar cobro — Mesa 3        │
│                                  │
│  Lomo saltado x2     S/64.00     │
│  Chicha morada x1     S/8.50     │
│  ─────────────────────────────── │
│  Total               S/72.50     │
│                                  │
│  [Cancelar]        [Confirmar]   │
└──────────────────────────────────┘
```

Al confirmar llama a `PUT /api/pedidos/[id]/cerrar` y redirige a `/mesas`.

**✅ Verificación de fase:**
- Abrir pedido, agregar 2 ítems: el total se calcula correctamente.
- Cambiar cantidad de un ítem: el subtotal y total se actualizan.
- Eliminar todos los ítems: el botón "Cobrar" se deshabilita.
- Cobrar: la mesa vuelve a verde en la vista de planta.
- El pedido cerrado no permite agregar ni eliminar ítems.

---

## FASE 6 — Panel de administración

**Objetivo:** historial de pedidos y reporte diario.

**Referencia:** `[CU]` CU-08, CU-09 · `[HU]` HU-12, HU-13 · `[API]` §2 (PATCH mesas) · `[UI]` §3.6.

### 6.1 Historial — `app/admin/historial/page.tsx`

Server Component con filtro de fechas (query params):
1. Lee `desde` y `hasta` de los search params (default: hoy).
2. Consulta pedidos cerrados en ese rango con JOIN a `mesas`.
3. Muestra card de total recaudado y tabla paginada.
4. Cada fila es expandible (Client Component) para ver el detalle de ítems.

```typescript
// Consulta con rango de fechas y total del día
const { data: pedidos } = await supabase
  .from('pedidos')
  .select(`*, mesa:mesas(numero), items:detalle_pedido(*, producto:productos(nombre))`)
  .eq('estado', 'cerrado')
  .gte('fecha_apertura', desde)
  .lte('fecha_apertura', hasta)
  .order('fecha_apertura', { ascending: false })
```

### 6.2 Layout de admin — `app/admin/layout.tsx`

Navbar de administración con enlaces a Productos, Mesas e Historial.
Verifica rol en el servidor (doble protección además del middleware).

### 6.3 Gestión de mesas admin — `app/admin/mesas/page.tsx`

Tabla simple con las mesas existentes y formulario para agregar nuevas.
Usa `POST /api/mesas` y `PATCH /api/mesas/[id]`.

**✅ Verificación de fase:**
- El historial del día muestra los pedidos cerrados en las fases anteriores.
- El total recaudado suma correctamente.
- Expandir un pedido muestra el detalle de ítems.
- Un mesero que accede a `/admin/historial` es redirigido a `/mesas`.

---

## FASE 7 — Pulido y datos de prueba

**Objetivo:** estados de carga, manejo de errores y experiencia completa.

### 7.1 Estados de carga

- Agregar `loading.tsx` en las rutas principales (Next.js Suspense automático).
- Los botones de acción muestran spinner y se deshabilitan mientras la request está en curso.
- Usar `useTransition` o `startTransition` en los Client Components para evitar bloqueos de UI.

### 7.2 Manejo de errores

- Agregar `error.tsx` en las rutas principales con mensaje amigable y botón "Reintentar".
- Las API Routes devuelven siempre el formato `{ error, code }` definido en `[API]`.
- Los errores de Supabase se loguean en servidor pero nunca se exponen en el cliente.

### 7.3 Empty states

Cuando no hay ítems en el pedido, productos en una categoría o pedidos en el historial, mostrar el componente `EmptyState` con icono y mensaje descriptivo en lugar de una tabla vacía.

### 7.4 Verificación final end-to-end

Ejecutar el flujo completo descrito en `[ARQ]` §5:

```
1. Login como mesero
2. Ver vista de planta → 5 mesas libres
3. Abrir pedido en Mesa 3 → 2 comensales
4. Agregar: 2× Lomo saltado + 1× Chicha morada
5. Verificar total: S/ 72.50
6. Cobrar → Mesa 3 vuelve a libre
7. Login como admin
8. Historial → ver el pedido cerrado con detalle correcto
9. Productos → desactivar "Arroz con leche"
10. Login como mesero → "Arroz con leche" no aparece en la carta
```

---

## Estructura final de archivos

Al terminar la implementación, el proyecto debe tener esta estructura (según `[ARQ]` §2):

```
restaurante/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/page.tsx
│   ├── mesas/
│   │   ├── page.tsx
│   │   └── [id]/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   ├── productos/page.tsx
│   │   ├── mesas/page.tsx
│   │   └── historial/page.tsx
│   └── api/
│       ├── auth/{login,logout}/route.ts
│       ├── mesas/route.ts
│       ├── mesas/[id]/route.ts
│       ├── productos/route.ts
│       ├── productos/[id]/route.ts
│       ├── pedidos/route.ts
│       ├── pedidos/[id]/route.ts
│       ├── pedidos/[id]/cerrar/route.ts
│       ├── pedidos/[id]/items/route.ts
│       └── pedidos/[id]/items/[itemId]/route.ts
├── components/
│   ├── ui/{Button,Card,Modal,Badge,EmptyState}.tsx
│   ├── mesas/{MesaCard,MesaGrid,AbrirPedidoModal}.tsx
│   ├── pedidos/{PedidoDetalle,AgregarItemForm,CobrarModal}.tsx
│   └── admin/{ProductoForm,HistorialTable}.tsx
├── lib/supabase/
│   ├── client.ts
│   ├── server.ts
│   ├── mesas.ts
│   ├── pedidos.ts
│   ├── detalle.ts
│   └── productos.ts
├── types/database.ts
├── middleware.ts
├── .env.local          ← no al repositorio
├── .env.example        ← sí al repositorio
└── README.md
```

---

## Checklist de entrega

- [ ] Fase 0: proyecto corriendo en `localhost:3000`
- [ ] Fase 1: schema y seed ejecutados en Supabase, RLS activo
- [ ] Fase 2: login/logout funcional, middleware protege rutas por rol
- [ ] Fase 3: vista de planta con Realtime, apertura de pedidos
- [ ] Fase 4: carta para mesero, CRUD de productos para admin
- [ ] Fase 5: agregar, editar, eliminar ítems y cobrar pedido
- [ ] Fase 6: historial con filtro de fechas y total del día
- [ ] Fase 7: estados de carga, errores y flujo end-to-end verificado
- [ ] `README.md` con instrucciones de instalación
- [ ] `.env.example` en el repositorio (sin valores reales)
