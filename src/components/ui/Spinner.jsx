import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-brand-600 ${className}`} aria-hidden="true" />
}

export function FullPageSpinner({ label }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-muted">
      <Spinner size={28} />
      {label && <p className="text-sm">{label}</p>}
    </div>
  )
}
