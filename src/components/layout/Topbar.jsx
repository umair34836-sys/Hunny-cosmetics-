import { Menu, Languages, LogOut, UserCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSettings } from '../../contexts/SettingsContext'

export default function Topbar({ onMenuClick }) {
  const { profile, logout, isAdmin } = useAuth()
  const { t, lang, toggleLang } = useLanguage()
  const settings = useSettings()

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-surface-border bg-white/90 px-4 py-3 backdrop-blur">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted lg:hidden cursor-pointer" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="hidden text-sm text-ink-muted sm:block">{settings.name}</div>
      <div className="ms-auto flex items-center gap-2">
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted cursor-pointer"
        >
          <Languages size={16} />
          <span className="hidden sm:inline">{lang === 'en' ? 'اردو' : 'English'}</span>
        </button>
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
          <UserCircle size={22} className="text-ink-soft" />
          <div className="hidden text-start sm:block">
            <p className="text-sm font-medium leading-tight text-ink">{profile?.name}</p>
            <p className="text-xs leading-tight text-ink-muted">{isAdmin ? t('settings.roleAdmin') : t('settings.roleCashier')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-ink-muted hover:bg-danger-bg hover:text-danger cursor-pointer"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">{t('common.logout')}</span>
        </button>
      </div>
    </header>
  )
}
