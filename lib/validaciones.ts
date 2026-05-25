import { z } from 'zod'

export const productoSchema = z.object({
  nombre:      z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  precio:      z.number().positive('El precio debe ser mayor a 0'),
  categoria:   z.enum(['entrada', 'principal', 'bebida', 'postre']),
})

export const mesaSchema = z.object({
  numero:    z.number().int().positive('El número de mesa debe ser positivo'),
  capacidad: z.number().int().min(1, 'La capacidad debe ser al menos 1'),
})

export const pedidoSchema = z.object({
  mesa_id:    z.string().uuid(),
  comensales: z.number().int().min(1, 'Se requiere al menos 1 comensal'),
})

export const itemSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad:    z.number().int().min(1, 'La cantidad debe ser al menos 1'),
})
