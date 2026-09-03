import { useEffect, useMemo, useState } from 'react'
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { listenProducts } from '../../lib/products'
import { createSale } from '../../lib/sales'
import { formatMoney } from '../../lib/format'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { Input, Select, Field } from '../../components/ui/Field'
import EmptyState from '../../components/ui/EmptyState'
import { FullPageSpinner } from '../../components/ui/Spinner'
import ReceiptView from '../../components/receipt/ReceiptView'

export default function PosPage() {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const settings = useSettings()
  const toast = useToast()

  const [products, setProducts] = useState(null)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [discountPercent, setDiscountPercent] = useState('0')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [amountPaid, setAmountPaid] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [completedSale, setCompletedSale] = useState(null)

  useEffect(() => {
    const unsub = listenProducts(setProducts, () => toast.error(t('common.errorGeneric')))
    return unsub
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredProducts = useMemo(() => {
    if (!products) return []
    const q = search.trim().toLowerCase()
    const base = q
      ? products.filter((p) => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q))
      : products
    return base.filter((p) => p.quantity > 0).slice(0, 60)
  }, [products, search])

  const taxPercent = Number(settings.taxPercent) || 0
  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discountAmount = (subtotal * (Number(discountPercent) || 0)) / 100
  const taxable = Math.max(0, subtotal - discountAmount)
  const taxAmount = (taxable * taxPercent) / 100
  const total = Math.round((taxable + taxAmount) * 100) / 100
  const changeDue = paymentMethod === 'cash' && amountPaid !== '' ? Math.max(0, Number(amountPaid) - total) : 0

  function addToCart(product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id)
      if (existing) {
        if (existing.qty >= product.quantity) {
          toast.error(t('pos.onlyAvailable', { n: product.quantity }))
          return prev
        }
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku || '',
          unit: product.unit || '',
          price: product.sellingPrice,
          costPrice: product.costPrice || 0,
          qty: 1,
          maxQty: product.quantity,
        },
      ]
    })
  }

  function changePrice(productId, value) {
    const price = Math.max(0, Number(value) || 0)
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, price } : i)))
  }

  function changeQty(productId, delta) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i
          const nextQty = i.qty + delta
          if (nextQty > i.maxQty) {
            toast.error(t('pos.onlyAvailable', { n: i.maxQty }))
            return i
          }
          return { ...i, qty: nextQty }
        })
        .filter((i) => i.qty > 0)
    )
  }

  function removeItem(productId) {
    setCart((prev) => prev.filter((i) => i.productId !== productId))
  }

  function resetSale() {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setDiscountPercent('0')
    setPaymentMethod('cash')
    setAmountPaid('')
    setCompletedSale(null)
  }

  async function handleCheckout() {
    if (!cart.length) return
    setSubmitting(true)
    try {
      const meta = {
        discountPercent: Number(discountPercent) || 0,
        taxPercent,
        paymentMethod,
        amountPaid: amountPaid !== '' ? Number(amountPaid) : total,
        customerName,
        customerPhone,
        cashierId: profile.id,
        cashierName: profile.name,
      }
      const { saleId, invoiceNo } = await createSale(cart, meta)
      setCompletedSale({
        id: saleId,
        invoiceNo,
        items: cart.map((i) => ({ ...i, lineTotal: Math.round(i.qty * i.price * 100) / 100 })),
        subtotal,
        discountPercent: meta.discountPercent,
        discountAmount,
        taxPercent,
        taxAmount,
        total,
        paymentMethod,
        amountPaid: meta.amountPaid,
        customerName,
        customerPhone,
        cashierName: profile.name,
        createdAt: new Date(),
      })
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  if (products === null) return <FullPageSpinner />

  if (completedSale) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-success-bg px-4 py-3 text-success">
          <CheckCircle2 size={22} />
          <div>
            <p className="font-medium">{t('pos.saleComplete')}</p>
            <p className="text-sm">{t('pos.invoiceNo')}: {completedSale.invoiceNo}</p>
          </div>
        </div>
        <ReceiptView sale={completedSale} />
        <div className="no-print flex justify-center">
          <Button onClick={resetSale}>{t('pos.newSale')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_400px]">
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-ink">{t('pos.title')}</h1>
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink-soft" />
          <Input className="ps-10" autoFocus placeholder={t('pos.searchProducts')} value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="flex flex-col items-start gap-1 rounded-xl border border-surface-border bg-white p-3 text-start shadow-card transition-colors hover:border-brand-300 hover:bg-brand-50 cursor-pointer"
            >
              <span className="line-clamp-2 text-sm font-medium text-ink">{p.name}</span>
              <span className="text-xs text-ink-soft">{p.brand}</span>
              <span className="mt-1 text-sm font-semibold text-brand-700">{formatMoney(p.sellingPrice, settings.currencySymbol)}</span>
              <span className="text-xs text-ink-soft">{p.quantity} {p.unit} {t('products.inStock').toLowerCase()}</span>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full">
              <EmptyState icon={Search} title={t('common.noResults')} />
            </div>
          )}
        </div>
      </div>

      <Card className="flex h-fit flex-col">
        <div className="flex items-center gap-2 border-b border-surface-border px-4 py-3">
          <ShoppingCart size={18} className="text-brand-600" />
          <h2 className="font-semibold text-ink">{t('pos.cart')}</h2>
          {cart.length > 0 && <span className="ms-auto text-xs text-ink-soft">{cart.length}</span>}
        </div>

        <div className="max-h-[40vh] overflow-y-auto scrollbar-thin px-4 py-2">
          {cart.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">{t('pos.emptyCart')}</p>
          ) : (
            cart.map((item) => (
              <div key={item.productId} className="border-b border-surface-border py-2.5 last:border-0">
                <div className="flex items-center gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{item.name}</p>
                  <button onClick={() => removeItem(item.productId)} className="rounded-md p-1.5 text-ink-soft hover:bg-danger-bg hover:text-danger cursor-pointer" title={t('pos.remove')}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-ink-soft">{settings.currencySymbol}</span>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => changePrice(item.productId, e.target.value)}
                      className="!min-h-0 w-20 !px-2 !py-1.5 text-sm"
                      title={t('pos.unitPrice')}
                    />
                  </div>
                  <div className="ms-auto flex items-center gap-1">
                    <button onClick={() => changeQty(item.productId, -1)} className="rounded-md border border-surface-border p-1 text-ink-muted hover:bg-surface-muted cursor-pointer">
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center text-sm">{item.qty}</span>
                    <button onClick={() => changeQty(item.productId, 1)} className="rounded-md border border-surface-border p-1 text-ink-muted hover:bg-surface-muted cursor-pointer">
                      <Plus size={14} />
                    </button>
                  </div>
                  <span className="w-20 shrink-0 text-end text-sm font-medium text-ink">{formatMoney(item.price * item.qty, settings.currencySymbol)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t border-surface-border px-4 py-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('pos.customerName')}>
              <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
            </Field>
            <Field label={t('pos.customerPhone')}>
              <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={t('pos.discountPercent')}>
              <Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
            </Field>
            <Field label={t('pos.paymentMethod')}>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">{t('pos.cash')}</option>
                <option value="card">{t('pos.card')}</option>
                <option value="easypaisa">{t('pos.easypaisa')}</option>
              </Select>
            </Field>
          </div>
          {paymentMethod === 'cash' && (
            <Field label={t('pos.amountPaid')}>
              <Input type="number" min="0" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} placeholder={formatMoney(total, settings.currencySymbol)} />
            </Field>
          )}

          <div className="space-y-1 rounded-lg bg-surface-muted/60 px-3 py-2.5 text-sm">
            <div className="flex justify-between text-ink-muted">
              <span>{t('pos.subtotal')}</span>
              <span>{formatMoney(subtotal, settings.currencySymbol)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>{t('pos.discount')}</span>
                <span>-{formatMoney(discountAmount, settings.currencySymbol)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-ink-muted">
                <span>{t('pos.tax')}</span>
                <span>{formatMoney(taxAmount, settings.currencySymbol)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-surface-border pt-1 text-base font-bold text-ink">
              <span>{t('pos.grandTotal')}</span>
              <span>{formatMoney(total, settings.currencySymbol)}</span>
            </div>
            {paymentMethod === 'cash' && amountPaid !== '' && (
              <div className="flex justify-between text-ink-muted">
                <span>{t('pos.changeDue')}</span>
                <span>{formatMoney(changeDue, settings.currencySymbol)}</span>
              </div>
            )}
          </div>

          <Button className="w-full" size="lg" disabled={!cart.length || submitting} onClick={handleCheckout}>
            {submitting ? t('pos.processing') : t('pos.checkout')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
