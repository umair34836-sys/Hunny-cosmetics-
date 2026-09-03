import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet, Receipt, Package, AlertTriangle, Clock, TrendingUp } from 'lucide-react'
import { useLanguage } from '../i18n/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useSettings } from '../contexts/SettingsContext'
import { listenProducts } from '../lib/products'
import { listenSales, computeSaleProfit } from '../lib/sales'
import { formatMoney, formatDateTime, daysUntil } from '../lib/format'
import Card, { CardHeader } from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import { FullPageSpinner } from '../components/ui/Spinner'

function StatCard({ icon: Icon, label, value, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-700',
    success: 'bg-success-bg text-success',
    warning: 'bg-warning-bg text-warning',
    neutral: 'bg-surface-muted text-ink-muted',
  }
  return (
    <Card className="flex items-center gap-4 p-4">
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-muted">{label}</p>
        <p className="truncate text-lg font-semibold text-ink">{value}</p>
      </div>
    </Card>
  )
}

export default function Dashboard() {
  const { t, lang } = useLanguage()
  const { profile, isAdmin } = useAuth()
  const settings = useSettings()

  const [products, setProducts] = useState(null)
  const [sales, setSales] = useState(null)

  useEffect(() => {
    const unsub1 = listenProducts(setProducts, () => {})
    const unsub2 = listenSales(setSales, () => {})
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  const stats = useMemo(() => {
    if (!products || !sales) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todaySales = sales.filter((s) => {
      const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
      return s.status !== 'refunded' && d >= today
    })
    const todayTotal = todaySales.reduce((sum, s) => sum + (s.total || 0), 0)
    const inventoryValue = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.quantity || 0), 0)
    const lowStock = products.filter((p) => p.quantity > 0 && p.quantity <= (p.lowStockThreshold ?? 5))
    const outOfStock = products.filter((p) => p.quantity <= 0)
    const expiring = products.filter((p) => {
      const d = daysUntil(p.expiryDate)
      return d !== null && d <= 30
    })
    const totalNetProfit = sales.filter((s) => s.status !== 'refunded').reduce((sum, s) => sum + computeSaleProfit(s), 0)
    return { todayTotal, todayCount: todaySales.length, inventoryValue, lowStock, outOfStock, expiring, totalNetProfit }
  }, [products, sales])

  if (!stats) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">{t('dash.title')}</h1>
        <p className="text-sm text-ink-muted">{t('dash.welcome')}, {profile?.name}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Wallet} label={t('dash.todaySales')} value={formatMoney(stats.todayTotal, settings.currencySymbol)} tone="brand" />
        <StatCard icon={Receipt} label={t('dash.todayOrders')} value={stats.todayCount} tone="success" />
        {isAdmin && <StatCard icon={TrendingUp} label={t('dash.netProfit')} value={formatMoney(stats.totalNetProfit, settings.currencySymbol)} tone="success" />}
        {isAdmin && <StatCard icon={Package} label={t('dash.inventoryValue')} value={formatMoney(stats.inventoryValue, settings.currencySymbol)} tone="neutral" />}
        <StatCard icon={AlertTriangle} label={t('dash.lowStockCount')} value={stats.lowStock.length + stats.outOfStock.length} tone="warning" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title={t('dash.recentSales')}
            action={
              <Link to="/sales" className="text-sm font-medium text-brand-600 hover:underline">
                {t('dash.viewAll')}
              </Link>
            }
          />
          <div className="divide-y divide-surface-border">
            {sales.slice(0, 8).length === 0 && <p className="px-5 py-8 text-center text-sm text-ink-muted">{t('dash.noSalesYet')}</p>}
            {sales.slice(0, 8).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{s.invoiceNo} {s.customerName && `· ${s.customerName}`}</p>
                  <p className="text-xs text-ink-soft">{formatDateTime(s.createdAt, lang)} · {s.cashierName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink">{formatMoney(s.total, settings.currencySymbol)}</span>
                  {s.status === 'refunded' && <Badge tone="danger">{t('sales.refunded')}</Badge>}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title={t('dash.lowStockAlert')} />
            <div className="divide-y divide-surface-border">
              {stats.lowStock.length + stats.outOfStock.length === 0 && (
                <p className="px-5 py-6 text-center text-sm text-ink-muted">{t('dash.allStocked')}</p>
              )}
              {[...stats.outOfStock, ...stats.lowStock].slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                  <span className="truncate text-sm text-ink">{p.name}</span>
                  <Badge tone={p.quantity <= 0 ? 'danger' : 'warning'}>{p.quantity} {p.unit}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {stats.expiring.length > 0 && (
            <Card>
              <CardHeader title={t('dash.expiringAlert')} action={<Clock size={16} className="text-warning" />} />
              <div className="divide-y divide-surface-border">
                {stats.expiring.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                    <span className="truncate text-sm text-ink">{p.name}</span>
                    <Badge tone={daysUntil(p.expiryDate) < 0 ? 'danger' : 'warning'}>
                      {daysUntil(p.expiryDate) < 0 ? t('products.expired') : `${daysUntil(p.expiryDate)}d`}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
