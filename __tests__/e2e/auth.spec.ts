import { test, expect } from '@playwright/test'
import { e2eCredentials } from './credentials'

test.describe('Autenticación', () => {
  test('muestra el formulario de login', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /restaurante/i })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible()
  })

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'noexiste@restaurante.com')
    await page.fill('input[type="password"]', 'clavewrong')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/email o contraseña inválidos|no se pudo iniciar/i)).toBeVisible()
    await expect(page).toHaveURL('/login')
  })

  test('redirige a /mesas con credenciales válidas', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', e2eCredentials.meseroEmail)
    await page.fill('input[type="password"]', e2eCredentials.meseroPassword)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/mesas')
  })

  test('puede alternar visibilidad de la contraseña', async ({ page }) => {
    await page.goto('/login')
    const input = page.locator('input[type="password"]')
    await expect(input).toHaveAttribute('type', 'password')

    await page.click('button[tabindex="-1"]')
    await expect(page.locator('input[type="text"]')).toBeVisible()

    await page.click('button[tabindex="-1"]')
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('redirige a /login cuando se accede a /mesas sin sesión', async ({ page }) => {
    await page.goto('/mesas')
    await expect(page).toHaveURL('/login')
  })

  test('redirige a /login cuando se accede a /admin sin sesión', async ({ page }) => {
    await page.goto('/admin/productos')
    await expect(page).toHaveURL('/login')
  })
})
