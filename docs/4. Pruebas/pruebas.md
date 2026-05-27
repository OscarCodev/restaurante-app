# Pruebas — Sistema de restaurante

**Framework:** Jest + ts-jest  
**Tipo de pruebas:** Unitarias (con mocks de repositorios e infraestructura)  
**Ubicación:** `__tests__/unit/`  
**Fecha:** Mayo 2026

---
npm test
npm run test:coverage

## Visión general

Todas las pruebas son **unitarias** y siguen el mismo patrón: los repositorios de infraestructura (Supabase) se reemplazan por `jest.fn()` para que cada test valide únicamente la lógica de la capa que se prueba, sin tocar la base de datos ni la red.

| Capa | Archivos de test | Foco |
|---|---|---|
| Domain | `domain/errors.test.ts` | Jerarquía y contratos de errores de dominio |
| Application | `application/mesas.test.ts` | Casos de uso de mesas |
| Application | `application/pedidos.test.ts` | Casos de uso de pedidos |
| Application | `application/detalle.test.ts` | Casos de uso de detalle de pedido |
| Application | `application/cancelar-pedido.test.ts` | Cancelación de pedidos vacíos |
| Application | `application/productos.test.ts` | Casos de uso de productos |
| Lib | `lib/validaciones.test.ts` | Esquemas Zod de validación de inputs |
| Lib | `lib/calculos.test.ts` | Cálculos de subtotales, totales y formato de precio |
| Lib | `lib/mapError.test.ts` | Conversión de errores de dominio a respuestas HTTP |
| API Routes | `api/mesas.test.ts` | Adaptadores HTTP para mesas |
| API Routes | `api/pedidos.test.ts` | Adaptadores HTTP para pedidos (colección) |
| API Routes | `api/pedidos-id.test.ts` | Adaptadores HTTP para pedido individual e ítems |
| API Routes | `api/productos.test.ts` | Adaptadores HTTP para productos |

---

## 1. Domain — Errores de dominio

**Archivo:** `__tests__/unit/domain/errors.test.ts`

Verifica que la jerarquía de errores tipados funcione correctamente y que cada error transmita el `code` y `message` esperados.

| Clase | Qué se prueba |
|---|---|
| `DomainError` (base) | Es instancia de `Error`; expone `code` y `message`; tiene `name = 'DomainError'` |
| `NotFoundError` | `code = 'NOT_FOUND'`; hereda de `DomainError`; propaga el mensaje |
| `ConflictError` | Acepta code personalizado en constructor; hereda de `DomainError` |
| `ValidationError` | `code = 'VALIDATION_ERROR'`; propaga el mensaje |
| `ForbiddenError` | `code = 'FORBIDDEN'`; hereda de `DomainError` |
| `UnauthorizedError` | `code = 'UNAUTHORIZED'`; hereda de `DomainError` |

---

## 2. Application — Casos de uso de mesas

**Archivo:** `__tests__/unit/application/mesas.test.ts`  
**Casos de uso cubiertos:** CU-01, CU-08

### `GetMesasConEstado`
- Devuelve todas las mesas con `pedido_activo_id = null` cuando no hay pedidos abiertos
- Asigna `pedido_activo_id` a la mesa que tiene un pedido abierto
- Expone la inconsistencia cuando `mesas.estado = 'libre'` pero existe un pedido abierto
- Preserva todos los campos originales de la mesa
- Consulta mesas y pedidos abiertos en paralelo (1 llamada a cada repo)
- Devuelve array vacío cuando no hay mesas

### `CrearMesa`
- Delega a `mesaRepo.create()` con número y capacidad correctos
- Retorna la mesa creada tal como la devuelve el repo

### `EditarMesa`
- Lanza `NotFoundError` si la mesa no existe
- Llama a `mesaRepo.update()` con id y nueva capacidad
- No llama a `update()` si `findById()` devuelve `null`

---

