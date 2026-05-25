interface BadgeProps {
  children: React.ReactNode
  variant?: 'green' | 'red' | 'gray' | 'blue' | 'yellow' | 'cyan' | 'pink' | 'amber'
  className?: string
}

const VARIANTS: Record<NonNullable<BadgeProps['variant']>, string> = {
  green:  'bg-green-100 text-green-800',
  red:    'bg-red-100 text-red-800',
  gray:   'bg-slate-100 text-slate-600',
  blue:   'bg-blue-100 text-blue-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  cyan:   'bg-cyan-100 text-cyan-800',
  pink:   'bg-pink-100 text-pink-800',
  amber:  'bg-amber-100 text-amber-800',
}

export default function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${VARIANTS[variant]} ${className}`}>
      {children}
    </span>
  )
}
