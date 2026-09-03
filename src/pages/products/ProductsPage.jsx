import { useEffect, useMemo, useState } from 'react'
import { Plus, Search, PackagePlus, SlidersHorizontal, Pencil, Trash2, Package, Upload } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { listenProducts, deleteProduct } from '../../lib/products'
import { formatMoney, formatDate, daysUntil } from '../../lib/format'
import Card from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import EmptyState from '../../components/ui/EmptyState'
import { FullPageSpinner } from '../../components/ui/Spinner'
import { ProductFormModal, StockInModal, AdjustStockModal } from './ProductModals'
import BulkImportModal from './BulkImportModal'

function stockBadge(product, t) {
  if (product.quantity <= 0) return <Badge tone="danger">{t('products.outOfStock')}</Badge>
  if (product.quantity <= (product.lowStockThreshold ?? 5)) return <Badge tone="warning">{t('products.lowStock')}</Badge>
  return <Badge tone="success">{t('products.inStock')}</Badge>
}

function expiryBadge(product, t) {
  if (!product.expiryDate) return null
  const days = daysUntil(product.expiryDate)
  if (days === null) return null
  if (days < 0) return <Badge tone="danger">{t('products.expired')}</Badge>
  if (days <= 30) return <Badge tone="warning">{t('dash.expiringAlert')}</Badge>
  return null
}

export default function ProductsPage() {
  const { t } = useLanguage()
  const { isAdmin } = useAuth()
  const settings = useSettings()
  const toast = useToast()

  const [products, setProducts] = useState(null)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [stockInProduct, setStockInProduct] = useState(null)
  const [adjustProduct, setAdjustProduct] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    const unsub = listenProducts(setProducts, () => toast.error(t('common.errorGeneric')))
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    if (!products) return []
    const q = search.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.brand?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
    )
  }, [products, search])

  async function handleDelete(product) {
    if (!window.confirm(t('products.confirmDelete'))) return
    try {
      await deleteProduct(product.id)
      toast.success(t('common.savedChanges'))
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    }
  }

  if (products === null) return <FullPageSpinner />

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-ink">{t('products.title')}</h1>
          <p className="text-sm text-ink-muted">{t('products.subtitle')}</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload size={18} />
              {t('products.bulkImport')}
            </Button>
            <Button
              onClick={() => {
                setEditingProduct(null)
                setFormOpen(true)
              }}
            >
              <Plus size={18} />
              {t('products.add')}
            </Button>
          </div>
        )}
      </div>

      <div className="relative max-w-md">
        <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <Input className="ps-10" placeholder={t('products.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Package} title={t(products.length ? 'common.noResults' : 'products.noProducts')} />
        ) : (
          <>
            {/* Mobile: stacked cards — a wide data table doesn't fit a phone screen */}
            <div className="divide-y divide-surface-border sm:hidden">
              {filtered.map((p) => (
                <div key={p.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-ink-soft">
                        {[p.brand, p.sku, p.category].filter(Boolean).join(' · ') || '—'}
                      </p>
                      {p.expiryDate && <p className="text-xs text-ink-soft">{t('products.expiryDate')}: {formatDate(p.expiryDate)}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                      {stockBadge(p, t)}
                      {expiryBadge(p, t)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-ink">{p.quantity} {p.unit}</span>
                    {isAdmin && <span className="text-ink-muted">{formatMoney(p.costPrice, settings.currencySymbol)}</span>}
                  </div>
                  {isAdmin && (
                    <div className="mt-3 grid grid-cols-4 gap-1 border-t border-surface-border pt-3">
                      <button
                        onClick={() => setStockInProduct(p)}
                        className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs text-ink-muted hover:bg-success-bg hover:text-success cursor-pointer"
                      >
                        <PackagePlus size={18} />
                        {t('products.stockIn')}
                      </button>
                      <button
                        onClick={() => setAdjustProduct(p)}
                        className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs text-ink-muted hover:bg-warning-bg hover:text-warning cursor-pointer"
                      >
                        <SlidersHorizontal size={18} />
                        {t('products.adjust')}
                      </button>
                      <button
                        onClick={() => {
                          setEditingProduct(p)
                          setFormOpen(true)
                        }}
                        className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
                      >
                        <Pencil size={18} />
                        {t('common.edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        className="flex flex-col items-center gap-1 rounded-lg py-2 text-xs text-ink-muted hover:bg-danger-bg hover:text-danger cursor-pointer"
                      >
                        <Trash2 size={18} />
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop/tablet: full table */}
            <div className="hidden overflow-x-auto scrollbar-thin sm:block">
            <table className="w-full min-w-[860px] text-start text-sm">
              <thead className="border-b border-surface-border bg-surface-muted/60 text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t('common.name')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('common.category')}</th>
                  {isAdmin && <th className="px-4 py-3 text-start font-medium">{t('products.costPrice')}</th>}
                  <th className="px-4 py-3 text-start font-medium">{t('common.quantity')}</th>
                  <th className="px-4 py-3 text-start font-medium">{t('common.status')}</th>
                  {isAdmin && <th className="px-4 py-3 text-end font-medium">{t('common.actions')}</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-surface-border last:border-0 hover:bg-surface-muted/40">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{p.name}</p>
                      <p className="text-xs text-ink-soft">{p.brand}{p.sku ? ` · ${p.sku}` : ''}</p>
                      {p.expiryDate && <p className="text-xs text-ink-soft">{t('products.expiryDate')}: {formatDate(p.expiryDate)}</p>}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{p.category || '—'}</td>
                    {isAdmin && <td className="px-4 py-3 text-ink-muted">{formatMoney(p.costPrice, settings.currencySymbol)}</td>}
                    <td className="px-4 py-3 text-ink">{p.quantity} {p.unit}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {stockBadge(p, t)}
                        {expiryBadge(p, t)}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            title={t('products.stockIn')}
                            onClick={() => setStockInProduct(p)}
                            className="rounded-lg p-2 text-ink-muted hover:bg-success-bg hover:text-success cursor-pointer"
                          >
                            <PackagePlus size={16} />
                          </button>
                          <button
                            title={t('products.adjust')}
                            onClick={() => setAdjustProduct(p)}
                            className="rounded-lg p-2 text-ink-muted hover:bg-warning-bg hover:text-warning cursor-pointer"
                          >
                            <SlidersHorizontal size={16} />
                          </button>
                          <button
                            title={t('common.edit')}
                            onClick={() => {
                              setEditingProduct(p)
                              setFormOpen(true)
                            }}
                            className="rounded-lg p-2 text-ink-muted hover:bg-surface-muted hover:text-ink cursor-pointer"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            title={t('common.delete')}
                            onClick={() => handleDelete(p)}
                            className="rounded-lg p-2 text-ink-muted hover:bg-danger-bg hover:text-danger cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </Card>

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} product={editingProduct} />
      <StockInModal open={!!stockInProduct} onClose={() => setStockInProduct(null)} product={stockInProduct} />
      <AdjustStockModal open={!!adjustProduct} onClose={() => setAdjustProduct(null)} product={adjustProduct} />
      <BulkImportModal open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  )
}
