import { redirect } from 'next/navigation'
import { getAuthUser } from '@/infrastructure/auth/getCurrentUser'
import { createContainer } from '@/container'
import MesaGrid from '@/components/mesas/MesaGrid'

export default async function MesasPage() {
  const user = await getAuthUser()
  if (!user) redirect('/login')

  const mesas = await createContainer().getMesasConEstado.execute()

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Vista de planta</h1>

        <div className="flex items-center gap-3">
          {user.rol === 'admin' && (
            <details className="relative">
              <summary className="list-none cursor-pointer select-none flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                Admin
                <span className="text-xs opacity-60">▾</span>
              </summary>
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 py-1 w-44 z-20">
                <a href="/admin/productos" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Productos
                </a>
                <a href="/admin/mesas" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Mesas
                </a>
                <a href="/admin/historial" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  Historial
                </a>
              </div>
            </details>
          )}

          <span className="text-sm text-slate-500 hidden sm:block">{user.nombre}</span>

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

      <main className="p-6">
        <MesaGrid initialMesas={mesas} />
      </main>
    </div>
  )
}
