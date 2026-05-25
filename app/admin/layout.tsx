import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase.from('perfiles').select('nombre, rol').eq('id', user.id).single()
  if (perfil?.rol !== 'admin') redirect('/mesas')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/mesas" className="text-slate-500 hover:text-slate-900 text-sm">← Planta</a>
          <nav className="flex gap-4 text-sm font-medium">
            <a href="/admin/productos" className="text-slate-600 hover:text-slate-900">Productos</a>
            <a href="/admin/mesas" className="text-slate-600 hover:text-slate-900">Mesas</a>
            <a href="/admin/historial" className="text-slate-600 hover:text-slate-900">Historial</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{perfil?.nombre} (admin)</span>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="text-sm text-red-600 hover:text-red-800">Salir</button>
          </form>
        </div>
      </header>
      <main className="p-6 max-w-6xl mx-auto">{children}</main>
    </div>
  )
}
