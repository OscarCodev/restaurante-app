'use client'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/admin/productos', label: 'Productos', emoji: '🍴' },
  { href: '/admin/mesas',     label: 'Mesas',     emoji: '🪑' },
  { href: '/admin/historial', label: 'Historial', emoji: '📋' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="flex gap-1">
      {NAV.map(({ href, label, emoji }) => {
        const active = pathname === href
        return (
          <a
            key={href}
            href={href}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              active
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span className="text-sm">{emoji}</span>
            {label}
          </a>
        )
      })}
    </nav>
  )
}
