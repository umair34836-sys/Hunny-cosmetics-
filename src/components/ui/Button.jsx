const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-600',
  secondary: 'bg-white text-ink border border-surface-border hover:bg-surface-muted',
  danger: 'bg-danger text-white hover:bg-red-700',
  ghost: 'bg-transparent text-ink-muted hover:bg-surface-muted',
  success: 'bg-success text-white hover:bg-emerald-700',
}

const sizes = {
  sm: 'text-sm px-3 py-1.5 min-h-[36px]',
  md: 'text-sm px-4 py-2.5 min-h-[44px]',
  lg: 'text-base px-5 py-3 min-h-[48px]',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
