# Historias de usuario — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js + Supabase  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## Convención

Cada historia sigue el formato:

> **Como** [rol], **quiero** [acción], **para** [beneficio].

Los criterios de aceptación usan el formato **dado / cuando / entonces**.  
La prioridad sigue el esquema MoSCoW: **M** = Must, **S** = Should, **C** = Could, **W** = Won't (v1).

---

## Épica 1 — Autenticación

### HU-01 — Iniciar sesión

> **Como** mesero o administrador, **quiero** iniciar sesión con mi email y contraseña, **para** acceder al sistema de forma segura.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que estoy en `/login` y tengo credenciales válidas,  
  **cuando** envío el formulario,  
  **entonces** el sistema me autentica y me redirige a la vista principal según mi rol.

- **Dado** que ingreso una contraseña incorrecta,  
  **cuando** envío el formulario,  
  **entonces** el sistema muestra el mensaje "Email o contraseña inválidos" sin revelar cuál dato es incorrecto.

- **Dado** que cierro el navegador sin cerrar sesión,  
  **cuando** vuelvo a abrir la aplicación,  
  **entonces** el sistema mantiene mi sesión activa (token no expirado).

---

### HU-02 — Cerrar sesión

> **Como** cualquier usuario autenticado, **quiero** cerrar sesión, **para** que nadie más pueda usar el sistema desde mi dispositivo.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que pulso "Cerrar sesión",  
  **cuando** el sistema procesa la acción,  
  **entonces** invalida la sesión en Supabase y me redirige a `/login`.

---

## Épica 2 — Gestión de mesas (Mesero)

### HU-03 — Ver estado de mesas

> **Como** mesero, **quiero** ver el estado de todas las mesas de un vistazo, **para** saber dónde hay clientes esperando o mesas disponibles.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que accedo a la pantalla principal,  
  **cuando** el sistema carga,  
  **entonces** veo todas las mesas con color diferenciado: verde (libre) y rojo (ocupada).

- **Dado** que una mesa está ocupada,  
  **cuando** la veo en la vista de planta,  
  **entonces** muestra el tiempo transcurrido desde que se abrió el pedido.

---

### HU-04 — Abrir pedido en una mesa

> **Como** mesero, **quiero** abrir un pedido en una mesa libre, **para** empezar a registrar lo que piden los clientes.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que selecciono una mesa libre,  
  **cuando** confirmo la apertura,  
  **entonces** el sistema crea el pedido, la mesa pasa a ocupada y veo la carta para agregar ítems.

- **Dado** que intento abrir un pedido en una mesa ya ocupada,  
  **cuando** el sistema detecta el conflicto,  
  **entonces** muestra un error y no crea el pedido.

---

### HU-05 — Agregar productos al pedido

> **Como** mesero, **quiero** agregar productos de la carta al pedido activo, **para** registrar exactamente lo que pidieron los clientes.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que estoy en el detalle de un pedido abierto,  
  **cuando** selecciono un producto y especifico cantidad,  
  **entonces** el ítem aparece en el pedido y el total se actualiza automáticamente.

- **Dado** que selecciono un producto con cantidad 0 o negativa,  
  **cuando** intento agregarlo,  
  **entonces** el sistema muestra un error de validación.

---

### HU-06 — Modificar cantidad de un ítem

> **Como** mesero, **quiero** cambiar la cantidad de un ítem ya agregado, **para** corregir errores sin tener que eliminar y volver a agregar el producto.

**Prioridad:** S

**Criterios de aceptación:**

- **Dado** que hay un ítem en el pedido,  
  **cuando** cambio su cantidad a un valor válido (≥ 1),  
  **entonces** el subtotal del ítem y el total del pedido se recalculan.

---

### HU-07 — Eliminar ítem del pedido

> **Como** mesero, **quiero** eliminar un ítem del pedido, **para** corregir si se agregó algo por error.

**Prioridad:** S

