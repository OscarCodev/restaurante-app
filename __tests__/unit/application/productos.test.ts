/**
 * Tests de casos de uso — Productos
 *
 * CU-06 Ver carta             → GetProductos (soloActivos)
 * CU-07 Gestionar productos   → CrearProducto, EditarProducto
 */

import { GetProductos }    from '@/application/productos/GetProductos'
import { CrearProducto }   from '@/application/productos/CrearProducto'
import { EditarProducto }  from '@/application/productos/EditarProducto'
import { NotFoundError }   from '@/domain/errors/DomainErrors'
import type { Producto }          from '@/domain/entities/Producto'
import type { IProductoRepository } from '@/domain/repositories/IProductoRepository'

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  id: 'prod-1',
  nombre: 'Lomo Saltado',
  descripcion: 'Clásico peruano',
  precio: 35.00,
  categoria: 'principal',
  activo: true,
  created_at: '2026-01-01T00:00:00Z',
}

const productoInactivo: Producto = {
  ...productoActivo,
  id: 'prod-2',
  nombre: 'Postre del día',
  categoria: 'postre',
  activo: false,
}

// ── CU-06: GetProductos (Ver carta) ────────────────────────────────────────────

describe('CU-06 — GetProductos', () => {
  it('por defecto solicita solo productos activos (soloActivos=true)', async () => {
    const repo = makeMockProductoRepo({ findAll: jest.fn().mockResolvedValue([productoActivo]) })
    const uc = new GetProductos(repo)

    await uc.execute()

    expect(repo.findAll).toHaveBeenCalledWith(true)
  })

  it('acepta soloActivos=false para obtener todos los productos', async () => {
    const repo = makeMockProductoRepo({
      findAll: jest.fn().mockResolvedValue([productoActivo, productoInactivo]),
    })
    const uc = new GetProductos(repo)

    const result = await uc.execute(false)

    expect(repo.findAll).toHaveBeenCalledWith(false)
    expect(result).toHaveLength(2)
  })

  it('devuelve la lista de productos tal como la retorna el repo', async () => {
    const repo = makeMockProductoRepo({ findAll: jest.fn().mockResolvedValue([productoActivo]) })
    const uc = new GetProductos(repo)

    const result = await uc.execute()

    expect(result).toHaveLength(1)
    expect(result[0].activo).toBe(true)
    expect(result[0].nombre).toBe('Lomo Saltado')
  })

  it('devuelve array vacío si no hay productos activos', async () => {
    const repo = makeMockProductoRepo({ findAll: jest.fn().mockResolvedValue([]) })
    const uc = new GetProductos(repo)

    const result = await uc.execute()

    expect(result).toEqual([])
  })
})

// ── CU-07: CrearProducto ───────────────────────────────────────────────────────

describe('CU-07 — CrearProducto', () => {
  it('delega a productoRepo.create() con los datos correctos', async () => {
    const datos = { nombre: 'Ají de Gallina', descripcion: null, precio: 28.00, categoria: 'principal' as const }
    const repo = makeMockProductoRepo({ create: jest.fn().mockResolvedValue({ ...datos, id: 'new-id', activo: true, created_at: '' }) })
    const uc = new CrearProducto(repo)

    const result = await uc.execute(datos)

    expect(repo.create).toHaveBeenCalledWith(datos)
    expect(result.nombre).toBe('Ají de Gallina')
    expect(result.id).toBe('new-id')
  })

  it('devuelve el producto creado con los campos que asigna el repo (id, activo, created_at)', async () => {
    const datos = { nombre: 'Chicha Morada', descripcion: 'Bebida típica', precio: 8.50, categoria: 'bebida' as const }
    const creado: Producto = { ...datos, id: 'gen-id', activo: true, created_at: '2026-05-27T00:00:00Z' }
    const repo = makeMockProductoRepo({ create: jest.fn().mockResolvedValue(creado) })
    const uc = new CrearProducto(repo)

    const result = await uc.execute(datos)

    expect(result.activo).toBe(true)
    expect(result.created_at).toBeDefined()
  })
})

// ── CU-07: EditarProducto ──────────────────────────────────────────────────────

describe('CU-07 — EditarProducto', () => {
  it('lanza NotFoundError si el producto no existe', async () => {
    const repo = makeMockProductoRepo({ findById: jest.fn().mockResolvedValue(null) })
    const uc = new EditarProducto(repo)

    await expect(uc.execute('no-existe', { precio: 40 })).rejects.toThrow(NotFoundError)
    await expect(uc.execute('no-existe', { precio: 40 })).rejects.toThrow('Producto no encontrado')
    expect(repo.update).not.toHaveBeenCalled()
  })

  it('llama a productoRepo.update() con el id y los datos parciales', async () => {
    const actualizado: Producto = { ...productoActivo, precio: 40.00 }
    const repo = makeMockProductoRepo({
      findById: jest.fn().mockResolvedValue(productoActivo),
      update:   jest.fn().mockResolvedValue(actualizado),
    })
    const uc = new EditarProducto(repo)

    const result = await uc.execute('prod-1', { precio: 40.00 })

    expect(repo.update).toHaveBeenCalledWith('prod-1', { precio: 40.00 })
    expect(result.precio).toBe(40.00)
  })

  it('no llama a update si findById devuelve null', async () => {
    const repo = makeMockProductoRepo({ findById: jest.fn().mockResolvedValue(null) })
    const uc = new EditarProducto(repo)

    try { await uc.execute('x', { nombre: 'Nuevo' }) } catch {}

    expect(repo.update).not.toHaveBeenCalled()
  })

  it('permite actualizar el estado activo/inactivo del producto', async () => {
    const desactivado: Producto = { ...productoActivo, activo: false }
    const repo = makeMockProductoRepo({
      findById: jest.fn().mockResolvedValue(productoActivo),
      update:   jest.fn().mockResolvedValue(desactivado),
    })
    const uc = new EditarProducto(repo)

    const result = await uc.execute('prod-1', { activo: false })

    expect(repo.update).toHaveBeenCalledWith('prod-1', { activo: false })
    expect(result.activo).toBe(false)
  })
})
