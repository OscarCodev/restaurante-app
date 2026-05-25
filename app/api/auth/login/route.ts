import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEV = process.env.NODE_ENV === 'development'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña requeridos', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ── PASO 1: autenticar ────────────────────────────────────────────────────
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError || !data.user) {
      console.error('[login] signInWithPassword FALLÓ:', {
        email,
        message:  authError?.message,
        status:   authError?.status,
        code:     authError?.code,
        name:     authError?.name,
      })
      return NextResponse.json(
        {
          error: DEV
            ? `Auth error: ${authError?.message ?? 'sin usuario'}`
            : 'Credenciales incorrectas',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      )
    }

    console.log('[login] Auth OK →', data.user.id, data.user.email)

    // ── PASO 2: leer perfil ───────────────────────────────────────────────────
    const { data: perfil, error: perfilError } = await supabase
      .from('perfiles')
      .select('nombre, rol')
      .eq('id', data.user.id)
      .single()

    if (perfilError) {
      console.error('[login] Error al leer perfiles:', {
        userId:  data.user.id,
        message: perfilError.message,
        code:    perfilError.code,
        details: perfilError.details,
        hint:    perfilError.hint,
      })
    }

    if (!perfil) {
      // El usuario existe en auth.users pero no en public.perfiles.
      // En producción esto es un error de configuración; en desarrollo
      // mostramos instrucciones claras.
      console.error('[login] Usuario sin fila en public.perfiles:', {
        userId: data.user.id,
        email:  data.user.email,
        meta:   data.user.user_metadata,
      })
      console.error(
        '[login] SOLUCIÓN: ejecuta en Supabase SQL Editor:\n' +
        `INSERT INTO public.perfiles (id, nombre, rol)\n` +
        `VALUES ('${data.user.id}', 'Administrador', 'admin');\n` +
        `-- o actualiza si ya existe:\n` +
        `UPDATE public.perfiles SET rol = 'admin' WHERE id = '${data.user.id}';`
      )
      return NextResponse.json(
        {
          error: DEV
            ? `Usuario autenticado pero sin perfil en public.perfiles. ` +
              `Ejecuta: INSERT INTO public.perfiles (id, nombre, rol) VALUES ('${data.user.id}', 'Administrador', 'admin');`
            : 'Cuenta sin configurar, contacta al administrador',
          code: 'PROFILE_MISSING',
        },
        { status: 500 }
      )
    }

    console.log('[login] Perfil OK →', { nombre: perfil.nombre, rol: perfil.rol })

    return NextResponse.json({
      usuario: { id: data.user.id, nombre: perfil.nombre, rol: perfil.rol },
    })
  } catch (err) {
    console.error('[login] Error inesperado:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
