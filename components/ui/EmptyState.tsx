interface EmptyStateProps {
  mensaje: string
  descripcion?: string
}

export default function EmptyState({ mensaje, descripcion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-lg font-medium text-slate-500">{mensaje}</p>
      {descripcion && <p className="text-sm text-slate-400 mt-1">{descripcion}</p>}
    </div>
  )
}
