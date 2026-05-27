# Diseño de API — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 16 API Routes + Supabase  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## Convenciones generales

- **Base URL:** `/api`
- **Formato:** JSON (`Content-Type: application/json`)
- **Autenticación:** Cookie de sesión de Supabase (httpOnly). Todas las rutas requieren sesión activa salvo `/api/auth`.
- **Errores:** Todas las respuestas de error siguen el mismo formato:

```json
{
  "error": "Descripción legible del error",
  "code": "CODIGO_ERROR"
}
```

**Códigos de estado usados:**

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Creado |
| 400 | Datos inválidos |
| 401 | No autenticado |
| 403 | Sin permisos |
| 404 | Recurso no encontrado |
| 409 | Conflicto de estado |
| 500 | Error interno |

---

## 1. Autenticación

### `POST /api/auth/login`

Inicia sesión y setea la cookie de sesión.

**Roles permitidos:** Público

**Body:**
```json
{
  "email": "mesero@restaurante.com",
  "password": "secreto123"
}
```

**Respuesta 200:**
```json
{
  "usuario": {
    "id": "uuid",
    "nombre": "Carlos Quispe",
    "rol": "mesero"
  }
}
```

**Errores:**
- `401` — Credenciales incorrectas

---

### `POST /api/auth/logout`

Cierra sesión e invalida la cookie.

**Roles permitidos:** Autenticado

**Respuesta 200:**
```json
{ "ok": true }
```

---

## 2. Mesas

### `GET /api/mesas`

Devuelve todas las mesas con su estado actual.

**Roles permitidos:** Mesero, Admin

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "numero": 1,
    "capacidad": 4,
    "estado": "ocupada",
    "pedido_activo_id": "uuid"
  },
  {
    "id": "uuid",
    "numero": 2,
    "capacidad": 2,
    "estado": "libre",
    "pedido_activo_id": null
  }
]
```

---

### `POST /api/mesas` *(solo admin)*

Crea una nueva mesa.

**Roles permitidos:** Admin

**Body:**
```json
{
  "numero": 5,
  "capacidad": 6
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "numero": 5,
  "capacidad": 6,
  "estado": "libre"
}
```

**Errores:**
- `400` — Número de mesa ya existe
- `403` — No es admin

---

### `PATCH /api/mesas/[id]` *(solo admin)*

Edita capacidad de una mesa.

**Roles permitidos:** Admin

**Body:**
```json
{
  "capacidad": 8
}
```

**Respuesta 200:** Mesa actualizada.

---

## 3. Productos

### `GET /api/productos`

Devuelve productos. Los meseros ven solo los activos; los admins ven todos.

**Roles permitidos:** Mesero, Admin

**Query params opcionales:**
- `categoria` — filtra por categoría (`entrada`, `principal`, `bebida`, `postre`)
- `todos` — si es `true` y el usuario es admin, incluye inactivos

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "nombre": "Lomo saltado",
    "descripcion": "Clásico peruano con papas fritas",
    "precio": 32.00,
    "categoria": "principal",
    "activo": true
  }
]
```

---

### `POST /api/productos` *(solo admin)*

Crea un nuevo producto.

**Roles permitidos:** Admin

**Body:**
```json
{
  "nombre": "Chicha morada",
  "descripcion": "Bebida tradicional",
  "precio": 8.00,
  "categoria": "bebida"
}
```

**Respuesta 201:** Producto creado.

**Errores:**
- `400` — Precio ≤ 0 o campos requeridos vacíos

---

### `PATCH /api/productos/[id]` *(solo admin)*

Edita nombre, precio, descripción o estado activo.

**Roles permitidos:** Admin

**Body (todos los campos son opcionales):**
```json
{
  "nombre": "Chicha morada grande",
  "precio": 10.00,
  "activo": false
}
```

**Respuesta 200:** Producto actualizado.

---

## 4. Pedidos

### `GET /api/pedidos`

Devuelve pedidos. Los meseros ven solo los suyos; los admins ven todos.

**Roles permitidos:** Mesero, Admin

