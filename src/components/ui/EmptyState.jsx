export default function EmptyState({ icon: Icon, title, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-ink-soft">
          <Icon size={22} aria-hidden="true" />
        </div>
      )}
      <p className="max-w-xs text-sm text-ink-muted">{title}</p>
      {action}
    </div>
  )
}
