# Plan de pruebas — Sistema de restaurante

**Proyecto:** Sistema de pedidos de restaurante  
**Stack:** Next.js 14 + Supabase + Jest + React Testing Library + Playwright  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## Referencia a artefactos anteriores

| Referencia | Artefacto |
|---|---|
| `[REQ]` | `requerimientos.md` |
| `[HU]` | `historias-de-usuario.md` |
| `[MOD]` | `modelo-datos.md` |
| `[API]` | `diseno-api.md` |
| `[IMP]` | `plan-implementacion.md` |

---

## Tipos de prueba contemplados

| Tipo | Herramienta | Qué cubre |
|---|---|---|
| Unitarias | Jest | Lógica de negocio, validaciones, utilidades |
| Componentes | Jest + React Testing Library | Client Components de React |
| Integración con DB | Jest + Supabase real (schema de test) | Funciones de `lib/supabase/` |
| Cobertura | Istanbul (incluido en Jest) | Reporte línea a línea |
| End-to-end | Playwright | Flujos completos de usuario |

---

## 1. Instalación y configuración

### 1.1 Instalar dependencias

```bash
npm install -D \
  jest \
  jest-environment-jsdom \
  @jest/globals \
  ts-jest \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  dotenv
```

### 1.2 Configuración de Jest — `jest.config.ts`

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testPathPattern: [
    '<rootDir>/__tests__/unit/**/*.test.ts',
    '<rootDir>/__tests__/components/**/*.test.tsx',
  ],
  // Cobertura de código
  collectCoverage: false, // se activa con --coverage
  collectCoverageFrom: [
    'lib/supabase/**/*.ts',
    'app/api/**/*.ts',
    'components/**/*.tsx',
    'lib/validaciones.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches:   70,
      functions:  75,
      lines:      75,
      statements: 75,
    },
    // Umbral específico para la capa de datos (más crítica)
    './lib/supabase/': {
      branches:   80,
      functions:  85,
      lines:      85,
      statements: 85,
    },
  },
}

export default createJestConfig(config)
```

### 1.3 Setup global — `jest.setup.ts`

```typescript
import '@testing-library/jest-dom'

// Silenciar console.error en tests para reducir ruido
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning:')) return
    originalError(...args)
  }
})
afterAll(() => { console.error = originalError })
```

### 1.4 Scripts en `package.json`

```json
"scripts": {
  "test":              "jest",
  "test:watch":        "jest --watch",
  "test:coverage":     "jest --coverage",
  "test:integration":  "jest --testPathPattern=__tests__/integration",
  "test:e2e":          "playwright test",
  "test:all":          "npm run test:coverage && npm run test:e2e"
}
```

### 1.5 Variables de entorno para pruebas — `.env.test`

```env
# Proyecto Supabase dedicado a pruebas (distinto del de producción)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx-test.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...test...
TEST_SUPABASE_SERVICE_KEY=eyJhbGc...service...
```

> **Importante:** usar un proyecto Supabase separado para pruebas. Los tests de integración crean y eliminan datos reales; nunca deben apuntar a producción.

---

## 2. Estructura de carpetas de pruebas

```
__tests__/
├── unit/
│   ├── lib/
│   │   ├── validaciones.test.ts       # Esquemas Zod
│   │   └── calculos.test.ts           # Lógica de subtotales y totales
│   └── api/
│       ├── pedidos.test.ts            # Lógica de las API routes
│       └── productos.test.ts
├── components/
│   ├── MesaCard.test.tsx
│   ├── PedidoDetalle.test.tsx
│   └── AgregarItemForm.test.tsx
├── integration/
│   ├── setup.ts                       # Helpers: limpiar tablas, crear fixtures
│   ├── mesas.integration.test.ts
│   ├── productos.integration.test.ts
│   ├── pedidos.integration.test.ts
│   └── detalle.integration.test.ts
└── e2e/
    ├── auth.spec.ts
    ├── flujo-pedido.spec.ts
    └── admin.spec.ts