**Query params opcionales:**
- `estado` — `abierto` | `cerrado`
- `desde` — fecha ISO (ej. `2026-05-01`)
- `hasta` — fecha ISO

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "mesa": { "id": "uuid", "numero": 3 },
    "estado": "abierto",
    "total": 72.50,
    "comensales": 2,
    "fecha_apertura": "2026-05-23T19:30:00Z",
    "fecha_cierre": null
  }
]
```

---

### `POST /api/pedidos`

Abre un nuevo pedido en una mesa libre.

**Roles permitidos:** Mesero, Admin

**Body:**
```json
{
  "mesa_id": "uuid",
  "comensales": 3
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "mesa_id": "uuid",
  "estado": "abierto",
  "total": 0,
  "comensales": 3,
  "fecha_apertura": "2026-05-23T19:45:00Z"
}
```

**Errores:**
- `409` — La mesa ya está ocupada

---

### `GET /api/pedidos/[id]`

Devuelve el pedido con su detalle completo.

**Roles permitidos:** Mesero (propio), Admin

**Respuesta 200:**
```json
{
  "id": "uuid",
  "mesa": { "id": "uuid", "numero": 3 },
  "estado": "abierto",
  "total": 72.50,
  "comensales": 2,
  "fecha_apertura": "2026-05-23T19:30:00Z",
  "fecha_cierre": null,
  "items": [
    {
      "id": "uuid",
      "producto": {
        "id": "uuid",
        "nombre": "Lomo saltado",
        "categoria": "principal"
      },
      "cantidad": 2,
      "precio_unitario": 32.00,
      "subtotal": 64.00
    },
    {
      "id": "uuid",
      "producto": {
        "id": "uuid",
        "nombre": "Chicha morada",
        "categoria": "bebida"
      },
      "cantidad": 1,
      "precio_unitario": 8.50,
      "subtotal": 8.50
    }
  ]
}
```

---

### `PUT /api/pedidos/[id]/cerrar`

Cierra el pedido y libera la mesa.

**Roles permitidos:** Mesero (propio), Admin

**Body:** vacío

**Respuesta 200:**
```json
{
  "id": "uuid",
  "estado": "cerrado",
  "total": 72.50,
  "fecha_cierre": "2026-05-23T21:10:00Z"
}
```

**Errores:**
- `400` — El pedido no tiene ítems
- `409` — El pedido ya está cerrado

---

## 5. Ítems del pedido

### `POST /api/pedidos/[id]/items`

Agrega un producto al pedido.

**Roles permitidos:** Mesero (propio), Admin

**Body:**
```json
{
  "producto_id": "uuid",
  "cantidad": 2
}
```

**Respuesta 201:**
```json
{
  "id": "uuid",
  "pedido_id": "uuid",
  "producto_id": "uuid",
  "cantidad": 2,
  "precio_unitario": 32.00,
  "subtotal": 64.00
}
```

**Errores:**
- `400` — Cantidad < 1 o producto inactivo
- `409` — El pedido está cerrado

---

### `PATCH /api/pedidos/[id]/items/[itemId]`

Modifica la cantidad de un ítem.

**Roles permitidos:** Mesero (propio), Admin

**Body:**
```json
{
  "cantidad": 3
}
```

**Respuesta 200:** Ítem actualizado con nuevo subtotal.

**Errores:**
- `400` — Cantidad < 1
- `409` — El pedido está cerrado

---

### `DELETE /api/pedidos/[id]/items/[itemId]`

Elimina un ítem del pedido.

**Roles permitidos:** Mesero (propio), Admin

**Respuesta 200:**
```json
{ "ok": true }
```

**Errores:**
- `409` — El pedido está cerrado

---

## 6. Resumen de endpoints

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | Público | Iniciar sesión |
| POST | `/api/auth/logout` | Auth | Cerrar sesión |
| GET | `/api/mesas` | Mesero, Admin | Listar mesas |
| POST | `/api/mesas` | Admin | Crear mesa |
| PATCH | `/api/mesas/[id]` | Admin | Editar mesa |
| GET | `/api/productos` | Mesero, Admin | Listar productos |
| POST | `/api/productos` | Admin | Crear producto |
| PATCH | `/api/productos/[id]` | Admin | Editar producto |
| GET | `/api/pedidos` | Mesero, Admin | Listar pedidos |
| POST | `/api/pedidos` | Mesero, Admin | Abrir pedido |
| GET | `/api/pedidos/[id]` | Mesero, Admin | Ver pedido con detalle |
| PUT | `/api/pedidos/[id]/cerrar` | Mesero, Admin | Cerrar pedido |
| POST | `/api/pedidos/[id]/items` | Mesero, Admin | Agregar ítem |
| PATCH | `/api/pedidos/[id]/items/[itemId]` | Mesero, Admin | Modificar ítem |
| DELETE | `/api/pedidos/[id]/items/[itemId]` | Mesero, Admin | Eliminar ítem |
