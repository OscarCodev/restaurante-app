import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!
)

export async function crearMesaTest(numero = 99, capacidad = 4) {
  const { data, error } = await supabaseAdmin
    .from('mesas')
    .insert({ numero, capacidad })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function crearProductoTest(override: Record<string, unknown> = {}) {
  const { data, error } = await supabaseAdmin
    .from('productos')
    .insert({
      nombre: 'Producto test',
      precio: 10.00,
      categoria: 'bebida',
      ...override,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function crearUsuarioTest() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: `test_${Date.now()}@test.com`,
    password: 'test1234',
    user_metadata: { nombre: 'Usuario Test' },
  })
  if (error) throw error
  return data.user
}

export async function limpiarDatosTest(mesaIds: string[], usuarioIds: string[]) {
  const { data: pedidos } = await supabaseAdmin
    .from('pedidos').select('id').in('mesa_id', mesaIds)
  const pedidoIds = pedidos?.map(p => p.id) ?? []

  if (pedidoIds.length > 0) {
    await supabaseAdmin.from('detalle_pedido').delete().in('pedido_id', pedidoIds)
    await supabaseAdmin.from('pedidos').delete().in('id', pedidoIds)
  }
  await supabaseAdmin.from('mesas').delete().in('id', mesaIds)
  for (const id of usuarioIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
}
