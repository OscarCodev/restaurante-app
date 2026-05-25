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
