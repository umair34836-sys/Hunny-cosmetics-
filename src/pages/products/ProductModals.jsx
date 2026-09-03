import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Field'
import { useLanguage } from '../../i18n/LanguageContext'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { createProduct, updateProduct, stockIn, adjustStock } from '../../lib/products'

const emptyForm = {
  name: '',
  category: '',
  brand: '',
  sku: '',
  unit: 'pcs',
  costPrice: '',
  sellingPrice: '',
  quantity: '',
  lowStockThreshold: '5',
  expiryDate: '',
  supplier: '',
}

export function ProductFormModal({ open, onClose, product }) {
  const { t } = useLanguage()
  const toast = useToast()
  const [form, setForm] = useState(() => (product ? mapProductToForm(product) : emptyForm))
  const [submitting, setSubmitting] = useState(false)

  function mapProductToForm(p) {
    return {
      name: p.name || '',
      category: p.category || '',
      brand: p.brand || '',
      sku: p.sku || '',
      unit: p.unit || 'pcs',
      costPrice: p.costPrice ?? '',
      sellingPrice: p.sellingPrice ?? '',
      quantity: p.quantity ?? '',
      lowStockThreshold: p.lowStockThreshold ?? '5',
      expiryDate: p.expiryDate || '',
      supplier: p.supplier || '',
    }
  }

  function update(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (product) {
        await updateProduct(product.id, form)
        toast.success(t('common.savedChanges'))
      } else {
        await createProduct(form)
        toast.success(t('common.savedChanges'))
      }
      onClose()
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={product ? t('products.edit') : t('products.add')} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={t('common.name')} required>
            <Input required value={form.name} onChange={(e) => update('name', e.target.value)} />
          </Field>
          <Field label={t('products.sku')}>
            <Input value={form.sku} onChange={(e) => update('sku', e.target.value)} />
          </Field>
          <Field label={t('common.category')}>
            <Input value={form.category} onChange={(e) => update('category', e.target.value)} />
          </Field>
          <Field label={t('common.brand')}>
            <Input value={form.brand} onChange={(e) => update('brand', e.target.value)} />
          </Field>
          <Field label={t('products.costPrice')} required>
            <Input type="number" min="0" step="0.01" required value={form.costPrice} onChange={(e) => update('costPrice', e.target.value)} />
          </Field>
          <Field label={t('products.sellingPrice')} required>
            <Input type="number" min="0" step="0.01" required value={form.sellingPrice} onChange={(e) => update('sellingPrice', e.target.value)} />
          </Field>
          <Field label={product ? t('products.currentStock') : t('common.quantity')} required>
            <Input type="number" min="0" required disabled={!!product} value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
          </Field>
          <Field label={t('common.unit')}>
            <Input placeholder={t('products.unitPlaceholder')} value={form.unit} onChange={(e) => update('unit', e.target.value)} />
          </Field>
          <Field label={t('products.lowStockThreshold')}>
            <Input type="number" min="0" value={form.lowStockThreshold} onChange={(e) => update('lowStockThreshold', e.target.value)} />
          </Field>
          <Field label={t('products.expiryDate')}>
            <Input type="date" value={form.expiryDate} onChange={(e) => update('expiryDate', e.target.value)} />
          </Field>
          <Field label={t('products.supplier')} htmlFor="supplier">
            <Input id="supplier" value={form.supplier} onChange={(e) => update('supplier', e.target.value)} />
          </Field>
        </div>
        {product && (
          <p className="text-xs text-ink-soft">{t('products.stockIn')} / {t('products.adjust')} — use the dedicated buttons on the product row to change stock levels.</p>
        )}
        <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={submitting}>{submitting ? t('common.saving') : t('common.save')}</Button>
        </div>
      </form>
    </Modal>
  )
}

export function StockInModal({ open, onClose, product }) {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const toast = useToast()
  const [qty, setQty] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await stockIn(product.id, qty, { reason, actorId: profile.id, actorName: profile.name })
      toast.success(t('common.savedChanges'))
      setQty('')
      setReason('')
      onClose()
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Modal open={open} onClose={onClose} title={t('products.stockInTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink-muted">{product.name} — {t('products.currentStock')}: <span className="font-medium text-ink">{product.quantity} {product.unit}</span></p>
        <Field label={t('products.stockInQty')} required>
          <Input type="number" min="1" required value={qty} onChange={(e) => setQty(e.target.value)} />
        </Field>
        <Field label={`${t('products.supplier')} / ${t('common.notes')}`}>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="success" disabled={submitting}>{submitting ? t('common.saving') : t('products.stockIn')}</Button>
        </div>
      </form>
    </Modal>
  )
}

export function AdjustStockModal({ open, onClose, product }) {
  const { t } = useLanguage()
  const { profile } = useAuth()
  const toast = useToast()
  const [delta, setDelta] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await adjustStock(product.id, delta, { reason, actorId: profile.id, actorName: profile.name })
      toast.success(t('common.savedChanges'))
      setDelta('')
      setReason('')
      onClose()
    } catch (err) {
      toast.error(err?.message || t('common.errorGeneric'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!product) return null

  return (
    <Modal open={open} onClose={onClose} title={t('products.adjust')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-ink-muted">{product.name} — {t('products.currentStock')}: <span className="font-medium text-ink">{product.quantity} {product.unit}</span></p>
        <Field label={`${t('common.quantity')} (+/-)`} required>
          <Input type="number" required placeholder="-2" value={delta} onChange={(e) => setDelta(e.target.value)} />
        </Field>
        <Field label={t('products.adjustReason')} required>
          <Textarea rows={2} required placeholder={t('products.adjustReasonPlaceholder')} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <div className="flex justify-end gap-2 border-t border-surface-border pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" disabled={submitting}>{submitting ? t('common.saving') : t('products.adjust')}</Button>
        </div>
      </form>
    </Modal>
  )
}
