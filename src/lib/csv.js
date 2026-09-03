// Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas,
// escaped quotes (""), and \r\n or \n line endings. Good enough for pasted
// spreadsheet data without pulling in a dependency.
export function parseCSV(text) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      pushField()
    } else if (c === '\n') {
      pushRow()
    } else if (c === '\r') {
      // skip, \n handles the row break
    } else {
      field += c
    }
  }
  if (field !== '' || row.length) pushRow()

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ''))
}

const PRODUCT_COLUMNS = [
  'name',
  'category',
  'brand',
  'sku',
  'unit',
  'costPrice',
  'sellingPrice',
  'quantity',
  'lowStockThreshold',
  'expiryDate',
  'supplier',
]

/**
 * Parses CSV text (with a header row) into product objects ready for
 * createProduct(). Only `name` is required — everything else defaults.
 * Returns { rows, errors } where errors are { line, message }.
 */
export function parseProductsCSV(text) {
  const table = parseCSV(text.trim())
  if (!table.length) return { rows: [], errors: [{ line: 0, message: 'Empty file.' }] }

  const header = table[0].map((h) => h.trim())
  const knownHeader = header.some((h) => PRODUCT_COLUMNS.includes(h.trim()))
  const dataRows = knownHeader ? table.slice(1) : table
  const cols = knownHeader ? header : PRODUCT_COLUMNS

  const rows = []
  const errors = []

  dataRows.forEach((raw, idx) => {
    const line = idx + (knownHeader ? 2 : 1)
    const obj = {}
    cols.forEach((col, i) => {
      obj[col.trim()] = (raw[i] ?? '').trim()
    })
    if (!obj.name) {
      if (raw.some((v) => v?.trim())) errors.push({ line, message: 'Missing product name — row skipped.' })
      return
    }
    rows.push({
      name: obj.name,
      category: obj.category || '',
      brand: obj.brand || '',
      sku: obj.sku || '',
      unit: obj.unit || 'pcs',
      costPrice: Number(obj.costPrice) || 0,
      sellingPrice: Number(obj.sellingPrice) || Number(obj.costPrice) || 0,
      quantity: Number(obj.quantity) || 0,
      lowStockThreshold: obj.lowStockThreshold !== '' && !Number.isNaN(Number(obj.lowStockThreshold)) ? Number(obj.lowStockThreshold) : 5,
      expiryDate: obj.expiryDate || '',
      supplier: obj.supplier || '',
    })
  })

  return { rows, errors }
}