## 3. Application — Casos de uso de pedidos

**Archivo:** `__tests__/unit/application/pedidos.test.ts`  
**Casos de uso cubiertos:** CU-02, CU-05, CU-09

### `CrearPedido`
- Crea el pedido cuando la mesa existe, está libre y hay capacidad
- Lanza `NotFoundError` si la mesa no existe
- Lanza `ConflictError (MESA_OCUPADA)` si la mesa ya está ocupada
- Lanza `ValidationError` si los comensales superan la capacidad
- Acepta exactamente el número máximo de comensales (límite exacto)

### `CerrarPedido`
- Cierra el pedido con ítems y retorna `PedidoConDetalle`
- Lanza `NotFoundError` si el pedido no existe
- Lanza `ConflictError` si el pedido ya está cerrado
- Lanza `ValidationError` si el pedido no tiene ítems
- Consulta `countByPedido` con el `pedidoId` correcto

### `GetHistorial`
- Llama a `findAllConDetalle` con `estado = 'cerrado'`, fechas y `esAdmin = true`
- Devuelve la lista de pedidos con datos de mesa e ítems

### `GetPedidoConDetalle`
- Delega a `repo.findConDetalle()` con el id correcto
- Devuelve `null` si el pedido no existe

### `GetPedidos`
- Delega a `repo.findAll()` con los filtros pasados
- Devuelve array vacío cuando no hay pedidos

---

## 4. Application — Casos de uso de detalle

**Archivo:** `__tests__/unit/application/detalle.test.ts`  
**Casos de uso cubiertos:** CU-03, CU-04

### `AgregarItem`
- Agrega el ítem cuando el producto existe y está activo
- Lanza `NotFoundError` si el producto no existe
- Lanza `ValidationError` si el producto está inactivo
- Normaliza el precio con `Number()` (por si Supabase lo devuelve como string)
- Pasa la cantidad indicada correctamente a `addOrUpdate()`

### `EditarItem`
- Delega a `detalleRepo.update()` con id y nueva cantidad
- Retorna el ítem actualizado tal como lo devuelve el repo

### `EliminarItem`
- Delega a `detalleRepo.delete()` con el id del ítem
- Eliminar el último ítem no cierra el pedido (esa responsabilidad es de `CerrarPedido`)

---

## 5. Application — Cancelar pedido

**Archivo:** `__tests__/unit/application/cancelar-pedido.test.ts`

Cubre el flujo de cancelación de un pedido **vacío** (sin ítems), que libera la mesa sin pasar por el flujo de cobro.

- Cancela un pedido vacío llamando a `pedidoRepo.close()`
- Lanza `NotFoundError` si el pedido no existe
- Lanza `ConflictError` si el pedido ya está cerrado
- Lanza `ConflictError (FORBIDDEN)` si el mesero no es dueño del pedido
- El admin puede cancelar el pedido de cualquier mesero (`esAdmin = true`)
- Lanza `ValidationError` si el pedido tiene ítems (debe usarse `CerrarPedido`)

---

## 6. Application — Casos de uso de productos

**Archivo:** `__tests__/unit/application/productos.test.ts`  
**Casos de uso cubiertos:** CU-06, CU-07

### `GetProductos`
- Por defecto solicita solo productos activos (`soloActivos = true`)
- Acepta `soloActivos = false` para obtener todos los productos
- Devuelve la lista tal como la retorna el repo
- Devuelve array vacío si no hay productos activos

### `CrearProducto`
- Delega a `productoRepo.create()` con los datos correctos
- Retorna el producto creado con `id`, `activo` y `created_at` asignados por el repo

### `EditarProducto`
- Lanza `NotFoundError` si el producto no existe
- Llama a `productoRepo.update()` con id y datos parciales
- No llama a `update()` si `findById()` devuelve `null`
- Permite actualizar el campo `activo` para desactivar un producto

---

## 7. Lib — Validaciones (Zod)