**Criterios de aceptación:**

- **Dado** que selecciono eliminar un ítem,  
  **cuando** confirmo la acción,  
  **entonces** el ítem desaparece del pedido y el total se recalcula.

---

### HU-08 — Cerrar pedido (cobrar)

> **Como** mesero, **quiero** cerrar el pedido de una mesa, **para** registrar que los clientes pagaron y liberar la mesa.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que el pedido tiene al menos un ítem,  
  **cuando** confirmo el cobro,  
  **entonces** el pedido pasa a estado cerrado, la mesa vuelve a libre y se registra la hora de cierre.

- **Dado** que el pedido no tiene ningún ítem,  
  **cuando** intento cerrarlo,  
  **entonces** el sistema no permite la acción y muestra un aviso.

---

## Épica 3 — Administración de carta

### HU-09 — Agregar producto a la carta

> **Como** administrador, **quiero** agregar nuevos productos con nombre, precio y categoría, **para** mantener la carta actualizada.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que completo el formulario con datos válidos,  
  **cuando** guardo,  
  **entonces** el producto aparece en la carta del mesero inmediatamente.

- **Dado** que dejo el campo precio vacío o ingreso texto,  
  **cuando** intento guardar,  
  **entonces** el sistema muestra un error de validación y no guarda.

---

### HU-10 — Desactivar producto

> **Como** administrador, **quiero** desactivar un producto sin eliminarlo, **para** que no aparezca en la carta cuando no está disponible (ej. temporada).

**Prioridad:** S

**Criterios de aceptación:**

- **Dado** que desactivo un producto,  
  **cuando** el mesero abre la carta,  
  **entonces** ese producto ya no aparece, pero sus registros en pedidos históricos se mantienen.

---

### HU-11 — Editar precio de un producto

> **Como** administrador, **quiero** editar el precio de un producto existente, **para** mantenerlo actualizado sin crear uno nuevo.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que edito el precio de un producto,  
  **cuando** guardo,  
  **entonces** el nuevo precio aplica solo a los pedidos abiertos a partir de ese momento (los pedidos previos conservan el precio original en `detalle_pedido`).

---

## Épica 4 — Historial y reportes (Administrador)

### HU-12 — Consultar historial de pedidos

> **Como** administrador, **quiero** consultar los pedidos cerrados por fecha, **para** revisar la actividad del día o de períodos anteriores.

**Prioridad:** M

**Criterios de aceptación:**

- **Dado** que selecciono una fecha en el historial,  
  **cuando** aplico el filtro,  
  **entonces** veo la lista de pedidos cerrados ese día con mesa, horario y total.

- **Dado** que expando un pedido del historial,  
  **cuando** se despliega el detalle,  
  **entonces** veo cada ítem con nombre, cantidad, precio unitario y subtotal.

---

### HU-13 — Ver total recaudado del día

> **Como** administrador, **quiero** ver el total recaudado en el día actual, **para** tener una referencia rápida del rendimiento del restaurante.

**Prioridad:** S

**Criterios de aceptación:**

- **Dado** que accedo al dashboard,  
  **cuando** carga la pantalla,  
  **entonces** veo la suma de todos los pedidos cerrados hoy.

---

## Resumen de prioridades

| ID | Historia | Prioridad |
|---|---|---|
| HU-01 | Iniciar sesión | M |
| HU-02 | Cerrar sesión | M |
| HU-03 | Ver estado de mesas | M |
| HU-04 | Abrir pedido | M |
| HU-05 | Agregar productos al pedido | M |
| HU-06 | Modificar cantidad de ítem | S |
| HU-07 | Eliminar ítem del pedido | S |
| HU-08 | Cerrar pedido | M |
| HU-09 | Agregar producto a la carta | M |
| HU-10 | Desactivar producto | S |
| HU-11 | Editar precio de producto | M |
| HU-12 | Consultar historial | M |
| HU-13 | Ver total del día | S |
