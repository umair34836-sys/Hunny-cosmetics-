import { useEffect, useMemo, useState } from 'react'
import { Search, Eye, RotateCcw, Receipt as ReceiptIcon } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { listenSales, refundSale, computeSaleProfit } from '../../lib/sales'
import { formatMoney, formatDateTime } from '../../lib/format'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import { Input } from '../../components/ui/Field'
import EmptyState from '../../components/ui/EmptyState'
import { FullPageSpinner } from '../../components/ui/Spinner'
import ReceiptView from '../../components/receipt/ReceiptView'

export default function SalesPage() {
  const { t, lang } = useLanguage()
  const { profile, isAdmin } = useAuth()
  const settings = useSettings()
  const toast = useToast()

  const [sales, setSales] = useState(null)
  const [search, setSearch] = useState('')
  const [activeSale, setActiveSale] = useState(null)
  const [refunding, setRefunding] = useState(false)

  useEffect(() => {
    const unsub = listenSales(setSales, () => toast.error(t('common.errorGeneric')))
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (!sales) return []
    const q = search.trim().toLowerCase()
    if (!q) return sales
    return sales.filter(
      (s) =>
        s.invoiceNo?.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q) ||
        s.customerPhone?.includes(q)
    )
  }, [sales, search])

  async function handleRefund(sale) {
    if (!window.confirm(t('sales.confirmRefund'))) return
    setRefunding(true)
    try {
      await refundSale(sale.id, { actorId: profile.id, actorName: profile.name })
      toast.success(t('common.savedChanges'))
      setActiveSale(null)
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    } finally {
      setRefunding(false)
    }
  }

  if (sales === null) return <FullPageSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-ink">{t('sales.title')}</h1>
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <Input className="ps-10" placeholder={t('products.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={ReceiptIcon} title={t(sales.length ? 'common.noResults' : 'sales.noSales')} />
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="divide-y divide-surface-border sm:hidden">
              {filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSale(s)}
                  className="flex w-full flex-col items-start gap-1.5 p-4 text-start cursor-pointer hover:bg-surface-muted/40"
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{s.invoiceNo}</p>
                      <p className="text-xs text-ink-soft">{s.customerName || t('sales.cashier') + ': ' + s.cashierName}</p>
                    </div>
                    <Badge tone={s.status === 'refunded' ? 'danger' : 'success'}>
                      {s.status === 'refunded' ? t('sales.refunded') : t('sales.completed')}
                    </Badge>
                  </div>
                  <div className="flex w-full items-center justify-between text-sm">
                    <span className="text-ink-soft">{formatDateTime(s.createdAt, lang)}</span>
                    <span className="font-semibold text-ink">{formatMoney(s.total, settings.currencySymbol)}</span>
                  </div>
                  {isAdmin && s.status !== 'refunded' && (
                    <span className="text-xs text-success">{t('reports.profit')}: {formatMoney(computeSaleProfit(s), settings.currencySymbol)}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Desktop/tablet: full table */}
            <div className="hidden overflow-x-auto scrollbar-thin sm:block">
            <table className="w-full min-w-[760px] text-start text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/60 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('sales.invoice')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('common.date')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('sales.cashier')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('sales.items')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('common.total')}</th>
                  {isAdmin && <th className="px-4 py-3 text-start font-medium">{t('reports.profit')}</th>}
                  <th className="px-4 py-3 text-start font-medium">{t('common.status')}</th>
                  <th className="px-4 py-3 text-end font-medium">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{s.invoiceNo}</p>
                      {s.customerName && <p className="text-xs text-ink-soft">{s.customerName}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDateTime(s.createdAt, lang)}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.cashierName}</td>
                    <td className="px-4 py-3 text-ink-muted">{s.items?.length}</td>
                    <td className="px-4 py-3 font-medium text-ink">{formatMoney(s.total, settings.currencySymbol)}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 font-medium text-success">
                        {s.status === 'refunded' ? '—' : formatMoney(computeSaleProfit(s), settings.currencySymbol)}
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <Badge tone={s.status === 'refunded' ? 'danger' : 'success'}>
                        {s.status === 'refunded' ? t('sales.refunded') : t('sales.completed')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title={t('sales.viewDetails')}
                          onClick={() => setActiveSale(s)}
                          className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
                        >
                          <Eye size={16} />
                        </button>
                        {isAdmin && s.status !== 'refunded' && (
                          <button
                            title={t('sales.refund')}
                            onClick={() => handleRefund(s)}
                            disabled={refunding}
                            className="rounded-lg p-2 text-ink-muted hover:bg-danger-bg hover:text-danger cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </Card>

      <Modal open={!!activeSale} onClose={() => setActiveSale(null)} title={t('sales.saleDetail')} size="lg">
        {activeSale && (
          <div className="space-y-4">
            <ReceiptView sale={activeSale} />
            {isAdmin && (
              <div className="no-print overflow-hidden rounded-xl border border-surface-border">
                <p className="border-b border-surface-border bg-surface-muted/60 px-4 py-2.5 text-sm font-semibold text-ink">
                  {t('sales.costBreakdown')}
                </p>
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-start text-sm">
                    <thead className="text-xs uppercase tracking-wide text-ink-soft">
                      <tr>
                        <th className="px-4 py-2 text-start font-medium">{t('receipt.item')}</th>
                        <th className="px-4 py-2 text-center font-medium">{t('receipt.qty')}</th>
                        <th className="px-4 py-2 text-end font-medium">{t('products.costPrice')}</th>
                        <th className="px-4 py-2 text-end font-medium">{t('products.sellingPrice')}</th>
                        <th className="px-4 py-2 text-end font-medium">{t('reports.profit')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSale.items.map((item, i) => (
                        <tr key={i} className="border-t border-surface-border">
                          <td className="px-4 py-2 text-ink">{item.name}</td>
                          <td className="px-4 py-2 text-center text-ink-muted">{item.qty}</td>
                          <td className="px-4 py-2 text-end text-ink-muted">{formatMoney(item.costPrice || 0, settings.currencySymbol)}</td>
                          <td className="px-4 py-2 text-end text-ink-muted">{formatMoney(item.price, settings.currencySymbol)}</td>
                          <td className="px-4 py-2 text-end font-medium text-success">
                            {formatMoney((item.price - (item.costPrice || 0)) * item.qty, settings.currencySymbol)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-surface-border font-semibold">
                        <td className="px-4 py-2 text-ink" colSpan={4}>{t('reports.profit')}</td>
                        <td className="px-4 py-2 text-end text-success">{formatMoney(computeSaleProfit(activeSale), settings.currencySymbol)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
            {isAdmin && activeSale.status !== 'refunded' && (
              <div className="no-print flex justify-end border-t border-surface-border pt-4">
                <Button variant="danger" onClick={() => handleRefund(activeSale)} disabled={refunding}>
                  <RotateCcw size={16} />
                  {t('sales.refund')}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