```

---

## 3. Pruebas unitarias

Las pruebas unitarias no se conectan a ninguna base de datos. Toda dependencia externa se simula con mocks de Jest.

### 3.1 Validaciones — `__tests__/unit/lib/validaciones.test.ts`

Cubre `[REQ]` RF-02.1, RF-03.2 y los criterios de `[HU]` HU-09.

```typescript
import { productoSchema } from '@/lib/validaciones'

describe('productoSchema', () => {

  describe('campos válidos', () => {
    it('acepta un producto completo y correcto', () => {
      const resultado = productoSchema.safeParse({
        nombre:      'Lomo saltado',
        descripcion: 'Con papas fritas',
        precio:      32.00,
        categoria:   'principal',
      })
      expect(resultado.success).toBe(true)
    })

    it('acepta producto sin descripción (campo opcional)', () => {
      const resultado = productoSchema.safeParse({
        nombre:    'Chicha morada',
        precio:    8.50,
        categoria: 'bebida',
      })
      expect(resultado.success).toBe(true)
    })
  })

  describe('nombre', () => {
    it('rechaza nombre vacío', () => {
      const resultado = productoSchema.safeParse({
        nombre: '', precio: 10, categoria: 'bebida',
      })
      expect(resultado.success).toBe(false)
      expect(resultado.error?.issues[0].message).toBe('El nombre es requerido')
    })
  })

  describe('precio', () => {
    it('rechaza precio de 0', () => {
      const resultado = productoSchema.safeParse({
        nombre: 'Agua', precio: 0, categoria: 'bebida',
      })
      expect(resultado.success).toBe(false)
    })

    it('rechaza precio negativo', () => {
      const resultado = productoSchema.safeParse({
        nombre: 'Agua', precio: -5, categoria: 'bebida',
      })
      expect(resultado.success).toBe(false)
    })

    it('acepta precio decimal válido', () => {
      const resultado = productoSchema.safeParse({
        nombre: 'Agua', precio: 3.50, categoria: 'bebida',
      })
      expect(resultado.success).toBe(true)
    })
  })

  describe('categoría', () => {
    it('rechaza categoría no contemplada', () => {
      const resultado = productoSchema.safeParse({
        nombre: 'X', precio: 10, categoria: 'desayuno',
      })
      expect(resultado.success).toBe(false)
    })

    it.each(['entrada', 'principal', 'bebida', 'postre'])(
      'acepta categoría válida: %s', (categoria) => {
        const resultado = productoSchema.safeParse({
          nombre: 'X', precio: 10, categoria,
        })
        expect(resultado.success).toBe(true)
      }
    )
  })
})
```

---

### 3.2 Cálculos — `__tests__/unit/lib/calculos.test.ts`

Cubre la lógica de subtotales y totales de `[MOD]` §5 (trigger) y `[HU]` HU-05.

```typescript
import {
  calcularSubtotal,
  calcularTotalPedido,
  formatearPrecio,
} from '@/lib/calculos'

describe('calcularSubtotal', () => {
  it('multiplica cantidad por precio unitario', () => {
    expect(calcularSubtotal(2, 32.00)).toBe(64.00)
  })

  it('maneja precios decimales sin error de punto flotante', () => {
    expect(calcularSubtotal(3, 8.50)).toBe(25.50)
  })

  it('devuelve 0 si cantidad es 0', () => {
    expect(calcularSubtotal(0, 32.00)).toBe(0)
  })
})

describe('calcularTotalPedido', () => {
  it('suma los subtotales de todos los ítems', () => {
    const items = [
      { subtotal: 64.00 },
      { subtotal: 8.50 },
      { subtotal: 18.00 },
    ]
    expect(calcularTotalPedido(items)).toBe(90.50)
  })

  it('devuelve 0 para pedido sin ítems', () => {
    expect(calcularTotalPedido([])).toBe(0)
  })

  it('maneja un único ítem', () => {
    expect(calcularTotalPedido([{ subtotal: 28.00 }])).toBe(28.00)
  })
})

