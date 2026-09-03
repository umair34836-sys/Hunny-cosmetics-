import { formatMoney, formatDateTime } from '../../lib/format'
import { useLanguage } from '../../i18n/LanguageContext'

export default function ReceiptDocument({ sale, shop, format = 'normal' }) {
  const { t, lang } = useLanguage()
  if (!sale) return null

  const symbol = shop.currencySymbol || 'Rs'
  const isThermal = format === 'thermal'

  return (
    <div
      id="print-area"
      dir={lang === 'ur' ? 'rtl' : 'ltr'}
      className={
        isThermal
          ? 'receipt-thermal mx-auto bg-white p-3 text-[12px] leading-snug text-ink'
          : 'mx-auto max-w-[560px] bg-white p-8 text-sm text-ink'
      }
    >
      <div className="text-center">
        <h1 className={isThermal ? 'text-sm font-bold' : 'text-xl font-bold'}>{shop.name}</h1>
        {shop.address && <p className="text-xs text-ink-muted">{shop.address}</p>}
        {shop.phone && <p className="text-xs text-ink-muted">{shop.phone}</p>}
      </div>

      <div className={`my-3 border-t border-dashed border-ink-soft/40 ${isThermal ? '' : 'my-4'}`} />

      <div className={`flex justify-between ${isThermal ? 'text-[11px]' : 'text-sm'}`}>
        <span>{t('pos.invoiceNo')}</span>
        <span className="font-medium">{sale.invoiceNo}</span>
      </div>
      <div className={`flex justify-between ${isThermal ? 'text-[11px]' : 'text-sm'}`}>
        <span>{t('common.date')}</span>
        <span>{formatDateTime(sale.createdAt, lang)}</span>
      </div>
      <div className={`flex justify-between ${isThermal ? 'text-[11px]' : 'text-sm'}`}>
        <span>{t('receipt.cashier')}</span>
        <span>{sale.cashierName}</span>
      </div>
      {sale.customerName && (
        <div className={`flex justify-between ${isThermal ? 'text-[11px]' : 'text-sm'}`}>
          <span>{t('receipt.customer')}</span>
          <span>{sale.customerName}{sale.customerPhone ? ` (${sale.customerPhone})` : ''}</span>
        </div>
      )}

      <div className="my-3 border-t border-dashed border-ink-soft/40" />

      <table className="w-full">
        <thead>
          <tr className={isThermal ? 'text-[11px]' : 'text-xs text-ink-muted'}>
            <th className="pb-1 text-start">{t('receipt.item')}</th>
            <th className="pb-1 text-center">{t('receipt.qty')}</th>
            <th className="pb-1 text-end">{t('receipt.rate')}</th>
            <th className="pb-1 text-end">{t('receipt.amount')}</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, i) => (
            <tr key={i} className={isThermal ? 'text-[11px]' : 'text-sm'}>
              <td className="py-0.5">{item.name}</td>
              <td className="py-0.5 text-center">{item.qty}</td>
              <td className="py-0.5 text-end">{formatMoney(item.price, symbol)}</td>
              <td className="py-0.5 text-end">{formatMoney(item.lineTotal, symbol)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="my-3 border-t border-dashed border-ink-soft/40" />

      <div className={`space-y-1 ${isThermal ? 'text-[11px]' : 'text-sm'}`}>
        <div className="flex justify-between">
          <span>{t('pos.subtotal')}</span>
          <span>{formatMoney(sale.subtotal, symbol)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>{t('pos.discount')}</span>
            <span>-{formatMoney(sale.discountAmount, symbol)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>{t('pos.tax')} ({sale.taxPercent}%)</span>
            <span>{formatMoney(sale.taxAmount, symbol)}</span>
          </div>
        )}
        <div className={`flex justify-between border-t border-ink-soft/30 pt-1 font-bold ${isThermal ? 'text-sm' : 'text-base'}`}>
          <span>{t('pos.grandTotal')}</span>
          <span>{formatMoney(sale.total, symbol)}</span>
        </div>
      </div>

      <div className="my-3 border-t border-dashed border-ink-soft/40" />

      <p className={`text-center text-ink-muted ${isThermal ? 'text-[10px]' : 'text-xs'}`}>{shop.receiptFooter}</p>
    </div>
  )
}
