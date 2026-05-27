/**
 * Tests de casos de uso — Pedidos
 *
 * CU-02 Abrir pedido          → CrearPedido
 * CU-05 Cerrar pedido         → CerrarPedido
 * CU-09 Ver historial         → GetHistorial
 *        Detalle del pedido   → GetPedidoConDetalle
 *        Lista de pedidos     → GetPedidos
 */

import { CrearPedido }          from '@/application/pedidos/CrearPedido'
import { CerrarPedido }         from '@/application/pedidos/CerrarPedido'
import { GetHistorial }         from '@/application/pedidos/GetHistorial'
import { GetPedidoConDetalle }  from '@/application/pedidos/GetPedidoConDetalle'
import { GetPedidos }           from '@/application/pedidos/GetPedidos'
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '@/domain/errors/DomainErrors'
import type { Mesa }              from '@/domain/entities/Mesa'
import type { Pedido, PedidoConDetalle, PedidoConMesa, PedidoHistorial, PedidoFilters } from '@/domain/entities/Pedido'
import type { IMesaRepository }   from '@/domain/repositories/IMesaRepository'
import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'
import type { IDetalleRepository } from '@/domain/repositories/IDetalleRepository'

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeMockMesaRepo(overrides: Partial<IMesaRepository> = {}): jest.Mocked<IMesaRepository> {
  return {
    findAll: jest.fn(), findById: jest.fn(), create: jest.fn(),
    updateEstado: jest.fn(), update: jest.fn(),
    ...overrides,
  } as jest.Mocked<IMesaRepository>
}

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

const mesaLibre: Mesa = {
  id: 'mesa-1', numero: 1, capacidad: 4,
  estado: 'libre', created_at: '2026-01-01T00:00:00Z',
}

const mesaOcupada: Mesa = {
  id: 'mesa-2', numero: 2, capacidad: 2,
  estado: 'ocupada', created_at: '2026-01-01T00:00:00Z',
}

const pedidoAbierto: Pedido = {
  id: 'pedido-1', mesa_id: 'mesa-1', usuario_id: 'user-1',
  estado: 'abierto', total: 50, comensales: 2,
  fecha_apertura: '2026-05-27T10:00:00Z', fecha_cierre: null,
  created_at: '2026-05-27T10:00:00Z',
}

const pedidoCerrado: Pedido = { ...pedidoAbierto, estado: 'cerrado', fecha_cierre: '2026-05-27T11:00:00Z' }

// ── CU-02: CrearPedido ─────────────────────────────────────────────────────────

describe('CU-02 — CrearPedido', () => {
  it('crea un pedido cuando la mesa existe, está libre y hay capacidad', async () => {
    const mesaRepo   = makeMockMesaRepo({ findById: jest.fn().mockResolvedValue(mesaLibre) })
    const pedidoRepo = makeMockPedidoRepo({ create: jest.fn().mockResolvedValue(pedidoAbierto) })
    const uc = new CrearPedido(mesaRepo, pedidoRepo)

    const result = await uc.execute('mesa-1', 'user-1', 2)

    expect(mesaRepo.findById).toHaveBeenCalledWith('mesa-1')
    expect(pedidoRepo.create).toHaveBeenCalledWith('mesa-1', 'user-1', 2)
    expect(result).toEqual(pedidoAbierto)
  })

  it('lanza NotFoundError si la mesa no existe', async () => {
    const mesaRepo   = makeMockMesaRepo({ findById: jest.fn().mockResolvedValue(null) })
    const pedidoRepo = makeMockPedidoRepo()
    const uc = new CrearPedido(mesaRepo, pedidoRepo)

    await expect(uc.execute('no-existe', 'user-1', 2)).rejects.toThrow(NotFoundError)
    await expect(uc.execute('no-existe', 'user-1', 2)).rejects.toThrow('Mesa no encontrada')
    expect(pedidoRepo.create).not.toHaveBeenCalled()
  })

  it('lanza ConflictError MESA_OCUPADA si la mesa ya está ocupada', async () => {
    const mesaRepo   = makeMockMesaRepo({ findById: jest.fn().mockResolvedValue(mesaOcupada) })
    const pedidoRepo = makeMockPedidoRepo()
    const uc = new CrearPedido(mesaRepo, pedidoRepo)

    await expect(uc.execute('mesa-2', 'user-1', 1)).rejects.toThrow(ConflictError)
    await expect(uc.execute('mesa-2', 'user-1', 1)).rejects.toMatchObject({ code: 'MESA_OCUPADA' })
    expect(pedidoRepo.create).not.toHaveBeenCalled()
  })

  it('lanza ValidationError si los comensales superan la capacidad de la mesa', async () => {
    const mesaRepo   = makeMockMesaRepo({ findById: jest.fn().mockResolvedValue(mesaLibre) }) // capacidad 4
    const pedidoRepo = makeMockPedidoRepo()
    const uc = new CrearPedido(mesaRepo, pedidoRepo)

    await expect(uc.execute('mesa-1', 'user-1', 5)).rejects.toThrow(ValidationError)
    await expect(uc.execute('mesa-1', 'user-1', 5)).rejects.toThrow('Supera la capacidad de la mesa')
    expect(pedidoRepo.create).not.toHaveBeenCalled()
  })

  it('acepta exactamente la capacidad máxima de la mesa (límite exacto)', async () => {
    const mesaRepo   = makeMockMesaRepo({ findById: jest.fn().mockResolvedValue(mesaLibre) }) // capacidad 4
    const pedidoRepo = makeMockPedidoRepo({ create: jest.fn().mockResolvedValue(pedidoAbierto) })
    const uc = new CrearPedido(mesaRepo, pedidoRepo)

    await expect(uc.execute('mesa-1', 'user-1', 4)).resolves.toEqual(pedidoAbierto)
  })
})