describe('formatearPrecio', () => {
  it('formatea número como moneda peruana', () => {
    expect(formatearPrecio(32)).toBe('S/ 32.00')
  })

  it('formatea decimales correctamente', () => {
    expect(formatearPrecio(8.5)).toBe('S/ 8.50')
  })
})
```

---

### 3.3 Lógica de API routes — `__tests__/unit/api/pedidos.test.ts`

Prueba la lógica de negocio de las routes con Supabase mockeado.

```typescript
import { POST } from '@/app/api/pedidos/route'
import { NextRequest } from 'next/server'

// Mock del cliente de Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

import { createClient } from '@/lib/supabase/server'

const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
})

describe('POST /api/pedidos', () => {

  it('devuelve 401 si no hay sesión activa', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ mesa_id: 'uuid-mesa', comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it('devuelve 400 si faltan campos requeridos', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-user' } },
    })

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ comensales: 2 }), // falta mesa_id
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('devuelve 409 si la mesa está ocupada', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-user' } },
    })

    // Simular mesa ocupada
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq:     jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'uuid-mesa', estado: 'ocupada' },
        error: null,
      }),
    })

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ mesa_id: 'uuid-mesa', comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.code).toBe('MESA_OCUPADA')
  })

  it('crea el pedido y devuelve 201 si la mesa está libre', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'uuid-user' } },
    })

    const pedidoCreado = {
      id: 'uuid-pedido',
      mesa_id: 'uuid-mesa',
      usuario_id: 'uuid-user',
      estado: 'abierto',
      total: 0,
      comensales: 2,
    }

    mockSupabase.from
      .mockReturnValueOnce({                        // consulta estado de mesa
        select: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'uuid-mesa', estado: 'libre' }, error: null,
        }),
      })
      .mockReturnValueOnce({                        // insert pedido
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: pedidoCreado, error: null }),
      })
      .mockReturnValueOnce({                        // update estado mesa
        update: jest.fn().mockReturnThis(),
        eq:     jest.fn().mockResolvedValue({ error: null }),
      })

    const request = new NextRequest('http://localhost/api/pedidos', {
      method: 'POST',
      body: JSON.stringify({ mesa_id: 'uuid-mesa', comensales: 2 }),
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.estado).toBe('abierto')
    expect(body.total).toBe(0)
  })
})

describe('PUT /api/pedidos/[id]/cerrar', () => {
  it('devuelve 400 si el pedido no tiene ítems', async () => {
    // ... implementar con mock de detalle_pedido vacío
  })

  it('devuelve 409 si el pedido ya está cerrado', async () => {
    // ... implementar con mock de pedido con estado = 'cerrado'
  })
})
```

---

## 4. Pruebas de componentes

### 4.1 MesaCard — `__tests__/components/MesaCard.test.tsx`

Cubre `[HU]` HU-03.

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MesaCard } from '@/components/mesas/MesaCard'
import type { Mesa } from '@/types/database'

const mesaLibre: Mesa = {
  id: 'uuid-1', numero: 3, capacidad: 4,
  estado: 'libre', created_at: '2026-01-01T00:00:00Z',
}

const mesaOcupada: Mesa = {
  id: 'uuid-2', numero: 5, capacidad: 6,
  estado: 'ocupada', created_at: '2026-01-01T00:00:00Z',
}

describe('MesaCard', () => {
  it('muestra el número de mesa', () => {
    render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(screen.getByText('Mesa 3')).toBeInTheDocument()
  })

  it('muestra la capacidad', () => {
    render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(screen.getByText(/4 pax/i)).toBeInTheDocument()
  })

  it('muestra "Libre" cuando la mesa está libre', () => {
    render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(screen.getByText(/libre/i)).toBeInTheDocument()
  })

  it('muestra "Ocupada" cuando la mesa está ocupada', () => {
    render(<MesaCard mesa={mesaOcupada} onClick={jest.fn()} />)
    expect(screen.getByText(/ocupada/i)).toBeInTheDocument()
  })

  it('aplica clase verde cuando está libre', () => {
    const { container } = render(<MesaCard mesa={mesaLibre} onClick={jest.fn()} />)
    expect(container.firstChild).toHaveClass('border-green-500')
  })

  it('aplica clase roja cuando está ocupada', () => {
    const { container } = render(<MesaCard mesa={mesaOcupada} onClick={jest.fn()} />)
    expect(container.firstChild).toHaveClass('border-red-500')
  })

  it('llama a onClick al hacer clic', async () => {
    const handleClick = jest.fn()
    render(<MesaCard mesa={mesaLibre} onClick={handleClick} />)
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
    expect(handleClick).toHaveBeenCalledWith(mesaLibre)
  })
})
```

