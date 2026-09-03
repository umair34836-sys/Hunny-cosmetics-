import { useState } from 'react'
import { Sparkles, Languages } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'
import { Field, Input } from '../../components/ui/Field'
import Button from '../../components/ui/Button'

export default function AuthPage() {
  const { bootstrapNeeded } = useAuth()
  const { t, lang, toggleLang } = useLanguage()

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-surface to-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Sparkles size={20} />
            </div>
            <span className="text-lg font-semibold text-ink">{t('app.name')}</span>
          </div>
          <button
            onClick={toggleLang}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-white px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted cursor-pointer"
          >
            <Languages size={16} />
            {lang === 'en' ? 'اردو' : 'English'}
          </button>
        </div>
        <div className="rounded-xl border border-surface-border bg-white p-6 shadow-card sm:p-8">
          {bootstrapNeeded ? <SetupForm /> : <LoginForm />}
        </div>
      </div>
    </div>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(t('auth.invalidCredentials'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{t('auth.loginTitle')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('auth.loginSubtitle')}</p>
      </div>
      <Field label={t('common.email')} htmlFor="email" required>
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t('auth.password')} htmlFor="password" required>
        <Input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? t('auth.loggingIn') : t('auth.login')}
      </Button>
    </form>
  )
}

function SetupForm() {
  const { createAdminAccount } = useAuth()
  const { t } = useLanguage()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) {
      setError(t('auth.passwordMin'))
      return
    }
    setSubmitting(true)
    try {
      await createAdminAccount({ name: name.trim(), email: email.trim(), password })
    } catch (err) {
      setError(err?.message || t('common.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">{t('auth.setupTitle')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('auth.setupSubtitle')}</p>
      </div>
      <Field label={t('auth.yourName')} htmlFor="name" required>
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label={t('common.email')} htmlFor="email" required>
        <Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label={t('auth.password')} htmlFor="password" required>
        <Input id="password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? t('auth.creating') : t('auth.createAccount')}
      </Button>
    </form>
  )
}
