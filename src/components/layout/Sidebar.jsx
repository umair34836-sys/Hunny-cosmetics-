import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ShoppingCart, Package, Receipt, BarChart3, Settings, Sparkles, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'

function NavItem({ to, icon: Icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
          isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
        }`
      }
    >
      <Icon size={18} aria-hidden="true" />
      {label}
    </NavLink>
  )
}

export default function Sidebar({ open, onClose }) {
  const { isAdmin } = useAuth()
  const { t } = useLanguage()

  const items = [
    { to: '/', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/pos', icon: ShoppingCart, label: t('nav.pos') },
    { to: '/products', icon: Package, label: t('nav.products') },
    { to: '/sales', icon: Receipt, label: t('nav.sales') },
  ]
  const adminItems = [
    { to: '/reports', icon: BarChart3, label: t('nav.reports') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ]

  const content = (
    <>
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Sparkles size={18} />
        </div>
        <span className="text-base font-semibold text-ink">{t('app.name')}</span>
        <button onClick={onClose} className="ms-auto rounded-lg p-1.5 text-ink-muted hover:bg-surface-muted lg:hidden cursor-pointer" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {items.map((item) => (
          <NavItem key={item.to} {...item} onNavigate={onClose} />
        ))}
        {isAdmin && (
          <>
            <div className="mt-3 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-ink-soft">{t('settings.title')}</div>
            {adminItems.map((item) => (
              <NavItem key={item.to} {...item} onNavigate={onClose} />
            ))}
          </>
        )}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 z-30 bg-ink/40 lg:hidden" onClick={onClose} aria-hidden="true" />}
      <aside
        className={`fixed inset-y-0 start-0 z-40 w-64 transform border-e border-surface-border bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  )
}
