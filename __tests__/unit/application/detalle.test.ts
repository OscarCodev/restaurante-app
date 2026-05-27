/**
 * Tests de casos de uso — Detalle de pedido
 *
 * CU-03 Agregar ítem al pedido     → AgregarItem
 * CU-04 Modificar o eliminar ítem  → EditarItem, EliminarItem
 */

import { AgregarItem }  from '@/application/detalle/AgregarItem'
import { EditarItem }   from '@/application/detalle/EditarItem'
import { EliminarItem } from '@/application/detalle/EliminarItem'
import { NotFoundError, ValidationError } from '@/domain/errors/DomainErrors'
import type { Producto }              from '@/domain/entities/Producto'
import type { DetallePedido }         from '@/domain/entities/DetallePedido'
import type { IDetalleRepository }    from '@/domain/repositories/IDetalleRepository'
import type { IProductoRepository }   from '@/domain/repositories/IProductoRepository'

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeMockDetalleRepo(overrides: Partial<IDetalleRepository> = {}): jest.Mocked<IDetalleRepository> {
  return {
    addOrUpdate:    jest.fn(),
    update:         jest.fn(),
    delete:         jest.fn(),
    countByPedido:  jest.fn(),
    ...overrides,
  } as jest.Mocked<IDetalleRepository>
}

function makeMockProductoRepo(overrides: Partial<IProductoRepository> = {}): jest.Mocked<IProductoRepository> {
  return {
    findAll:  jest.fn(),
    findById: jest.fn(),
    create:   jest.fn(),
    update:   jest.fn(),
    ...overrides,
  } as jest.Mocked<IProductoRepository>
}

const productoActivo: Producto = {
  id: 'prod-1', nombre: 'Lomo Saltado', descripcion: 'Clásico',
  precio: 35.00, categoria: 'principal', activo: true,
  created_at: '2026-01-01T00:00:00Z',
}

const productoInactivo: Producto = {
  ...productoActivo, id: 'prod-2', nombre: 'Postre agotado', activo: false,
}

const detalleResultado: DetallePedido = {
  id: 'det-1', pedido_id: 'pedido-1', producto_id: 'prod-1',
  cantidad: 1, precio_unitario: 35.00, subtotal: 35.00,
  created_at: '2026-05-27T10:00:00Z',
}

// ── CU-03: AgregarItem ─────────────────────────────────────────────────────────

describe('CU-03 — AgregarItem', () => {
  it('agrega el ítem al pedido cuando el producto existe y está activo', async () => {
    const detalleRepo = makeMockDetalleRepo({ addOrUpdate: jest.fn().mockResolvedValue(detalleResultado) })
    const productoRepo = makeMockProductoRepo({ findById: jest.fn().mockResolvedValue(productoActivo) })
    const uc = new AgregarItem(detalleRepo, productoRepo)

    const result = await uc.execute('pedido-1', 'prod-1', 1)

    expect(productoRepo.findById).toHaveBeenCalledWith('prod-1')
    expect(detalleRepo.addOrUpdate).toHaveBeenCalledWith('pedido-1', 'prod-1', 1, 35.00)
    expect(result).toEqual(detalleResultado)
  })

  it('lanza NotFoundError si el producto no existe', async () => {
    const detalleRepo  = makeMockDetalleRepo()
    const productoRepo = makeMockProductoRepo({ findById: jest.fn().mockResolvedValue(null) })
    const uc = new AgregarItem(detalleRepo, productoRepo)

    await expect(uc.execute('pedido-1', 'no-existe', 1)).rejects.toThrow(NotFoundError)
    await expect(uc.execute('pedido-1', 'no-existe', 1)).rejects.toThrow('Producto no encontrado')
    expect(detalleRepo.addOrUpdate).not.toHaveBeenCalled()
  })

  it('lanza ValidationError si el producto está inactivo', async () => {
    const detalleRepo  = makeMockDetalleRepo()
    const productoRepo = makeMockProductoRepo({ findById: jest.fn().mockResolvedValue(productoInactivo) })
    const uc = new AgregarItem(detalleRepo, productoRepo)

    await expect(uc.execute('pedido-1', 'prod-2', 1)).rejects.toThrow(ValidationError)
    await expect(uc.execute('pedido-1', 'prod-2', 1)).rejects.toThrow('Producto inactivo')
    expect(detalleRepo.addOrUpdate).not.toHaveBeenCalled()
  })

  it('pasa el precio del producto (convertido a número) a addOrUpdate', async () => {
    // precio puede venir como string desde Supabase; Number() lo normaliza
    const productoConPrecioString = { ...productoActivo, precio: '28.50' as unknown as number }
    const detalleRepo  = makeMockDetalleRepo({ addOrUpdate: jest.fn().mockResolvedValue(detalleResultado) })
    const productoRepo = makeMockProductoRepo({ findById: jest.fn().mockResolvedValue(productoConPrecioString) })
    const uc = new AgregarItem(detalleRepo, productoRepo)

    await uc.execute('pedido-1', 'prod-1', 2)

    expect(detalleRepo.addOrUpdate).toHaveBeenCalledWith('pedido-1', 'prod-1', 2, 28.50)
  })

  it('pasa la cantidad indicada por el mesero a addOrUpdate', async () => {
    const detalleRepo  = makeMockDetalleRepo({ addOrUpdate: jest.fn().mockResolvedValue(detalleResultado) })
    const productoRepo = makeMockProductoRepo({ findById: jest.fn().mockResolvedValue(productoActivo) })
    const uc = new AgregarItem(detalleRepo, productoRepo)

    await uc.execute('pedido-1', 'prod-1', 3)

    expect(detalleRepo.addOrUpdate).toHaveBeenCalledWith('pedido-1', 'prod-1', 3, 35.00)
  })
})

