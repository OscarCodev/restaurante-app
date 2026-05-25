import { getProductos, getProductoById, crearProducto, editarProducto } from '@/lib/supabase/productos'
import { supabaseAdmin } from './setup'

describe('getProductos — integración con Supabase', () => {
  let productoId: string

  beforeEach(async () => {
    const { data, error } = await supabaseAdmin
      .from('productos')
      .insert({ nombre: 'Test getProductos', precio: 15.00, categoria: 'entrada', activo: true })
      .select()
      .single()
    if (error) throw error
    productoId = data.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
  })

  it('devuelve solo productos activos por defecto', async () => {
    await supabaseAdmin.from('productos').update({ activo: false }).eq('id', productoId)

    const productos = await getProductos(true)
    const encontrado = productos.find(p => p.id === productoId)
    expect(encontrado).toBeUndefined()
  })

  it('incluye productos inactivos cuando soloActivos=false', async () => {
    await supabaseAdmin.from('productos').update({ activo: false }).eq('id', productoId)

    const productos = await getProductos(false)
    const encontrado = productos.find(p => p.id === productoId)
    expect(encontrado).toBeDefined()
  })

  it('devuelve los productos ordenados por categoría y nombre', async () => {
    const productos = await getProductos(false)
    const categorias = productos.map(p => p.categoria)
    const ordenadas = [...categorias].sort()
    expect(categorias).toEqual(ordenadas)
  })
})

describe('getProductoById — integración con Supabase', () => {
  let productoId: string

  beforeEach(async () => {
    const { data, error } = await supabaseAdmin
      .from('productos')
      .insert({ nombre: 'Test getById', precio: 20.00, categoria: 'bebida', activo: true })
      .select()
      .single()
    if (error) throw error
    productoId = data.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
  })

  it('devuelve el producto cuando el id existe', async () => {
    const producto = await getProductoById(productoId)
    expect(producto).not.toBeNull()
    expect(producto?.nombre).toBe('Test getById')
    expect(Number(producto?.precio)).toBe(20.00)
  })

  it('devuelve null cuando el id no existe', async () => {
    const producto = await getProductoById('00000000-0000-0000-0000-000000000000')
    expect(producto).toBeNull()
  })
})

describe('crearProducto — integración con Supabase', () => {
  let productoId: string

  afterEach(async () => {
    if (productoId) {
      await supabaseAdmin.from('productos').delete().eq('id', productoId)
    }
  })

  it('crea el producto con activo=true por defecto', async () => {
    const producto = await crearProducto({
      nombre: 'Test crear',
      descripcion: 'Descripción de prueba',
      precio: 25.00,
      categoria: 'postre',
    })
    productoId = producto.id

    expect(producto.nombre).toBe('Test crear')
    expect(Number(producto.precio)).toBe(25.00)
    expect(producto.activo).toBe(true)
  })

  it('crea el producto sin descripción (null)', async () => {
    const producto = await crearProducto({
      nombre: 'Sin desc',
      descripcion: null,
      precio: 10.00,
      categoria: 'bebida',
    })
    productoId = producto.id

    expect(producto.descripcion).toBeNull()
  })
})

describe('editarProducto — integración con Supabase', () => {
  let productoId: string

  beforeEach(async () => {
    const { data, error } = await supabaseAdmin
      .from('productos')
      .insert({ nombre: 'Original', precio: 10.00, categoria: 'bebida', activo: true })
      .select()
      .single()
    if (error) throw error
    productoId = data.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
  })

  it('actualiza el nombre del producto', async () => {
    const actualizado = await editarProducto(productoId, { nombre: 'Nombre nuevo' })
    expect(actualizado.nombre).toBe('Nombre nuevo')
  })

  it('puede desactivar un producto', async () => {
    const actualizado = await editarProducto(productoId, { activo: false })
    expect(actualizado.activo).toBe(false)
  })

  it('puede actualizar precio y descripción juntos', async () => {
    const actualizado = await editarProducto(productoId, { precio: 99.99, descripcion: 'Nueva desc' })
    expect(Number(actualizado.precio)).toBe(99.99)
    expect(actualizado.descripcion).toBe('Nueva desc')
  })
})
