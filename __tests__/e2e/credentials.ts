import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export const e2eCredentials = {
  adminEmail: process.env.E2E_ADMIN_EMAIL ?? 'admin@restaurante.com',
  adminPassword: process.env.E2E_ADMIN_PASSWORD ?? 'test1234',
  meseroEmail: process.env.E2E_MESERO_EMAIL ?? 'mesero@restaurante.com',
  meseroPassword: process.env.E2E_MESERO_PASSWORD ?? 'test1234',
}