**Archivo:** `__tests__/unit/lib/validaciones.test.ts`

Prueba el esquema `productoSchema` usado en los API routes para validar el body de las requests.

| Escenario | Resultado esperado |
|---|---|
| Producto completo y correcto | `success = true` |
| Producto sin descripción (campo opcional) | `success = true` |
| Nombre vacío | `success = false` — "El nombre es requerido" |
| Precio = 0 | `success = false` |
| Precio negativo | `success = false` |
| Precio decimal válido (3.50) | `success = true` |
| Categoría no contemplada (ej. "desayuno") | `success = false` |
| Categorías válidas: `entrada`, `principal`, `bebida`, `postre` | `success = true` |

---

## 8. Lib — Cálculos

**Archivo:** `__tests__/unit/lib/calculos.test.ts`

| Función | Casos probados |
|---|---|
| `calcularSubtotal(cantidad, precio)` | Multiplicación básica; decimales sin error de punto flotante; cantidad = 0 devuelve 0 |
| `calcularTotalPedido(items)` | Suma de múltiples subtotales; pedido sin ítems devuelve 0; ítem único |
| `formatearPrecio(numero)` | Formato `S/ 32.00`; decimales correctos `S/ 8.50` |

---

## 9. Lib — mapError (errores HTTP)

**Archivo:** `__tests__/unit/lib/mapError.test.ts`

Verifica que `mapDomainError()` convierta cada tipo de error en el código HTTP correcto.

| Error de dominio | HTTP esperado | Code en body |
|---|---|---|
| `NotFoundError` | 404 | `NOT_FOUND` |
| `ConflictError (MESA_OCUPADA)` | 409 | `MESA_OCUPADA` |
| `ConflictError (CONFLICT)` | 409 | `CONFLICT` |
| `ValidationError` | 400 | `VALIDATION_ERROR` |
| `ForbiddenError` | 403 | `FORBIDDEN` |
| `UnauthorizedError` | 401 | `UNAUTHORIZED` |
| `DomainError` con code desconocido | 500 | el code pasado |
| `Error` genérico de JS | 500 | `INTERNAL_ERROR` |
| String lanzado | 500 | `INTERNAL_ERROR` |
| `null` lanzado | 500 | `INTERNAL_ERROR` |

---

## 10. API Routes — Mesas

**Archivo:** `__tests__/unit/api/mesas.test.ts`  
**Rutas cubiertas:** `GET /api/mesas`, `POST /api/mesas`, `PATCH /api/mesas/[id]`

| Ruta | Escenario | HTTP |
|---|---|---|
| `GET /api/mesas` | Sin autenticación | 401 |
| `GET /api/mesas` | Autenticado | 200 + lista |
| `POST /api/mesas` | Sin autenticación | 401 |
| `POST /api/mesas` | Rol mesero (sin permiso) | 403 |
| `POST /api/mesas` | Datos inválidos | 400 |
| `POST /api/mesas` | Rol admin + datos válidos | 201 + mesa |
| `PATCH /api/mesas/[id]` | Sin autenticación | 401 |
| `PATCH /api/mesas/[id]` | Rol mesero | 403 |
| `PATCH /api/mesas/[id]` | Capacidad inválida | 400 |
| `PATCH /api/mesas/[id]` | Mesa no existe | 404 |
| `PATCH /api/mesas/[id]` | Datos válidos | 200 + mesa actualizada |

---

## 11. API Routes — Pedidos (colección)

**Archivo:** `__tests__/unit/api/pedidos.test.ts`  
**Rutas cubiertas:** `GET /api/pedidos`, `POST /api/pedidos`