// ── CU-04: EditarItem ──────────────────────────────────────────────────────────

describe('CU-04 — EditarItem', () => {
  it('delega a detalleRepo.update() con el id y la nueva cantidad', async () => {
    const detalleActualizado: DetallePedido = { ...detalleResultado, cantidad: 2, subtotal: 70.00 }
    const detalleRepo = makeMockDetalleRepo({ update: jest.fn().mockResolvedValue(detalleActualizado) })
    const uc = new EditarItem(detalleRepo)

    const result = await uc.execute('det-1', 2)

    expect(detalleRepo.update).toHaveBeenCalledWith('det-1', 2)
    expect(result.cantidad).toBe(2)
  })

  it('devuelve el ítem actualizado tal como lo retorna el repo', async () => {
    const detalleActualizado: DetallePedido = { ...detalleResultado, cantidad: 5, subtotal: 175.00 }
    const detalleRepo = makeMockDetalleRepo({ update: jest.fn().mockResolvedValue(detalleActualizado) })
    const uc = new EditarItem(detalleRepo)

    const result = await uc.execute('det-1', 5)

    expect(result.subtotal).toBe(175.00)
  })
})

// ── CU-04: EliminarItem ────────────────────────────────────────────────────────

describe('CU-04 — EliminarItem', () => {
  it('delega a detalleRepo.delete() con el id del ítem', async () => {
    const detalleRepo = makeMockDetalleRepo({ delete: jest.fn().mockResolvedValue(undefined) })
    const uc = new EliminarItem(detalleRepo)

    await uc.execute('det-1')

    expect(detalleRepo.delete).toHaveBeenCalledWith('det-1')
    expect(detalleRepo.delete).toHaveBeenCalledTimes(1)
  })

  it('si se elimina el único ítem, el pedido permanece abierto (EliminarItem no cambia estado del pedido)', async () => {
    // CU-04 flujo alternativo: eliminar el último ítem deja el pedido abierto (sin ítems).
    // EliminarItem solo llama delete(); no cierra el pedido — esto es responsabilidad del caso de uso CerrarPedido.
    const detalleRepo = makeMockDetalleRepo({ delete: jest.fn().mockResolvedValue(undefined) })
    const uc = new EliminarItem(detalleRepo)

    // Debe completarse sin error aunque sea el último ítem
    await expect(uc.execute('ultimo-item')).resolves.toBeUndefined()
    expect(detalleRepo.delete).toHaveBeenCalledWith('ultimo-item')
  })
})
