export function formatMoney(amount, symbol = 'Rs') {
  const n = Number(amount) || 0
  return `${symbol} ${n.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatDate(value, lang = 'en') {
  if (!value) return '—'
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(value, lang = 'en') {
  if (!value) return '—'
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function daysUntil(value) {
  if (!value) return null
  const d = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const diffMs = d.setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}