---

### 4.2 PedidoDetalle — `__tests__/components/PedidoDetalle.test.tsx`

Cubre `[HU]` HU-05, HU-06, HU-07, HU-08.

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PedidoDetalle } from '@/components/pedidos/PedidoDetalle'

const itemsMock = [
  {
    id: 'item-1', pedido_id: 'p-1', producto_id: 'prod-1',
    cantidad: 2, precio_unitario: 32.00, subtotal: 64.00,
    created_at: '',
    producto: { id: 'prod-1', nombre: 'Lomo saltado', categoria: 'principal' },
  },
  {
    id: 'item-2', pedido_id: 'p-1', producto_id: 'prod-2',
    cantidad: 1, precio_unitario: 8.50, subtotal: 8.50,
    created_at: '',
    producto: { id: 'prod-2', nombre: 'Chicha morada', categoria: 'bebida' },
  },
]

describe('PedidoDetalle', () => {
  it('muestra todos los ítems del pedido', () => {
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByText('Lomo saltado')).toBeInTheDocument()
    expect(screen.getByText('Chicha morada')).toBeInTheDocument()
  })

  it('muestra el total correctamente formateado', () => {
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByText('S/ 72.50')).toBeInTheDocument()
  })

  it('el botón Cobrar está habilitado cuando hay ítems', () => {
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByRole('button', { name: /cobrar/i })).toBeEnabled()
  })

  it('el botón Cobrar está deshabilitado cuando no hay ítems', () => {
    render(
      <PedidoDetalle items={[]} total={0}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByRole('button', { name: /cobrar/i })).toBeDisabled()
  })

  it('llama a onEliminar con el id correcto al eliminar un ítem', async () => {
    const handleEliminar = jest.fn()
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={handleEliminar} onCobrar={jest.fn()} />
    )
    const botonesEliminar = screen.getAllByRole('button', { name: /eliminar/i })
    await userEvent.click(botonesEliminar[0])
    expect(handleEliminar).toHaveBeenCalledWith('item-1')
  })

  it('llama a onCobrar al confirmar el cobro', async () => {
    const handleCobrar = jest.fn()
    render(
      <PedidoDetalle items={itemsMock} total={72.50}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={handleCobrar} />
    )
    await userEvent.click(screen.getByRole('button', { name: /cobrar/i }))
    expect(handleCobrar).toHaveBeenCalledTimes(1)
  })

  it('muestra empty state cuando no hay ítems', () => {
    render(
      <PedidoDetalle items={[]} total={0}
        onEditar={jest.fn()} onEliminar={jest.fn()} onCobrar={jest.fn()} />
    )
    expect(screen.getByText(/no hay ítems/i)).toBeInTheDocument()
  })
})
```

---

## 5. Pruebas de integración con base de datos

Estas pruebas se conectan al proyecto Supabase de pruebas definido en `.env.test`. Usan datos reales pero los limpian antes y después de cada test.

### 5.1 Setup de integración — `__tests__/integration/setup.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

