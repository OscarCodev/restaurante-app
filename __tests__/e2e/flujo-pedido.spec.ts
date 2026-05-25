import { test, expect } from '@playwright/test'
import { e2eCredentials } from './credentials'

test.describe('Flujo completo de pedido', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', e2eCredentials.meseroEmail)
    await page.fill('input[type="password"]', e2eCredentials.meseroPassword)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/mesas')
  })

  test('abrir pedido, agregar ítems y cobrar', async ({ page }) => {
    await expect(page.getByText('Mesa 1')).toBeVisible()

    await page.getByText('Mesa 1').click()
    await expect(page.getByText('Abrir pedido')).toBeVisible()
    await page.fill('input[type="number"]', '2')
    await page.getByRole('button', { name: /abrir mesa/i }).click()

    await expect(page).toHaveURL(/\/mesas\//)
    await expect(page.getByText(/mesa 1/i)).toBeVisible()

    await page.getByText('Lomo saltado').locator('..').getByRole('button', { name: '+' }).click()
    await expect(page.getByText('Lomo saltado')).toBeVisible()

    await page.getByText('Chicha morada').locator('..').getByRole('button', { name: '+' }).click()

    await expect(page.getByText('S/ 40.50')).toBeVisible()

    await page.getByRole('button', { name: /cobrar/i }).click()
    await expect(page.getByText(/confirmar cobro/i)).toBeVisible()
    await page.getByRole('button', { name: /confirmar/i }).click()

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
