import { createClient } from '@/infrastructure/supabase/server'
import { redirect } from 'next/navigation'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('nombre, rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') redirect('/mesas')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-5">
          <a href="/mesas" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
            <span>←</span>
            <span className="hidden sm:inline">Planta</span>
          </a>
          <div className="h-4 w-px bg-slate-200" />
          <AdminNav />
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:block">{perfil?.nombre}</span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="p-5 lg:p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  )
}
