export function calcularSubtotal(cantidad: number, precioUnitario: number): number {
  return Math.round(cantidad * precioUnitario * 100) / 100
}

export function calcularTotalPedido(items: { subtotal: number }[]): number {
  const total = items.reduce((sum, item) => sum + item.subtotal, 0)
  return Math.round(total * 100) / 100
}

export function formatearPrecio(precio: number): string {
  return `S/ ${precio.toFixed(2)}`
}
