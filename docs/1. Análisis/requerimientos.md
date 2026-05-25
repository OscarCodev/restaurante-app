# Requerimientos del sistema — Restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js + Supabase  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## 1. Requerimientos funcionales

### RF-01 — Gestión de mesas
- RF-01.1 El sistema debe mostrar el estado de todas las mesas (libre / ocupada).
- RF-01.2 El mesero puede cambiar el estado de una mesa al abrir o cerrar un pedido.
- RF-01.3 El sistema debe mostrar cuántas personas hay en cada mesa ocupada.

### RF-02 — Gestión de productos (carta)
- RF-02.1 El administrador puede agregar, editar y eliminar productos.
- RF-02.2 Cada producto tiene nombre, descripción, precio y categoría (entrada, plato principal, bebida, postre).
- RF-02.3 El administrador puede activar o desactivar un producto sin eliminarlo.
- RF-02.4 Los productos inactivos no aparecen en la carta del mesero.

### RF-03 — Gestión de pedidos
- RF-03.1 El mesero puede abrir un pedido asociado a una mesa.
- RF-03.2 El mesero puede agregar productos al pedido especificando cantidad.
- RF-03.3 El mesero puede eliminar o modificar ítems de un pedido abierto.
- RF-03.4 El sistema calcula automáticamente el subtotal por ítem y el total del pedido.
- RF-03.5 El mesero puede cerrar (cobrar) un pedido; al hacerlo la mesa vuelve a estado libre.
- RF-03.6 El sistema debe registrar la hora de apertura y cierre de cada pedido.

### RF-04 — Roles de usuario
- RF-04.1 Existen dos roles: **administrador** y **mesero**.
- RF-04.2 El administrador tiene acceso completo (productos, mesas, pedidos, historial).
- RF-04.3 El mesero solo puede gestionar pedidos activos y ver la carta.

### RF-05 — Historial
- RF-05.1 El administrador puede consultar pedidos cerrados filtrados por fecha.
- RF-05.2 Cada pedido cerrado muestra el detalle completo de ítems y el total cobrado.

---

## 2. Requerimientos no funcionales

### RNF-01 — Rendimiento
- Las páginas principales deben cargar en menos de 2 segundos.
- Las operaciones de lectura a Supabase no deben superar 500 ms.

### RNF-02 — Seguridad
- Autenticación mediante Supabase Auth (email + contraseña).
- Las rutas de administrador deben estar protegidas por middleware en Next.js.
- Row Level Security (RLS) habilitado en todas las tablas de Supabase.

### RNF-03 — Usabilidad
- La interfaz debe ser operable desde una tablet (responsive ≥ 768 px).
- Los flujos principales (abrir pedido → agregar ítem → cobrar) deben completarse en ≤ 3 pantallas.

### RNF-04 — Disponibilidad
- El sistema debe estar disponible durante el horario de atención del restaurante (asumido 7 días × 12 horas).
- Se acepta un tiempo de inactividad planificado máximo de 1 hora/semana para mantenimiento.

### RNF-05 — Mantenibilidad
- El código debe seguir la convención de Next.js App Router.
- Las funciones de acceso a datos deben estar centralizadas en una capa `/lib/supabase/`.

---

## 3. Restricciones

| # | Restricción |
|---|---|
| R-01 | El frontend debe desarrollarse con Next.js 14+ (App Router). |
| R-02 | La base de datos debe estar alojada en Supabase (PostgreSQL). |
| R-03 | No se contempla integración con sistemas de pago en v1. |
| R-04 | No se incluye módulo de cocina (pantalla de comandas) en v1. |
| R-05 | El sistema es monorestaurante (no multi-sucursal). |

---

## 4. Actores del sistema

| Actor | Descripción |
|---|---|
| Mesero | Gestiona pedidos activos desde la sala. |
| Administrador | Configura el sistema, consulta historial y gestiona la carta. |
| Sistema (Supabase) | Ejecuta reglas de seguridad, dispara funciones y persiste datos. |