// Cliente con service key para poder limpiar sin restricciones RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.TEST_SUPABASE_SERVICE_KEY!
)

// Fixtures reutilizables
export async function crearMesaTest(numero = 99, capacidad = 4) {
  const { data, error } = await supabaseAdmin
    .from('mesas')
    .insert({ numero, capacidad })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function crearProductoTest(override = {}) {
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

// Limpieza: eliminar datos en orden (respetando foreign keys)
export async function limpiarDatosTest(mesaIds: string[], usuarioIds: string[]) {
  await supabaseAdmin.from('detalle_pedido').delete()
    .in('pedido_id',
      (await supabaseAdmin.from('pedidos').select('id').in('mesa_id', mesaIds)).data?.map(p => p.id) ?? []
    )
  await supabaseAdmin.from('pedidos').delete().in('mesa_id', mesaIds)
  await supabaseAdmin.from('mesas').delete().in('id', mesaIds)
  for (const id of usuarioIds) {
    await supabaseAdmin.auth.admin.deleteUser(id)
  }
}
```

---

### 5.2 Pruebas de mesas — `__tests__/integration/mesas.integration.test.ts`

```typescript
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
```

---

### 5.3 Pruebas de pedidos — `__tests__/integration/pedidos.integration.test.ts`

```typescript
import { crearPedido, getPedidoConDetalle, cerrarPedido } from '@/lib/supabase/pedidos'
import { agregarItem } from '@/lib/supabase/detalle'
import { crearMesaTest, crearProductoTest, crearUsuarioTest, limpiarDatosTest, supabaseAdmin } from './setup'

describe('crearPedido — integración con Supabase', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string

  beforeEach(async () => {
    const [mesa, usuario] = await Promise.all([crearMesaTest(96), crearUsuarioTest()])
    mesaId = mesa.id
    usuarioId = usuario.id
  })

  afterEach(async () => {
    if (pedidoId) {
      await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    }
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('crea el pedido en estado abierto con total 0', async () => {
    const pedido = await crearPedido(mesaId, usuarioId, 2)
    pedidoId = pedido.id

    expect(pedido.estado).toBe('abierto')
    expect(pedido.total).toBe(0)
    expect(pedido.comensales).toBe(2)
  })

  it('actualiza la mesa a estado ocupada al crear el pedido', async () => {
    const pedido = await crearPedido(mesaId, usuarioId, 3)
    pedidoId = pedido.id

    const { data: mesa } = await supabaseAdmin
      .from('mesas').select('estado').eq('id', mesaId).single()
    expect(mesa?.estado).toBe('ocupada')
  })
})

describe('trigger recalcular_total_pedido', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string
  let productoId: string

  beforeEach(async () => {
    const [mesa, usuario, producto] = await Promise.all([
      crearMesaTest(95),
      crearUsuarioTest(),
      crearProductoTest({ nombre: 'Test producto', precio: 20.00 }),
    ])
    mesaId = mesa.id
    usuarioId = usuario.id
    productoId = producto.id

    const pedido = await crearPedido(mesaId, usuarioId, 1)
    pedidoId = pedido.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('detalle_pedido').delete().eq('pedido_id', pedidoId)
    await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    await supabaseAdmin.from('productos').delete().eq('id', productoId)
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('recalcula el total al insertar un ítem', async () => {
    await agregarItem(pedidoId, productoId, 2)

    const { data } = await supabaseAdmin
      .from('pedidos').select('total').eq('id', pedidoId).single()
    expect(Number(data?.total)).toBe(40.00)
  })

  it('recalcula el total al agregar múltiples ítems', async () => {
    const producto2 = await crearProductoTest({ nombre: 'Test 2', precio: 15.00 })

    await agregarItem(pedidoId, productoId, 1)   // 20.00
    await agregarItem(pedidoId, producto2.id, 3)  // 45.00

    const { data } = await supabaseAdmin
      .from('pedidos').select('total').eq('id', pedidoId).single()
    expect(Number(data?.total)).toBe(65.00)

    await supabaseAdmin.from('productos').delete().eq('id', producto2.id)
  })

  it('recalcula el total a 0 al eliminar todos los ítems', async () => {
    const item = await agregarItem(pedidoId, productoId, 2)
    await supabaseAdmin.from('detalle_pedido').delete().eq('id', item.id)

    const { data } = await supabaseAdmin
      .from('pedidos').select('total').eq('id', pedidoId).single()
    expect(Number(data?.total)).toBe(0)
  })
})

describe('cerrarPedido — integración con Supabase', () => {
  let mesaId: string
  let usuarioId: string
  let pedidoId: string

  beforeEach(async () => {
    const [mesa, usuario] = await Promise.all([crearMesaTest(94), crearUsuarioTest()])
    mesaId = mesa.id
    usuarioId = usuario.id
    const pedido = await crearPedido(mesaId, usuarioId, 2)
    pedidoId = pedido.id
  })

  afterEach(async () => {
    await supabaseAdmin.from('pedidos').delete().eq('id', pedidoId)
    await limpiarDatosTest([mesaId], [usuarioId])
  })

  it('cierra el pedido y registra fecha_cierre', async () => {
    await cerrarPedido(pedidoId, mesaId)

    const { data } = await supabaseAdmin
      .from('pedidos').select('estado, fecha_cierre').eq('id', pedidoId).single()
    expect(data?.estado).toBe('cerrado')
    expect(data?.fecha_cierre).not.toBeNull()
  })

  it('libera la mesa al cerrar el pedido', async () => {
    await cerrarPedido(pedidoId, mesaId)

    const { data } = await supabaseAdmin
      .from('mesas').select('estado').eq('id', mesaId).single()
    expect(data?.estado).toBe('libre')
  })
})
```

---

## 6. Cobertura de código

### 6.1 Generar el reporte

```bash
npm run test:coverage
```

Esto genera:
- **Terminal:** resumen por archivo con porcentajes.
- **`/coverage/lcov-report/index.html`:** reporte visual navegable línea a línea.

### 6.2 Ejemplo de salida esperada en terminal

```
------------------------|---------|----------|---------|---------|
File                    | % Stmts | % Branch | % Funcs | % Lines |
------------------------|---------|----------|---------|---------|
lib/supabase/           |         |          |         |         |
  mesas.ts              |   92.00 |    85.71 |  100.00 |   92.00 |
  pedidos.ts            |   88.00 |    80.00 |   87.50 |   88.00 |
  detalle.ts            |   90.00 |    83.33 |  100.00 |   90.00 |
  productos.ts          |   87.50 |    75.00 |   85.71 |   87.50 |
lib/                    |         |          |         |         |
  validaciones.ts       |  100.00 |   100.00 |  100.00 |  100.00 |
  calculos.ts           |  100.00 |   100.00 |  100.00 |  100.00 |
app/api/pedidos/        |         |          |         |         |
  route.ts              |   85.00 |    78.57 |   80.00 |   85.00 |
components/             |         |          |         |         |
  mesas/MesaCard.tsx    |   95.00 |    90.00 |  100.00 |   95.00 |
  pedidos/PedidoDetalle |   88.00 |    83.33 |   90.00 |   88.00 |
------------------------|---------|----------|---------|---------|
All files               |   90.27 |    84.49 |   92.80 |   90.27 |
------------------------|---------|----------|---------|---------|
```

### 6.3 Umbrales configurados

| Alcance | Branches | Functions | Lines | Statements |
|---|---|---|---|---|
| Global | 70 % | 75 % | 75 % | 75 % |
| `lib/supabase/` | 80 % | 85 % | 85 % | 85 % |

Si algún umbral no se alcanza, `jest --coverage` termina con código de salida 1 (falla el pipeline de CI).

### 6.4 Interpretar el reporte HTML

Al abrir `coverage/lcov-report/index.html`:

- **Verde** — línea ejecutada por al menos un test.
- **Rojo** — línea nunca ejecutada (falta cobertura).
- **Amarillo** — rama parcialmente cubierta (ej. se probó el `if` pero no el `else`).

Al hacer clic en un archivo se ve el código fuente coloreado con el número de veces que cada línea fue ejecutada.

---

## 7. Pruebas end-to-end con Playwright

### 7.1 Configuración — `playwright.config.ts`

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

### 7.2 Flujo completo de pedido — `__tests__/e2e/flujo-pedido.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Flujo completo de pedido', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'mesero@restaurante.com')
    await page.fill('input[type="password"]', 'test1234')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/mesas')
  })

  test('abrir pedido, agregar ítems y cobrar', async ({ page }) => {
    // Ver vista de planta
    await expect(page.getByText('Mesa 1')).toBeVisible()

    // Abrir pedido en mesa libre
    await page.getByText('Mesa 1').click()
    await expect(page.getByText('Abrir pedido')).toBeVisible()
    await page.fill('input[type="number"]', '2')
    await page.getByRole('button', { name: /abrir mesa/i }).click()

    // Estamos en el detalle del pedido
    await expect(page).toHaveURL(/\/mesas\//)
    await expect(page.getByText(/mesa 1/i)).toBeVisible()

    // Agregar ítem: Lomo saltado
    await page.getByText('Lomo saltado').locator('..').getByRole('button', { name: '+' }).click()
    await expect(page.getByText('Lomo saltado')).toBeVisible()

    // Agregar ítem: Chicha morada
    await page.getByText('Chicha morada').locator('..').getByRole('button', { name: '+' }).click()

    // Verificar total
    await expect(page.getByText('S/ 40.50')).toBeVisible()

    // Cobrar
    await page.getByRole('button', { name: /cobrar/i }).click()
    await expect(page.getByText(/confirmar cobro/i)).toBeVisible()
    await page.getByRole('button', { name: /confirmar/i }).click()

    // Volver a vista de planta, mesa libre
    await expect(page).toHaveURL('/mesas')
    await expect(page.getByText('Mesa 1').locator('..').getByText(/libre/i)).toBeVisible()
  })

  test('el botón Cobrar está deshabilitado sin ítems', async ({ page }) => {
    await page.getByText('Mesa 2').click()
    await page.fill('input[type="number"]', '1')
    await page.getByRole('button', { name: /abrir mesa/i }).click()

    await expect(page.getByRole('button', { name: /cobrar/i })).toBeDisabled()
  })
})
```

---

## 8. Checklist de pruebas

- [ ] `jest.config.ts` y `jest.setup.ts` configurados
- [ ] `.env.test` apunta a proyecto Supabase de pruebas (no producción)
- [ ] Pruebas unitarias de validaciones: todos los casos pasan (`npm test`)
- [ ] Pruebas unitarias de cálculos: todos los casos pasan
- [ ] Pruebas unitarias de API routes: mocks funcionan correctamente
- [ ] Pruebas de componentes: MesaCard y PedidoDetalle cubiertas
- [ ] Pruebas de integración: trigger de total verificado contra DB real
- [ ] Pruebas de integración: cerrar pedido libera la mesa en DB real
- [ ] `npm run test:coverage` supera umbrales (70 % global, 80 % en `lib/supabase/`)
- [ ] Reporte HTML generado en `/coverage/lcov-report/index.html`
- [ ] Pruebas e2e: flujo completo de pedido pasa en Playwright
- [ ] Todos los tests limpian sus datos en `afterEach` (no contaminan otras pruebas)
