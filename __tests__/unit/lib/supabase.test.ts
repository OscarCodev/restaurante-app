import { createBrowserClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: jest.fn(),
  createServerClient: jest.fn(),
}))

jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('Supabase client wrappers', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key'
    jest.clearAllMocks()
  })

  it('createClient del browser pasa las variables de entorno', () => {
    const browserClient = { from: jest.fn() }
    ;(createBrowserClient as jest.Mock).mockReturnValue(browserClient)

    expect(createBrowserSupabaseClient()).toBe(browserClient)
    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key'
    )
  })

  it('createClient del servidor expone getAll y setAll de cookies', async () => {
    const cookieStore = {
      getAll: jest.fn().mockReturnValue([{ name: 'sb', value: 'token' }]),
      set: jest.fn(),
    }
    const serverClient = { auth: jest.fn() }
    ;(cookies as jest.Mock).mockResolvedValue(cookieStore)
    ;(require('@supabase/ssr').createServerClient as jest.Mock).mockReturnValue(serverClient)

    const client = await createServerSupabaseClient()

    expect(client).toBe(serverClient)
    expect(require('@supabase/ssr').createServerClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'anon-key',
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    )

    const options = (require('@supabase/ssr').createServerClient as jest.Mock).mock.calls[0][2]
    expect(options.cookies.getAll()).toEqual([{ name: 'sb', value: 'token' }])
    options.cookies.setAll([{ name: 'sb', value: 'new-token', options: { path: '/' } }])
    expect(cookieStore.set).toHaveBeenCalledWith('sb', 'new-token', { path: '/' })
  })
})