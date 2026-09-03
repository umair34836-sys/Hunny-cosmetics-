import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Wallet, Package, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSettings } from '../../contexts/SettingsContext'
import { listenSales } from '../../lib/sales'
import { listenProducts } from '../../lib/products'
import { formatMoney } from '../../lib/format'
import Card, { CardHeader } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { Select } from '../../components/ui/Field'
import { FullPageSpinner } from '../../components/ui/Spinner'

function rangeStart(range) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  if (range === 'today') return d
  if (range === 'week') {
    d.setDate(d.getDate() - 6)
    return d
  }
  if (range === 'month') {
    d.setDate(d.getDate() - 29)
    return d
  }
  return null
}

export default function ReportsPage() {
  const { t } = useLanguage()
  const settings = useSettings()
  const [sales, setSales] = useState(null)
  const [products, setProducts] = useState(null)
  const [range, setRange] = useState('week')

  useEffect(() => {
    const u1 = listenSales(setSales, () => {})
    const u2 = listenProducts(setProducts, () => {})
    return () => {
      u1()
      u2()
    }
  }, [])

  const data = useMemo(() => {
    if (!sales || !products) return null
    const start = rangeStart(range)
    const scoped = sales.filter((s) => {
      if (s.status === 'refunded') return false
      if (!start) return true
      const d = s.createdAt?.toDate ? s.createdAt.toDate() : new Date(s.createdAt)
      return d >= start
    })

    const revenue = scoped.reduce((sum, s) => sum + (s.total || 0), 0)
    let cost = 0
    const productTotals = new Map()
    scoped.forEach((s) => {
      s.items?.forEach((item) => {
        cost += (item.costPrice || 0) * item.qty
        const prev = productTotals.get(item.name) || { qty: 0, revenue: 0 }
        productTotals.set(item.name, { qty: prev.qty + item.qty, revenue: prev.revenue + item.lineTotal })
      })
    })
    const topProducts = [...productTotals.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8)

    const stockValue = products.reduce((sum, p) => sum + (p.costPrice || 0) * (p.quantity || 0), 0)
    const lowStock = products.filter((p) => p.quantity <= (p.lowStockThreshold ?? 5))

    return { revenue, profit: revenue - cost, orderCount: scoped.length, topProducts, stockValue, lowStock }
  }, [sales, products, range])

  if (!data) return <FullPageSpinner />

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-ink">{t('reports.title')}</h1>
        <div className="w-40">
          <Select value={range} onChange={(e) => setRange(e.target.value)}>
            <option value="today">{t('common.today')}</option>
            <option value="week">{t('common.thisWeek')}</option>
            <option value="month">{t('common.thisMonth')}</option>
            <option value="all">{t('common.all')}</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Wallet size={20} /></div>
          <div>
            <p className="text-xs text-ink-muted">{t('reports.revenue')}</p>
            <p className="text-lg font-semibold text-ink">{formatMoney(data.revenue, settings.currencySymbol)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success-bg text-success"><TrendingUp size={20} /></div>
          <div>
            <p className="text-xs text-ink-muted">{t('reports.profit')}</p>
            <p className="text-lg font-semibold text-ink">{formatMoney(data.profit, settings.currencySymbol)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-ink-muted"><Package size={20} /></div>
          <div>
            <p className="text-xs text-ink-muted">{t('reports.stockValue')}</p>
            <p className="text-lg font-semibold text-ink">{formatMoney(data.stockValue, settings.currencySymbol)}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning-bg text-warning"><AlertTriangle size={20} /></div>
          <div>
            <p className="text-xs text-ink-muted">{t('dash.lowStockCount')}</p>
            <p className="text-lg font-semibold text-ink">{data.lowStock.length}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title={t('reports.topProducts')} />
          <div className="divide-y divide-surface-border">
            {data.topProducts.length === 0 && <p className="px-5 py-6 text-center text-sm text-ink-muted">{t('common.noResults')}</p>}
            {data.topProducts.map((p) => (
              <div key={p.name} className="flex items-center justify-between px-5 py-2.5">
                <span className="truncate text-sm text-ink">{p.name}</span>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-ink-soft">{p.qty} {t('common.piece')}</span>
                  <span className="font-medium text-ink">{formatMoney(p.revenue, settings.currencySymbol)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title={t('reports.lowStockReport')} />
          <div className="divide-y divide-surface-border">
            {data.lowStock.length === 0 && <p className="px-5 py-6 text-center text-sm text-ink-muted">{t('dash.allStocked')}</p>}
            {data.lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-2.5">
                <span className="truncate text-sm text-ink">{p.name}</span>
                <Badge tone={p.quantity <= 0 ? 'danger' : 'warning'}>{p.quantity} {p.unit}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
