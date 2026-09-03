import { useRef, useState } from 'react'
import { Upload, FileWarning, CheckCircle2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Field'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useToast } from '../../contexts/ToastContext'
import { parseProductsCSV } from '../../lib/csv'
import { createProduct, updateProductPricingByName } from '../../lib/products'
import { formatMoney } from '../../lib/format'

const PLACEHOLDER_CREATE = `name,category,brand,sku,unit,costPrice,quantity,lowStockThreshold,expiryDate,supplier
Matte Lipstick,Lips,,,pcs,70,1,1,,
Facewash Cleanser,Skincare,,,pcs,100,1,1,,`

const PLACEHOLDER_UPDATE = `name,costPrice,sellingPrice
Matte Lipstick,70,98
Facewash Cleanser,100,140`

export default function BulkImportModal({ open, onClose }) {
  const { t } = useLanguage()
  const settings = useSettings()
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [mode, setMode] = useState('create') // 'create' | 'updatePrices'
  const [csvText, setCsvText] = useState('')
  const [parsed, setParsed] = useState(null) // { rows, errors }
  const [importing, setImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  function reset() {
    setCsvText('')
    setParsed(null)
    setImporting(false)
    setProgress(0)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function switchMode(next) {
    setMode(next)
    reset()
  }

  function handleParse(text) {
    setCsvText(text)
    if (!text.trim()) {
      setParsed(null)
      return
    }
    setParsed(parseProductsCSV(text))
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => handleParse(String(reader.result || ''))
    reader.readAsText(file)
    e.target.value = ''
  }

  async function handleImport() {
    if (!parsed?.rows.length) return
    setImporting(true)
    setProgress(0)

    if (mode === 'create') {
      let created = 0
      let failed = 0
      for (const row of parsed.rows) {
        try {
          await createProduct(row)
          created++
        } catch {
          failed++
        }
        setProgress((p) => p + 1)
      }
      setImporting(false)
      if (created) toast.success(`${created} product${created === 1 ? '' : 's'} imported.`)
      if (failed) toast.error(`${failed} row${failed === 1 ? '' : 's'} failed to import.`)
    } else {
      let updated = 0
      let notFound = 0
      for (const row of parsed.rows) {
        try {
          const result = await updateProductPricingByName(row)
          if (result === 'updated') updated++
          else notFound++
        } catch {
          notFound++
        }
        setProgress((p) => p + 1)
      }
      setImporting(false)
      if (updated) toast.success(`${updated} product price${updated === 1 ? '' : 's'} updated.`)
      if (notFound) toast.error(`${notFound} product${notFound === 1 ? '' : 's'} not found (name must match exactly) — skipped.`)
    }
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} title={t('products.bulkImport')} size="xl">
      <div className="space-y-4">
        <div className="flex w-fit overflow-hidden rounded-lg border border-surface-border">
          <button
            type="button"
            onClick={() => switchMode('create')}
            className={`px-3 py-2 text-sm cursor-pointer ${mode === 'create' ? 'bg-brand-600 text-white' : 'bg-white text-ink-muted hover:bg-surface-muted'}`}
          >
            {t('products.modeCreate')}
          </button>
          <button
            type="button"
            onClick={() => switchMode('updatePrices')}
            className={`px-3 py-2 text-sm cursor-pointer ${mode === 'updatePrices' ? 'bg-brand-600 text-white' : 'bg-white text-ink-muted hover:bg-surface-muted'}`}
          >
            {t('products.modeUpdatePrices')}
          </button>
        </div>

        <p className="text-sm text-ink-muted">{mode === 'create' ? t('products.bulkImportHelp') : t('products.updatePricesHelp')}</p>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload size={15} />
            {t('products.uploadCsv')}
          </Button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          <span className="text-xs text-ink-soft">{t('products.orPasteBelow')}</span>
        </div>

        <Textarea
          rows={7}
          className="font-mono text-xs"
          placeholder={mode === 'create' ? PLACEHOLDER_CREATE : PLACEHOLDER_UPDATE}
          value={csvText}
          onChange={(e) => handleParse(e.target.value)}
        />

        {parsed && (
          <div className="space-y-2">
            {parsed.errors.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-warning-bg px-3 py-2 text-xs text-warning">
                <FileWarning size={15} className="mt-0.5 shrink-0" />
                <div>
                  {parsed.errors.map((e, i) => (
                    <p key={i}>{t('common.line')} {e.line}: {e.message}</p>
                  ))}
                </div>
              </div>
            )}

            {parsed.rows.length > 0 ? (
              <>
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 size={16} />
                  {t('products.readyToImport', { n: parsed.rows.length })}
                </div>
                <div className="max-h-60 overflow-y-auto scrollbar-thin rounded-lg border border-surface-border">
                  <table className="w-full text-start text-xs">
                    <thead className="sticky top-0 border-b border-surface-border bg-surface-muted text-ink-soft">
                      <tr>
                        <th className="px-3 py-2 text-start">{t('common.name')}</th>
                        {mode === 'create' && <th className="px-3 py-2 text-start">{t('common.category')}</th>}
                        <th className="px-3 py-2 text-start">{t('products.costPrice')}</th>
                        {mode === 'updatePrices' && <th className="px-3 py-2 text-start">{t('products.sellingPrice')}</th>}
                        {mode === 'create' && <th className="px-3 py-2 text-start">{t('common.quantity')}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.rows.map((r, i) => (
                        <tr key={i} className="border-b border-surface-border last:border-0">
                          <td className="px-3 py-1.5 text-ink">{r.name}</td>
                          {mode === 'create' && <td className="px-3 py-1.5 text-ink-muted">{r.category || '—'}</td>}
                          <td className="px-3 py-1.5 text-ink-muted">{formatMoney(r.costPrice, settings.currencySymbol)}</td>
                          {mode === 'updatePrices' && <td className="px-3 py-1.5 text-ink-muted">{formatMoney(r.sellingPrice, settings.currencySymbol)}</td>}
                          {mode === 'create' && <td className="px-3 py-1.5 text-ink-muted">{r.quantity} {r.unit}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-muted">{t('common.noResults')}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-surface-border pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>{t('common.cancel')}</Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!parsed?.rows.length || importing}
          >
            {importing
              ? `${t('common.saving')} (${progress}/${parsed?.rows.length})`
              : mode === 'create'
              ? t('products.importAll', { n: parsed?.rows.length || 0 })
              : t('products.updateAll', { n: parsed?.rows.length || 0 })}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