| Ruta | Escenario | HTTP |
|---|---|---|
| `GET /api/pedidos` | Sin autenticación | 401 |
| `GET /api/pedidos` | Autenticado | 200 + lista |
| `POST /api/pedidos` | Sin autenticación | 401 |
| `POST /api/pedidos` | Body inválido (UUID mal formado) | 400 |
| `POST /api/pedidos` | Mesa no encontrada | 404 |
| `POST /api/pedidos` | Mesa ocupada | 409 |
| `POST /api/pedidos` | Datos válidos | 201 + pedido |

---

## 12. API Routes — Pedido individual e ítems

**Archivo:** `__tests__/unit/api/pedidos-id.test.ts`  
**Rutas cubiertas:** `GET`, `PUT /cerrar`, `POST /items`, `PATCH /items/[id]`, `DELETE /items/[id]`

| Ruta | Escenario | HTTP |
|---|---|---|
| `GET /api/pedidos/[id]` | Sin autenticación | 401 |
| `GET /api/pedidos/[id]` | Pedido no existe | 404 |
| `GET /api/pedidos/[id]` | Mesero sin acceso al pedido ajeno | 403 |
| `GET /api/pedidos/[id]` | Autenticado y con permiso | 200 + detalle |
| `PUT /api/pedidos/[id]/cerrar` | Sin autenticación | 401 |
| `PUT /api/pedidos/[id]/cerrar` | Pedido no existe | 404 |
| `PUT /api/pedidos/[id]/cerrar` | Pedido ya cerrado | 409 |
| `PUT /api/pedidos/[id]/cerrar` | Sin ítems | 400 |
| `PUT /api/pedidos/[id]/cerrar` | Válido | 200 + pedido cerrado |
| `POST /api/pedidos/[id]/items` | Sin autenticación | 401 |
| `POST /api/pedidos/[id]/items` | Pedido cerrado | 409 |
| `POST /api/pedidos/[id]/items` | Producto no encontrado | 404 |
| `POST /api/pedidos/[id]/items` | Válido | 201 + ítem |
| `PATCH /api/pedidos/[id]/items/[id]` | Sin autenticación | 401 |
| `PATCH /api/pedidos/[id]/items/[id]` | Cantidad inválida | 400 |
| `PATCH /api/pedidos/[id]/items/[id]` | Válido | 200 + ítem actualizado |
| `DELETE /api/pedidos/[id]/items/[id]` | Sin autenticación | 401 |
| `DELETE /api/pedidos/[id]/items/[id]` | Válido | 200 `{ ok: true }` |

---

## 13. API Routes — Productos

**Archivo:** `__tests__/unit/api/productos.test.ts`  
**Rutas cubiertas:** `GET /api/productos`, `POST /api/productos`, `PATCH /api/productos/[id]`

| Ruta | Escenario | HTTP |
|---|---|---|
| `GET /api/productos` | Sin autenticación | 401 |
| `GET /api/productos` | Autenticado | 200 + lista |
| `POST /api/productos` | Sin autenticación | 401 |
| `POST /api/productos` | Rol mesero | 403 |
| `POST /api/productos` | Datos inválidos | 400 |
| `POST /api/productos` | Rol admin + datos válidos | 201 + producto |
| `PATCH /api/productos/[id]` | Sin autenticación | 401 |
| `PATCH /api/productos/[id]` | Rol mesero | 403 |
| `PATCH /api/productos/[id]` | Producto no existe | 404 |
| `PATCH /api/productos/[id]` | Datos válidos | 200 + producto actualizado |

---

## Estrategia de mocking

Todos los tests de API Routes utilizan tres mocks:

```
jest.mock('@/infrastructure/auth/getCurrentUser')  → simula sesión/usuario
jest.mock('@/container')                           → simula casos de uso
jest.mock('@/infrastructure/supabase/server')      → evita conexión real a Supabase
```

Los tests de Application usan mocks de repositorios creados con funciones `makeMock*Repo()`, que devuelven objetos con todos los métodos de la interfaz como `jest.fn()`. Esto permite controlar exactamente qué devuelve cada método y verificar con qué argumentos fue llamado.