// ── CU-05: CerrarPedido ────────────────────────────────────────────────────────

describe('CU-05 — CerrarPedido', () => {
  it('cierra un pedido con ítems y retorna el pedido con detalle', async () => {
    const pedidoConDetalle: PedidoConDetalle = {
      ...pedidoCerrado,
      mesa: { id: 'mesa-1', numero: 1 },
      items: [],
    }

    const pedidoRepo  = makeMockPedidoRepo({
      findById:       jest.fn().mockResolvedValue(pedidoAbierto),
      close:          jest.fn().mockResolvedValue(undefined),
      findConDetalle: jest.fn().mockResolvedValue(pedidoConDetalle),
    })
    const detalleRepo = makeMockDetalleRepo({ countByPedido: jest.fn().mockResolvedValue(3) })
    const uc = new CerrarPedido(pedidoRepo, detalleRepo)

    const result = await uc.execute('pedido-1')

    expect(pedidoRepo.close).toHaveBeenCalledWith('pedido-1', 'mesa-1')
    expect(result).toEqual(pedidoConDetalle)
  })

  it('lanza NotFoundError si el pedido no existe', async () => {
    const pedidoRepo  = makeMockPedidoRepo({ findById: jest.fn().mockResolvedValue(null) })
    const detalleRepo = makeMockDetalleRepo()
    const uc = new CerrarPedido(pedidoRepo, detalleRepo)

    await expect(uc.execute('no-existe')).rejects.toThrow(NotFoundError)
    await expect(uc.execute('no-existe')).rejects.toThrow('Pedido no encontrado')
    expect(pedidoRepo.close).not.toHaveBeenCalled()
  })

  it('lanza ConflictError si el pedido ya está cerrado', async () => {
    const pedidoRepo  = makeMockPedidoRepo({ findById: jest.fn().mockResolvedValue(pedidoCerrado) })
    const detalleRepo = makeMockDetalleRepo()
    const uc = new CerrarPedido(pedidoRepo, detalleRepo)

    await expect(uc.execute('pedido-1')).rejects.toThrow(ConflictError)
    await expect(uc.execute('pedido-1')).rejects.toThrow('El pedido ya está cerrado')
    expect(pedidoRepo.close).not.toHaveBeenCalled()
  })

  it('lanza ValidationError si el pedido no tiene ítems', async () => {
    const pedidoRepo  = makeMockPedidoRepo({ findById: jest.fn().mockResolvedValue(pedidoAbierto) })
    const detalleRepo = makeMockDetalleRepo({ countByPedido: jest.fn().mockResolvedValue(0) })
    const uc = new CerrarPedido(pedidoRepo, detalleRepo)

    await expect(uc.execute('pedido-1')).rejects.toThrow(ValidationError)
    await expect(uc.execute('pedido-1')).rejects.toThrow('El pedido no tiene ítems')
    expect(pedidoRepo.close).not.toHaveBeenCalled()
  })

  it('consulta la cantidad de ítems con el pedidoId correcto', async () => {
    const pedidoConDetalle: PedidoConDetalle = { ...pedidoCerrado, mesa: { id: 'mesa-1', numero: 1 }, items: [] }
    const pedidoRepo  = makeMockPedidoRepo({
      findById:       jest.fn().mockResolvedValue(pedidoAbierto),
      close:          jest.fn().mockResolvedValue(undefined),
      findConDetalle: jest.fn().mockResolvedValue(pedidoConDetalle),
    })
    const detalleRepo = makeMockDetalleRepo({ countByPedido: jest.fn().mockResolvedValue(2) })
    const uc = new CerrarPedido(pedidoRepo, detalleRepo)

    await uc.execute('pedido-1')

    expect(detalleRepo.countByPedido).toHaveBeenCalledWith('pedido-1')
  })
})

