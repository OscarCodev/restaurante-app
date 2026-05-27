/**
 * Tests de casos de uso — Mesas
 *
 * CU-01 Ver estado de mesas  → GetMesasConEstado
 * CU-08 Gestionar mesas      → CrearMesa, EditarMesa
 */

import { GetMesasConEstado } from '@/application/mesas/GetMesasConEstado'
import { CrearMesa }         from '@/application/mesas/CrearMesa'
import { EditarMesa }        from '@/application/mesas/EditarMesa'
import { NotFoundError }     from '@/domain/errors/DomainErrors'
import type { Mesa }         from '@/domain/entities/Mesa'
import type { Pedido }       from '@/domain/entities/Pedido'
import type { IMesaRepository }   from '@/domain/repositories/IMesaRepository'
import type { IPedidoRepository } from '@/domain/repositories/IPedidoRepository'

// ── Helpers ────────────────────────────────────────────────────────────────────

function makeMockMesaRepo(overrides: Partial<IMesaRepository> = {}): jest.Mocked<IMesaRepository> {
  return {
    findAll:      jest.fn(),
    findById:     jest.fn(),
    create:       jest.fn(),
    updateEstado: jest.fn(),
    update:       jest.fn(),
    ...overrides,
  } as jest.Mocked<IMesaRepository>
}

function makeMockPedidoRepo(overrides: Partial<IPedidoRepository> = {}): jest.Mocked<IPedidoRepository> {
  return {
    findAll:           jest.fn(),
    findAllAbiertos:   jest.fn(),
    findAllConDetalle: jest.fn(),
    findById:          jest.fn(),
    findConDetalle:    jest.fn(),
    create:            jest.fn(),
    close:             jest.fn(),
    ...overrides,
  } as jest.Mocked<IPedidoRepository>
}

const mesaLibre: Mesa = {
  id: 'mesa-1',
  numero: 1,
  capacidad: 4,
  estado: 'libre',
  created_at: '2026-01-01T00:00:00Z',
}

const mesaOcupada: Mesa = {
  id: 'mesa-2',
  numero: 2,
  capacidad: 2,
  estado: 'ocupada',
  created_at: '2026-01-01T00:00:00Z',
}

// ── CU-01: GetMesasConEstado ────────────────────────────────────────────────────

describe('CU-01 — GetMesasConEstado', () => {
  it('devuelve todas las mesas con pedido_activo_id null cuando no hay pedidos abiertos', async () => {
    const mesaRepo   = makeMockMesaRepo({ findAll: jest.fn().mockResolvedValue([mesaLibre, mesaOcupada]) })
    const pedidoRepo = makeMockPedidoRepo({ findAllAbiertos: jest.fn().mockResolvedValue([]) })
    const uc = new GetMesasConEstado(mesaRepo, pedidoRepo)

    const result = await uc.execute()

    expect(result).toHaveLength(2)
    expect(result[0].pedido_activo_id).toBeNull()
    expect(result[0].fecha_apertura_pedido).toBeNull()
    expect(result[1].pedido_activo_id).toBeNull()
  })

  it('asigna pedido_activo_id cuando mesas.estado es libre pero hay pedido abierto (inconsistencia BD)', async () => {
    // Simula datos inconsistentes: mesas.estado='libre' pero existe pedido abierto.
    // GetMesasConEstado expone el pedido_activo_id; MesaCard/MesaGrid lo manejan en la UI.
    const mesaConDatosInconsistentes: Mesa = { ...mesaLibre, id: 'mesa-3', estado: 'libre' }
    const pedidoHuerfano: Partial<Pedido> = {
      id: 'pedido-huerfano',
      mesa_id: 'mesa-3',
      estado: 'abierto',
      fecha_apertura: '2026-05-27T09:00:00Z',
    }

    const mesaRepo   = makeMockMesaRepo({ findAll: jest.fn().mockResolvedValue([mesaConDatosInconsistentes]) })
    const pedidoRepo = makeMockPedidoRepo({ findAllAbiertos: jest.fn().mockResolvedValue([pedidoHuerfano]) })
    const uc = new GetMesasConEstado(mesaRepo, pedidoRepo)

    const [result] = await uc.execute()

    // mesas.estado se preserva; la UI usa pedido_activo_id para detectar la inconsistencia
    expect(result.estado).toBe('libre')
    expect(result.pedido_activo_id).toBe('pedido-huerfano')
    expect(result.fecha_apertura_pedido).toBe('2026-05-27T09:00:00Z')
  })

  it('asigna pedido_activo_id y fecha_apertura_pedido a la mesa que tiene un pedido abierto', async () => {
    const pedidoAbierto: Partial<Pedido> = {
      id: 'pedido-1',
      mesa_id: 'mesa-2',
      estado: 'abierto',
      fecha_apertura: '2026-05-27T10:00:00Z',
    }

    const mesaRepo   = makeMockMesaRepo({ findAll: jest.fn().mockResolvedValue([mesaLibre, mesaOcupada]) })
    const pedidoRepo = makeMockPedidoRepo({ findAllAbiertos: jest.fn().mockResolvedValue([pedidoAbierto]) })
    const uc = new GetMesasConEstado(mesaRepo, pedidoRepo)

    const result = await uc.execute()

    const libre   = result.find(m => m.id === 'mesa-1')!
    const ocupada = result.find(m => m.id === 'mesa-2')!

    expect(libre.pedido_activo_id).toBeNull()
    expect(libre.fecha_apertura_pedido).toBeNull()
    expect(ocupada.pedido_activo_id).toBe('pedido-1')
    expect(ocupada.fecha_apertura_pedido).toBe('2026-05-27T10:00:00Z')
  })

  it('preserva todos los campos originales de la mesa', async () => {
    const mesaRepo   = makeMockMesaRepo({ findAll: jest.fn().mockResolvedValue([mesaLibre]) })
    const pedidoRepo = makeMockPedidoRepo({ findAllAbiertos: jest.fn().mockResolvedValue([]) })
    const uc = new GetMesasConEstado(mesaRepo, pedidoRepo)

    const [result] = await uc.execute()

    expect(result.id).toBe(mesaLibre.id)
    expect(result.numero).toBe(mesaLibre.numero)
    expect(result.capacidad).toBe(mesaLibre.capacidad)
    expect(result.estado).toBe(mesaLibre.estado)
  })

  it('consulta mesas y pedidos abiertos en paralelo (ambos repos reciben exactamente 1 llamada)', async () => {
    const mesaRepo   = makeMockMesaRepo({ findAll: jest.fn().mockResolvedValue([]) })
    const pedidoRepo = makeMockPedidoRepo({ findAllAbiertos: jest.fn().mockResolvedValue([]) })
    const uc = new GetMesasConEstado(mesaRepo, pedidoRepo)

    await uc.execute()

    expect(mesaRepo.findAll).toHaveBeenCalledTimes(1)
    expect(pedidoRepo.findAllAbiertos).toHaveBeenCalledTimes(1)
  })

  it('devuelve array vacío cuando no hay mesas', async () => {
    const mesaRepo   = makeMockMesaRepo({ findAll: jest.fn().mockResolvedValue([]) })
    const pedidoRepo = makeMockPedidoRepo({ findAllAbiertos: jest.fn().mockResolvedValue([]) })
    const uc = new GetMesasConEstado(mesaRepo, pedidoRepo)

    const result = await uc.execute()

    expect(result).toEqual([])
  })
})

