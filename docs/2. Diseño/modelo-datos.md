# Modelo de datos — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 16 + Supabase (PostgreSQL)  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## 1. Diagrama entidad-relación

```
┌──────────────┐        ┌──────────────────┐        ┌───────────────┐
│    mesas     │        │     pedidos      │        │   productos   │
│──────────────│        │──────────────────│        │───────────────│
│ id (PK)      │1      N│ id (PK)          │        │ id (PK)       │
│ numero       │────────│ mesa_id (FK)     │        │ nombre        │
│ capacidad    │        │ usuario_id (FK)  │        │ descripcion   │
│ estado       │        │ estado           │        │ precio        │
│ created_at   │        │ total            │        │ categoria     │
└──────────────┘        │ fecha_apertura   │        │ activo        │
                        │ fecha_cierre     │        │ created_at    │
┌──────────────┐1      N│ created_at       │        └───────────────┘
│   usuarios   │────────│                  │               │1
│──────────────│        └──────────────────┘               │
│ id (PK)      │                 │1                        │N
│ nombre       │                 │                 ┌───────────────────┐
│ email        │                 │N                │  detalle_pedido   │
│ rol          │        ┌────────┴────────┐        │───────────────────│
│ created_at   │        │ detalle_pedido  │────────│ id (PK)           │
└──────────────┘        │ pedido_id (FK)  │        │ pedido_id (FK)    │
                        │ producto_id(FK) │        │ producto_id (FK)  │
                        │ cantidad        │        │ cantidad          │
                        │ precio_unitario │        │ precio_unitario   │
                        │ subtotal        │        │ subtotal          │
                        └─────────────────┘        └───────────────────┘
```

**Cardinalidades:**
- Una `mesa` tiene N `pedidos` (a lo largo del tiempo).
- Un `pedido` tiene N `detalle_pedido`.
- Un `producto` aparece en N `detalle_pedido`.
- Un `usuario` crea N `pedidos`.

---

## 2. Definición de tablas

### 2.1 `mesas`

Representa las mesas físicas del restaurante.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `numero` | `integer` | NOT NULL, UNIQUE | Número visible de la mesa |
| `capacidad` | `integer` | NOT NULL, CHECK ≥ 1 | Cantidad máxima de comensales |
| `estado` | `text` | NOT NULL, default `'libre'` | `libre` \| `ocupada` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |

```sql
CREATE TABLE mesas (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero     integer NOT NULL UNIQUE,
  capacidad  integer NOT NULL CHECK (capacidad >= 1),
  estado     text    NOT NULL DEFAULT 'libre'
               CHECK (estado IN ('libre', 'ocupada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

### 2.2 `productos`

Carta del restaurante.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `nombre` | `text` | NOT NULL | Nombre del plato o bebida |
| `descripcion` | `text` | | Descripción opcional |
| `precio` | `numeric(10,2)` | NOT NULL, CHECK > 0 | Precio en soles (PEN) |
| `categoria` | `text` | NOT NULL | `entrada` \| `principal` \| `bebida` \| `postre` |
| `activo` | `boolean` | NOT NULL, default `true` | Si aparece en la carta |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |

```sql
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
```

---

### 2.3 `pedidos`

Cabecera de cada pedido realizado en una mesa.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `mesa_id` | `uuid` | FK → `mesas.id`, NOT NULL | Mesa donde se realizó |
| `usuario_id` | `uuid` | FK → `auth.users.id`, NOT NULL | Mesero que abrió el pedido |
| `estado` | `text` | NOT NULL, default `'abierto'` | `abierto` \| `cerrado` |
| `total` | `numeric(10,2)` | NOT NULL, default `0` | Suma de subtotales |
| `comensales` | `integer` | NOT NULL, CHECK ≥ 1 | Número de personas |
| `fecha_apertura` | `timestamptz` | NOT NULL, default `now()` | Hora de apertura |
| `fecha_cierre` | `timestamptz` | | Hora de cierre (null si abierto) |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |

```sql
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
```

---

### 2.4 `detalle_pedido`

Ítems individuales dentro de un pedido.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` | Identificador único |
| `pedido_id` | `uuid` | FK → `pedidos.id`, NOT NULL | Pedido al que pertenece |
| `producto_id` | `uuid` | FK → `productos.id`, NOT NULL | Producto solicitado |
| `cantidad` | `integer` | NOT NULL, CHECK ≥ 1 | Unidades pedidas |
| `precio_unitario` | `numeric(10,2)` | NOT NULL, CHECK > 0 | Precio al momento del pedido |
| `subtotal` | `numeric(10,2)` | NOT NULL | `cantidad × precio_unitario` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |

```sql
CREATE TABLE detalle_pedido (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid          NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id     uuid          NOT NULL REFERENCES productos(id),
  cantidad        integer       NOT NULL CHECK (cantidad >= 1),
  precio_unitario numeric(10,2) NOT NULL CHECK (precio_unitario > 0),
  subtotal        numeric(10,2) NOT NULL,
  created_at      timestamptz   NOT NULL DEFAULT now()
);
```

> **Nota:** `precio_unitario` se copia del producto en el momento de insertar el ítem, para preservar el precio histórico aunque el producto sea editado posteriormente.

---

### 2.5 `perfiles` (extensión de `auth.users`)

Almacena el rol del usuario, complementando la tabla de autenticación de Supabase.

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users.id` | Mismo ID que Supabase Auth |
| `nombre` | `text` | NOT NULL | Nombre para mostrar |
| `rol` | `text` | NOT NULL, default `'mesero'` | `mesero` \| `admin` |
| `created_at` | `timestamptz` | NOT NULL, default `now()` | Fecha de creación |

```sql
CREATE TABLE perfiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     text NOT NULL,
  rol        text NOT NULL DEFAULT 'mesero'
               CHECK (rol IN ('mesero', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 3. Índices recomendados

```sql
-- Consultas frecuentes de pedidos por mesa
CREATE INDEX idx_pedidos_mesa_id    ON pedidos(mesa_id);

-- Filtro de historial por fecha
CREATE INDEX idx_pedidos_fecha      ON pedidos(fecha_apertura);

-- Detalle de pedido por pedido
CREATE INDEX idx_detalle_pedido_id  ON detalle_pedido(pedido_id);

-- Carta: solo productos activos
CREATE INDEX idx_productos_activo   ON productos(activo);
```

---

## 4. Row Level Security (RLS)

Políticas base para Supabase:

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE mesas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalle_pedido  ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles        ENABLE ROW LEVEL SECURITY;

-- Todos los usuarios autenticados pueden leer mesas y productos
CREATE POLICY "leer mesas"     ON mesas      FOR SELECT TO authenticated USING (true);
CREATE POLICY "leer productos" ON productos  FOR SELECT TO authenticated USING (activo = true);

-- Solo admin puede insertar/editar productos y mesas
CREATE POLICY "admin productos" ON productos FOR ALL
  TO authenticated
  USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin');

-- Mesero puede ver sus propios pedidos; admin ve todos
CREATE POLICY "ver pedidos" ON pedidos FOR SELECT TO authenticated
  USING (
    usuario_id = auth.uid()
    OR (SELECT rol FROM perfiles WHERE id = auth.uid()) = 'admin'
  );
```

---

## 5. Trigger: recalcular total del pedido

```sql
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
```
