import { test, expect } from '@playwright/test'
import { e2eCredentials } from './credentials'

test.describe('Panel de administración', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', e2eCredentials.adminEmail)
    await page.fill('input[type="password"]', e2eCredentials.adminPassword)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/mesas')
  })

  test.describe('Gestión de productos', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/admin/productos')
    })

    test('muestra la lista de productos', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /productos/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /nuevo producto/i })).toBeVisible()
    })

    test('abre el drawer al hacer clic en Nuevo producto', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo producto/i }).click()
      await expect(page.getByText(/nuevo producto/i)).toBeVisible()
      await expect(page.locator('input[name="nombre"]')).toBeVisible()
    })

    test('crea un nuevo producto con datos válidos', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo producto/i }).click()

      const nombre = `Producto test ${Date.now()}`
      await page.fill('input[name="nombre"]', nombre)
      await page.fill('input[name="precio"]', '18.50')
      await page.selectOption('select[name="categoria"]', 'postre')

      await page.getByRole('button', { name: /guardar/i }).click()

      await expect(page.getByText(nombre)).toBeVisible()
    })

    test('muestra error al intentar crear producto con nombre vacío', async ({ page }) => {
      await page.getByRole('button', { name: /nuevo producto/i }).click()
      await page.fill('input[name="precio"]', '10')
      await page.selectOption('select[name="categoria"]', 'bebida')
      await page.getByRole('button', { name: /guardar/i }).click()

      await expect(page.getByText(/nombre/i)).toBeVisible()
    })

    test('puede editar un producto existente', async ({ page }) => {
      const filas = page.getByRole('row')
      const count = await filas.count()
      if (count <= 1) test.skip()

      await filas.nth(1).getByRole('button', { name: /editar/i }).click()
      await expect(page.locator('input[name="nombre"]')).toBeVisible()
    })

    test('puede activar/desactivar un producto', async ({ page }) => {
      const filas = page.getByRole('row')
      const count = await filas.count()
      if (count <= 1) test.skip()

      const botonEstado = filas.nth(1).getByRole('button', { name: /activo|inactivo/i })
      const textoInicial = await botonEstado.textContent()
      await botonEstado.click()
      const textoNuevo = await botonEstado.textContent()
      expect(textoNuevo).not.toBe(textoInicial)
    })
  })

  test.describe('Mesero sin acceso admin', () => {
    test('mesero es redirigido al intentar acceder al panel admin', async ({ page }) => {
      await page.goto('/login')
      await page.fill('input[type="email"]', e2eCredentials.meseroEmail)
      await page.fill('input[type="password"]', e2eCredentials.meseroPassword)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/mesas')

      await page.goto('/admin/productos')
      await expect(page).not.toHaveURL('/admin/productos')
    })
  })
})