// ── CU-08: CrearMesa ────────────────────────────────────────────────────────────

describe('CU-08 — CrearMesa', () => {
  it('delega a mesaRepo.create() con número y capacidad', async () => {
    const nuevaMesa: Mesa = { ...mesaLibre, id: 'nueva-id', numero: 5, capacidad: 6 }
    const mesaRepo = makeMockMesaRepo({ create: jest.fn().mockResolvedValue(nuevaMesa) })
    const uc = new CrearMesa(mesaRepo)

    const result = await uc.execute(5, 6)

    expect(mesaRepo.create).toHaveBeenCalledWith(5, 6)
    expect(result).toEqual(nuevaMesa)
  })

  it('devuelve la mesa creada tal como la retorna el repo', async () => {
    const mesa: Mesa = { id: 'abc', numero: 10, capacidad: 8, estado: 'libre', created_at: '2026-01-01T00:00:00Z' }
    const mesaRepo = makeMockMesaRepo({ create: jest.fn().mockResolvedValue(mesa) })
    const uc = new CrearMesa(mesaRepo)

    const result = await uc.execute(10, 8)

    expect(result.numero).toBe(10)
    expect(result.capacidad).toBe(8)
  })
})

// ── CU-08: EditarMesa ────────────────────────────────────────────────────────────

describe('CU-08 — EditarMesa', () => {
  it('lanza NotFoundError si la mesa no existe', async () => {
    const mesaRepo = makeMockMesaRepo({ findById: jest.fn().mockResolvedValue(null) })
    const uc = new EditarMesa(mesaRepo)

    await expect(uc.execute('mesa-inexistente', 4)).rejects.toThrow(NotFoundError)
    await expect(uc.execute('mesa-inexistente', 4)).rejects.toThrow('Mesa no encontrada')
  })

  it('llama a mesaRepo.update() con el id y la nueva capacidad', async () => {
    const mesaActualizada: Mesa = { ...mesaLibre, capacidad: 6 }
    const mesaRepo = makeMockMesaRepo({
      findById: jest.fn().mockResolvedValue(mesaLibre),
      update:   jest.fn().mockResolvedValue(mesaActualizada),
    })
    const uc = new EditarMesa(mesaRepo)

    const result = await uc.execute('mesa-1', 6)

    expect(mesaRepo.update).toHaveBeenCalledWith('mesa-1', 6)
    expect(result.capacidad).toBe(6)
  })

  it('no llama a update si findById devuelve null', async () => {
    const mesaRepo = makeMockMesaRepo({ findById: jest.fn().mockResolvedValue(null) })
    const uc = new EditarMesa(mesaRepo)

    await expect(uc.execute('x', 2)).rejects.toThrow(NotFoundError)
    expect(mesaRepo.update).not.toHaveBeenCalled()
  })
})
