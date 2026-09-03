import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { ToastProvider } from './contexts/ToastContext'
import { LanguageProvider, useLanguage } from './i18n/LanguageContext'
import { FullPageSpinner } from './components/ui/Spinner'
import AuthPage from './pages/auth/AuthPage'
import AppLayout from './components/layout/AppLayout'
import Dashboard from './pages/Dashboard'
import PosPage from './pages/pos/PosPage'
import ProductsPage from './pages/products/ProductsPage'
import SalesPage from './pages/sales/SalesPage'
import ReportsPage from './pages/reports/ReportsPage'
import SettingsPage from './pages/settings/SettingsPage'
import RequireAdmin from './components/layout/RequireAdmin'
import Button from './components/ui/Button'

function Gate() {
  const { user, profile, loading, isActive, logout } = useAuth()
  const { t } = useLanguage()

  if (loading) return <FullPageSpinner />
  if (!user) return <AuthPage />

  // Signed in with Firebase Auth but no matching Firestore user doc yet
  // (still loading) — wait briefly rather than flashing the disabled screen.
  if (!profile) return <FullPageSpinner />

  if (!isActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger">
          <ShieldOff size={26} />
        </div>
        <p className="max-w-sm text-sm text-ink-muted">{t('auth.accountInactive')}</p>
        <Button variant="secondary" onClick={logout}>{t('common.logout')}</Button>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<PosPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route
            path="/reports"
            element={
              <RequireAdmin>
                <ReportsPage />
              </RequireAdmin>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <AuthProvider>
          <SettingsProvider>
            <Gate />
          </SettingsProvider>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  )
}
