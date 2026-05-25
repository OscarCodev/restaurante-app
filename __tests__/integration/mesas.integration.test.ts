import { getMesas, updateEstadoMesa } from '@/lib/supabase/mesas'
import { crearMesaTest, limpiarDatosTest, supabaseAdmin } from './setup'

describe('getMesas — integración con Supabase', () => {
  let mesaId: string

  beforeEach(async () => {
    const mesa = await crearMesaTest(98)
    mesaId = mesa.id
  })

  afterEach(async () => {
    await limpiarDatosTest([mesaId], [])
  })

  it('devuelve todas las mesas incluyendo la recién creada', async () => {
    const mesas = await getMesas()
    const encontrada = mesas.find(m => m.id === mesaId)
    expect(encontrada).toBeDefined()
    expect(encontrada?.numero).toBe(98)
    expect(encontrada?.estado).toBe('libre')
  })

  it('devuelve las mesas ordenadas por número', async () => {
    const mesas = await getMesas()
    const numeros = mesas.map(m => m.numero)
    const ordenados = [...numeros].sort((a, b) => a - b)
    expect(numeros).toEqual(ordenados)
  })
})

describe('updateEstadoMesa — integración con Supabase', () => {
  let mesaId: string

  beforeEach(async () => {
    const mesa = await crearMesaTest(97)
    mesaId = mesa.id
  })

  afterEach(async () => {
    await limpiarDatosTest([mesaId], [])
  })

  it('cambia estado de libre a ocupada correctamente', async () => {
    await updateEstadoMesa(mesaId, 'ocupada')

    const { data } = await supabaseAdmin
      .from('mesas').select('estado').eq('id', mesaId).single()
    expect(data?.estado).toBe('ocupada')
  })

  it('cambia estado de ocupada a libre correctamente', async () => {
    await supabaseAdmin.from('mesas').update({ estado: 'ocupada' }).eq('id', mesaId)
    await updateEstadoMesa(mesaId, 'libre')

    const { data } = await supabaseAdmin
      .from('mesas').select('estado').eq('id', mesaId).single()
    expect(data?.estado).toBe('libre')
  })
})
