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
