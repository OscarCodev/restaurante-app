/**
 * Tests de CancelarPedido
 *
 * Cancela un pedido vacío (sin ítems) liberando la mesa.
 * Para pedidos con ítems debe usarse CerrarPedido (flujo de cobro).
 */

import { CancelarPedido } from '@/application/pedidos/CancelarPedido'
import { NotFoundError, ConflictError, ValidationError } from '@/domain/errors/DomainErrors'
import type { Pedido }             from '@/domain/entities/Pedido'
import type { IPedidoRepository }  from '@/domain/repositories/IPedidoRepository'
import type { IDetalleRepository } from '@/domain/repositories/IDetalleRepository'

function makeMockPedidoRepo(overrides: Partial<IPedidoRepository> = {}): jest.Mocked<IPedidoRepository> {
  return {
    findAll: jest.fn(), findAllAbiertos: jest.fn(), findAllConDetalle: jest.fn(),
    findById: jest.fn(), findConDetalle: jest.fn(), create: jest.fn(), close: jest.fn(),
    ...overrides,
  } as jest.Mocked<IPedidoRepository>
}

function makeMockDetalleRepo(overrides: Partial<IDetalleRepository> = {}): jest.Mocked<IDetalleRepository> {
  return {
    addOrUpdate: jest.fn(), update: jest.fn(), delete: jest.fn(), countByPedido: jest.fn(),
    ...overrides,
  } as jest.Mocked<IDetalleRepository>
}

const pedidoVacio: Pedido = {
  id: 'pedido-1', mesa_id: 'mesa-1', usuario_id: 'user-1',
  estado: 'abierto', total: 0, comensales: 2,
  fecha_apertura: '2026-05-27T10:00:00Z', fecha_cierre: null,
  created_at: '2026-05-27T10:00:00Z',
}

const pedidoCerrado: Pedido = { ...pedidoVacio, estado: 'cerrado' }

describe('CancelarPedido', () => {
  it('cancela (cierra) un pedido vacío llamando a pedidoRepo.close()', async () => {
    const pedidoRepo  = makeMockPedidoRepo({
      findById: jest.fn().mockResolvedValue(pedidoVacio),
      close:    jest.fn().mockResolvedValue(undefined),
    })
    const detalleRepo = makeMockDetalleRepo({ countByPedido: jest.fn().mockResolvedValue(0) })
    const uc = new CancelarPedido(pedidoRepo, detalleRepo)

    await uc.execute('pedido-1', 'user-1', false)

    expect(pedidoRepo.close).toHaveBeenCalledWith('pedido-1', 'mesa-1')
  })

  it('lanza NotFoundError si el pedido no existe', async () => {
    const pedidoRepo  = makeMockPedidoRepo({ findById: jest.fn().mockResolvedValue(null) })
    const detalleRepo = makeMockDetalleRepo()
    const uc = new CancelarPedido(pedidoRepo, detalleRepo)

    await expect(uc.execute('no-existe', 'user-1', false)).rejects.toThrow(NotFoundError)
    expect(pedidoRepo.close).not.toHaveBeenCalled()
  })

  it('lanza ConflictError si el pedido ya está cerrado', async () => {
    const pedidoRepo  = makeMockPedidoRepo({ findById: jest.fn().mockResolvedValue(pedidoCerrado) })
    const detalleRepo = makeMockDetalleRepo()
    const uc = new CancelarPedido(pedidoRepo, detalleRepo)

    await expect(uc.execute('pedido-1', 'user-1', false)).rejects.toThrow(ConflictError)
    expect(pedidoRepo.close).not.toHaveBeenCalled()
  })

  it('lanza ConflictError FORBIDDEN si el mesero no es dueño del pedido', async () => {
    const pedidoRepo  = makeMockPedidoRepo({ findById: jest.fn().mockResolvedValue(pedidoVacio) })
    const detalleRepo = makeMockDetalleRepo({ countByPedido: jest.fn().mockResolvedValue(0) })
    const uc = new CancelarPedido(pedidoRepo, detalleRepo)

    // usuario_id del pedido es 'user-1', pero quien cancela es 'otro-user'
    await expect(uc.execute('pedido-1', 'otro-user', false)).rejects.toThrow(ConflictError)
    expect(pedidoRepo.close).not.toHaveBeenCalled()
  })

  it('el admin puede cancelar el pedido de cualquier mesero', async () => {
    const pedidoRepo  = makeMockPedidoRepo({
      findById: jest.fn().mockResolvedValue(pedidoVacio),
      close:    jest.fn().mockResolvedValue(undefined),
    })
    const detalleRepo = makeMockDetalleRepo({ countByPedido: jest.fn().mockResolvedValue(0) })
    const uc = new CancelarPedido(pedidoRepo, detalleRepo)

    // usuario_id del pedido es 'user-1'; admin='otro-user' con esAdmin=true
    await expect(uc.execute('pedido-1', 'otro-user', true)).resolves.toBeUndefined()
    expect(pedidoRepo.close).toHaveBeenCalled()
  })

  it('lanza ValidationError si el pedido tiene ítems (debe usarse CerrarPedido)', async () => {
    const pedidoRepo  = makeMockPedidoRepo({ findById: jest.fn().mockResolvedValue(pedidoVacio) })
    const detalleRepo = makeMockDetalleRepo({ countByPedido: jest.fn().mockResolvedValue(2) })
    const uc = new CancelarPedido(pedidoRepo, detalleRepo)

    await expect(uc.execute('pedido-1', 'user-1', false)).rejects.toThrow(ValidationError)
    await expect(uc.execute('pedido-1', 'user-1', false)).rejects.toThrow('ítems')
    expect(pedidoRepo.close).not.toHaveBeenCalled()
  })
})