// ── CU-09: GetHistorial ────────────────────────────────────────────────────────

describe('CU-09 — GetHistorial', () => {
  it('llama a findAllConDetalle con estado cerrado, fechas y esAdmin=true', async () => {
    const pedidoRepo = makeMockPedidoRepo({ findAllConDetalle: jest.fn().mockResolvedValue([]) })
    const uc = new GetHistorial(pedidoRepo)

    await uc.execute('2026-05-01', '2026-05-31')

    expect(pedidoRepo.findAllConDetalle).toHaveBeenCalledWith({
      estado: 'cerrado',
      desde: '2026-05-01',
      hasta: '2026-05-31',
      esAdmin: true,
    })
  })

  it('devuelve la lista de pedidos del historial', async () => {
    const historial: PedidoHistorial[] = [
      {
        id: 'p1', mesa_id: 'm1', usuario_id: 'u1', estado: 'cerrado',
        total: 120, comensales: 2, fecha_apertura: '2026-05-27T12:00:00Z',
        fecha_cierre: '2026-05-27T13:00:00Z', created_at: '2026-05-27T12:00:00Z',
        mesa: { numero: 3 },
        items: [{ id: 'i1', cantidad: 2, precio_unitario: 30, subtotal: 60, producto: { nombre: 'Lomo' } }],
      },
    ]

    const pedidoRepo = makeMockPedidoRepo({ findAllConDetalle: jest.fn().mockResolvedValue(historial) })
    const uc = new GetHistorial(pedidoRepo)

    const result = await uc.execute('2026-05-27', '2026-05-27')

    expect(result).toHaveLength(1)
    expect(result[0].estado).toBe('cerrado')
    expect(result[0].mesa.numero).toBe(3)
  })
})

// ── GetPedidoConDetalle ────────────────────────────────────────────────────────

describe('GetPedidoConDetalle', () => {
  it('delega al repo.findConDetalle() con el id correcto', async () => {
    const detalle: PedidoConDetalle = {
      ...pedidoAbierto,
      mesa: { id: 'mesa-1', numero: 1 },
      items: [],
    }
    const pedidoRepo = makeMockPedidoRepo({ findConDetalle: jest.fn().mockResolvedValue(detalle) })
    const uc = new GetPedidoConDetalle(pedidoRepo)

    const result = await uc.execute('pedido-1')

    expect(pedidoRepo.findConDetalle).toHaveBeenCalledWith('pedido-1')
    expect(result).toEqual(detalle)
  })

  it('devuelve null si el pedido no existe', async () => {
    const pedidoRepo = makeMockPedidoRepo({ findConDetalle: jest.fn().mockResolvedValue(null) })
    const uc = new GetPedidoConDetalle(pedidoRepo)

    const result = await uc.execute('no-existe')

    expect(result).toBeNull()
  })
})

// ── GetPedidos ────────────────────────────────────────────────────────────────

describe('GetPedidos', () => {
  it('delega al repo.findAll() con los filtros pasados', async () => {
    const pedidoConMesa: PedidoConMesa = {
      ...pedidoAbierto,
      mesa: { id: 'mesa-1', numero: 1 },
    }
    const pedidoRepo = makeMockPedidoRepo({ findAll: jest.fn().mockResolvedValue([pedidoConMesa]) })
    const uc = new GetPedidos(pedidoRepo)

    const filtros: PedidoFilters = { estado: 'abierto', esAdmin: false }
    const result = await uc.execute(filtros)

    expect(pedidoRepo.findAll).toHaveBeenCalledWith(filtros)
    expect(result).toHaveLength(1)
  })

  it('devuelve array vacío cuando no hay pedidos', async () => {
    const pedidoRepo = makeMockPedidoRepo({ findAll: jest.fn().mockResolvedValue([]) })
    const uc = new GetPedidos(pedidoRepo)

    const result = await uc.execute({})

    expect(result).toEqual([])
  })
})
