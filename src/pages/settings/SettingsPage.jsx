import { useEffect, useState } from 'react'
import { Store, Users, Plus, Ban, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { saveShopSettings } from '../../lib/settings'
import { listenStaff, createStaffAccount, setStaffActive } from '../../lib/staff'
import Card, { CardHeader } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Modal from '../../components/ui/Modal'
import { Field, Input, Select } from '../../components/ui/Field'
import RequireAdmin from '../../components/layout/RequireAdmin'

const TABS = [
  { key: 'shop', icon: Store },
  { key: 'staff', icon: Users },
]

export default function SettingsPage() {
  const { t } = useLanguage()
  const [tab, setTab] = useState('shop')

  return (
    <RequireAdmin>
      <div className="space-y-5">
        <h1 className="text-xl font-semibold text-ink">{t('settings.title')}</h1>
        <div className="flex w-fit overflow-hidden rounded-lg border border-surface-border bg-white">
          {TABS.map(({ key, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium cursor-pointer ${
                tab === key ? 'bg-brand-600 text-white' : 'text-ink-muted hover:bg-surface-muted'
              }`}
            >
              <Icon size={16} />
              {key === 'shop' ? t('settings.shopInfo') : t('settings.staffManagement')}
            </button>
          ))}
        </div>
        {tab === 'shop' ? <ShopSettingsTab /> : <StaffTab />}
      </div>
    </RequireAdmin>
  )
}

function ShopSettingsTab() {
  const { t } = useLanguage()
  const settings = useSettings()
  const toast = useToast()
  const [form, setForm] = useState(settings)
  const [saving, setSaving] = useState(false)

  useEffect(() => setForm(settings), [settings])

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveShopSettings({
        ...form,
        taxPercent: Number(form.taxPercent) || 0,
        lowStockDefaultThreshold: Number(form.lowStockDefaultThreshold) || 5,
      })
      toast.success(t('common.savedChanges'))
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader title={t('settings.shopInfo')} />
      <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('settings.shopName')} required>
            <Input required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </Field>
          <Field label={t('settings.shopPhone')}>
            <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
          </Field>
          <Field label={t('settings.shopAddress')}>
            <Input value={form.address} onChange={(e) => update('address', e.target.value)} />
          </Field>
          <Field label={t('settings.currency')}>
            <Input value={form.currencySymbol} onChange={(e) => update('currencySymbol', e.target.value)} />
          </Field>
          <Field label={t('settings.taxPercent')}>
            <Input type="number" min="0" step="0.01" value={form.taxPercent} onChange={(e) => update('taxPercent', e.target.value)} />
          </Field>
          <Field label={t('products.lowStockThreshold')}>
            <Input type="number" min="0" value={form.lowStockDefaultThreshold} onChange={(e) => update('lowStockDefaultThreshold', e.target.value)} />
          </Field>
          <Field label={t('settings.defaultReceiptFormat')}>
            <Select value={form.defaultReceiptFormat} onChange={(e) => update('defaultReceiptFormat', e.target.value)}>
              <option value="normal">{t('settings.formatNormal')}</option>
              <option value="thermal">{t('settings.formatThermal')}</option>
            </Select>
          </Field>
        </div>
        <Field label={t('settings.receiptFooter')}>
          <Input value={form.receiptFooter} onChange={(e) => update('receiptFooter', e.target.value)} />
        </Field>
        <div className="flex justify-end border-t border-surface-border pt-4">
          <Button type="submit" disabled={saving}>{saving ? t('common.saving') : t('common.save')}</Button>
        </div>
      </form>
    </Card>
  )
}

function StaffTab() {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const toast = useToast()
  const [staff, setStaff] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const unsub = listenStaff(setStaff, () => toast.error(t('common.errorGeneric')))
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function toggleActive(member) {
    if (member.id === profile.id) return
    try {
      await setStaffActive(member.id, !member.active)
      toast.success(t('common.savedChanges'))
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    }
  }

  return (
    <Card className="max-w-3xl overflow-hidden">
      <CardHeader
        title={t('settings.staffManagement')}
        action={
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            {t('settings.addStaff')}
          </Button>
        }
      />
      <div className="divide-y divide-surface-border">
        {!staff && <p className="px-5 py-6 text-center text-sm text-ink-muted">{t('common.loading')}</p>}
        {staff?.map((m) => (
          <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{m.name} {m.id === profile.id && <span className="text-ink-soft">({t('common.name')} you)</span>}</p>
              <p className="text-xs text-ink-soft">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="brand">{m.role === 'admin' ? t('settings.roleAdmin') : t('settings.roleCashier')}</Badge>
              <Badge tone={m.active ? 'success' : 'neutral'}>{m.active ? t('common.active') : t('common.inactive')}</Badge>
              {m.id !== profile.id && (
                <button
                  onClick={() => toggleActive(m)}
                  title={m.active ? t('settings.disable') : t('settings.enable')}
                  className={`rounded-lg p-2 cursor-pointer ${m.active ? 'text-ink-muted hover:bg-danger-bg hover:text-danger' : 'text-ink-muted hover:bg-success-bg hover:text-success'}`}
                >
                  {m.active ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <AddStaffModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Card>
  )
}

function AddStaffModal({ open, onClose }) {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const toast = useToast()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'cashier' })
  const [submitting, setSubmitting] = useState(false)

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) {
      toast.error(t('auth.passwordMin'))
      return
    }
    setSubmitting(true)
    try {
      await createStaffAccount({ ...form, actorId: profile.id })
      toast.success(t('settings.staffCreated'))
      setForm({ name: '', email: '', password: '', role: 'cashier' })
      onClose()
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('settings.addStaff')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={t('common.name')} required>
          <Input required value={form.name} onChange={(e) => update('name', e.target.value)} />
        </Field>
        <Field label={t('common.email')} required>
          <Input type="email" required value={form.email} onChange={(e) => update('email', e.target.value)} />
        </Field>
        <Field label={t('settings.tempPassword')} required>
          <Input type="text" required minLength={6} value={form.password} onChange={(e) => update('password', e.target.value)} />
        </Field>
        <Field label={t('settings.role')}>
          <Select value={form.role} onChange={(e) => update('role', e.target.value)}>
            <option value="cashier">{t('settings.roleCashier')}</option>
            <option value="admin">{t('settings.roleAdmin')}</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={submitting}>{submitting ? t('common.saving') : t('common.add')}</Button>
        </div>
      </form>
    </Modal>
  )
}
