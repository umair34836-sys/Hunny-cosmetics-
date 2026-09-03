import { useState } from 'react'
import { Printer } from 'lucide-react'
import ReceiptDocument from './ReceiptDocument'
import Button from '../ui/Button'
import { useLanguage } from '../../i18n/LanguageContext'
import { useSettings } from '../../contexts/SettingsContext'

export default function ReceiptView({ sale }) {
  const { t } = useLanguage()
  const settings = useSettings()
  const [format, setFormat] = useState(settings.defaultReceiptFormat || 'normal')

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <div className="flex overflow-hidden rounded-lg border border-surface-border">
          <button
            onClick={() => setFormat('normal')}
            className={`px-3 py-2 text-sm cursor-pointer ${format === 'normal' ? 'bg-brand-600 text-white' : 'bg-white text-ink-muted hover:bg-surface-muted'}`}
          >
            {t('settings.formatNormal')}
          </button>
          <button
            onClick={() => setFormat('thermal')}
            className={`px-3 py-2 text-sm cursor-pointer ${format === 'thermal' ? 'bg-brand-600 text-white' : 'bg-white text-ink-muted hover:bg-surface-muted'}`}
          >
            {t('settings.formatThermal')}
          </button>
        </div>
        <Button size="sm" onClick={() => window.print()}>
          <Printer size={16} />
          {t('common.print')}
        </Button>
      </div>
      <div className="overflow-hidden rounded-xl border border-surface-border bg-surface-muted/40 p-4">
        <ReceiptDocument sale={sale} shop={settings} format={format} />
      </div>
    </div>
  )
}
