import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'
import EmptyState from '../ui/EmptyState'

export default function RequireAdmin({ children }) {
  const { isAdmin } = useAuth()
  const { t } = useLanguage()
  if (!isAdmin) {
    return <EmptyState icon={ShieldAlert} title={t('settings.adminOnly')} />
  }
  return children
}
