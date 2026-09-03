import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase'

/** Profit for one sale: sum of (sellingPrice - costPrice) x qty per line item. */
export function computeSaleProfit(sale) {
  return (sale.items || []).reduce((sum, item) => sum + (item.price - (item.costPrice || 0)) * item.qty, 0)
}

export function listenSales(onData, onError) {
  const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

/**
 * Completes a sale atomically: validates stock, decrements each product's
 * quantity, writes the sale record, an audit stockMovement per line item,
 * and advances the sequential invoice counter — all in one transaction so a
 * half-completed sale (bill saved but stock not deducted, or vice versa)
 * can never happen.
 *
 * @param {Array<{productId:string, name:string, sku?:string, unit?:string, qty:number, price:number, costPrice:number}>} cart
 * @param {object} meta
 */
export async function createSale(cart, meta) {
  if (!cart?.length) throw new Error('Cart is empty.')

  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0)
  const discountPercent = Number(meta.discountPercent) || 0
  const discountAmount = meta.discountAmount != null ? Number(meta.discountAmount) : (subtotal * discountPercent) / 100
  const taxPercent = Number(meta.taxPercent) || 0
  const taxableAmount = Math.max(0, subtotal - discountAmount)
  const taxAmount = (taxableAmount * taxPercent) / 100
  const total = Math.round((taxableAmount + taxAmount) * 100) / 100

  const counterRef = doc(db, 'counters', 'invoice')
  const saleRef = doc(collection(db, 'sales'))
  const productRefs = cart.map((item) => doc(db, 'products', item.productId))
  const movementRefs = cart.map(() => doc(collection(db, 'stockMovements')))

  const result = await runTransaction(db, async (tx) => {
    const counterSnap = await tx.get(counterRef)
    const productSnaps = []
    for (const ref of productRefs) {
      productSnaps.push(await tx.get(ref))
    }

    productSnaps.forEach((snap, i) => {
      if (!snap.exists()) throw new Error(`${cart[i].name} no longer exists.`)
      const available = Number(snap.data().quantity) || 0
      if (available < cart[i].qty) {
        throw new Error(`Not enough stock for ${cart[i].name}. Only ${available} left.`)
      }
    })

    const nextInvoice = (counterSnap.exists() ? Number(counterSnap.data().value) || 0 : 0) + 1
    const invoiceNo = `INV-${String(nextInvoice).padStart(5, '0')}`

    tx.set(counterRef, { value: nextInvoice }, { merge: true })

    productSnaps.forEach((snap, i) => {
      const prev = Number(snap.data().quantity) || 0
      const next = prev - cart[i].qty
      tx.update(productRefs[i], { quantity: next, updatedAt: serverTimestamp() })
      tx.set(movementRefs[i], {
        productId: cart[i].productId,
        productName: cart[i].name,
        type: 'sale',
        quantity: -cart[i].qty,
        previousQty: prev,
        newQty: next,
        refType: 'sale',
        refId: saleRef.id,
        performedBy: meta.cashierId,
        performedByName: meta.cashierName,
        createdAt: serverTimestamp(),
      })
    })

    tx.set(saleRef, {
      invoiceNo,
      items: cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        sku: item.sku || '',
        unit: item.unit || '',
        qty: item.qty,
        price: item.price,
        costPrice: item.costPrice || 0,
        lineTotal: Math.round(item.qty * item.price * 100) / 100,
      })),
      subtotal: Math.round(subtotal * 100) / 100,
      discountPercent,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxPercent,
      taxAmount: Math.round(taxAmount * 100) / 100,
      total,
      paymentMethod: meta.paymentMethod || 'cash',
      amountPaid: meta.amountPaid != null ? Number(meta.amountPaid) : total,
      customerName: meta.customerName || '',
      customerPhone: meta.customerPhone || '',
      cashierId: meta.cashierId,
      cashierName: meta.cashierName,
      status: 'completed',
      createdAt: serverTimestamp(),
    })

    return { saleId: saleRef.id, invoiceNo, total }
  })

  return result
}

/**
 * Refunds/voids a completed sale: restores every line item's quantity back
 * onto the product, logs a 'return' stockMovement per item, and marks the
 * sale as refunded. Atomic — a partial refund (stock restored but sale not
 * marked, or vice versa) can never happen.
 */
export async function refundSale(saleId, { actorId, actorName }) {
  const saleRef = doc(db, 'sales', saleId)

  return runTransaction(db, async (tx) => {
    const saleSnap = await tx.get(saleRef)
    if (!saleSnap.exists()) throw new Error('Sale not found.')
    const sale = saleSnap.data()
    if (sale.status === 'refunded') throw new Error('This sale was already refunded.')

    const items = sale.items || []
    const productRefs = items.map((item) => doc(db, 'products', item.productId))
    const productSnaps = []
    for (const ref of productRefs) {
      productSnaps.push(await tx.get(ref))
    }

    items.forEach((item, i) => {
      const snap = productSnaps[i]
      if (!snap.exists()) return // product deleted since sale — skip restoring it
      const prev = Number(snap.data().quantity) || 0
      const next = prev + item.qty
      tx.update(productRefs[i], { quantity: next, updatedAt: serverTimestamp() })
      const movementRef = doc(collection(db, 'stockMovements'))
      tx.set(movementRef, {
        productId: item.productId,
        productName: item.name,
        type: 'return',
        quantity: item.qty,
        previousQty: prev,
        newQty: next,
        refType: 'sale',
        refId: saleId,
        performedBy: actorId,
        performedByName: actorName,
        createdAt: serverTimestamp(),
      })
    })

    tx.update(saleRef, {
      status: 'refunded',
      refundedAt: serverTimestamp(),
      refundedBy: actorId,
      refundedByName: actorName,
    })
  })
}
