import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore'
import { db } from '../firebase'

const productsCol = collection(db, 'products')

export function listenProducts(onData, onError) {
  const q = query(productsCol, orderBy('name'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export function listenStockMovements(onData, onError, max = 200) {
  const q = query(collection(db, 'stockMovements'), orderBy('createdAt', 'desc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.slice(0, max).map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

export async function createProduct(data) {
  return addDoc(productsCol, {
    ...data,
    quantity: Number(data.quantity) || 0,
    costPrice: Number(data.costPrice) || 0,
    sellingPrice: Number(data.sellingPrice) || 0,
    lowStockThreshold: Number(data.lowStockThreshold) || 5,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateProduct(id, data) {
  const payload = { ...data, updatedAt: serverTimestamp() }
  if ('quantity' in payload) payload.quantity = Number(payload.quantity) || 0
  if ('costPrice' in payload) payload.costPrice = Number(payload.costPrice) || 0
  if ('sellingPrice' in payload) payload.sellingPrice = Number(payload.sellingPrice) || 0
  if ('lowStockThreshold' in payload) payload.lowStockThreshold = Number(payload.lowStockThreshold) || 0
  return updateDoc(doc(db, 'products', id), payload)
}

export async function deleteProduct(id) {
  return deleteDoc(doc(db, 'products', id))
}

/**
 * Restock a product (purchase received from supplier). Increases quantity
 * and writes an immutable stockMovements audit entry, atomically.
 */
export async function stockIn(productId, qty, { reason = '', actorId, actorName }) {
  const qtyNum = Number(qty)
  if (!qtyNum || qtyNum <= 0) throw new Error('Quantity must be greater than zero.')
  const productRef = doc(db, 'products', productId)
  const movementRef = doc(collection(db, 'stockMovements'))
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef)
    if (!snap.exists()) throw new Error('Product not found.')
    const prev = Number(snap.data().quantity) || 0
    const next = prev + qtyNum
    tx.update(productRef, { quantity: next, updatedAt: serverTimestamp() })
    tx.set(movementRef, {
      productId,
      productName: snap.data().name,
      type: 'in',
      quantity: qtyNum,
      previousQty: prev,
      newQty: next,
      reason,
      performedBy: actorId,
      performedByName: actorName,
      createdAt: serverTimestamp(),
    })
  })
}

/**
 * Manual stock correction (damage, loss, count correction). deltaQty can be
 * negative or positive.
 */
export async function adjustStock(productId, deltaQty, { reason, actorId, actorName }) {
  const delta = Number(deltaQty)
  if (!delta) throw new Error('Enter a non-zero adjustment.')
  if (!reason?.trim()) throw new Error('A reason is required for stock adjustments.')
  const productRef = doc(db, 'products', productId)
  const movementRef = doc(collection(db, 'stockMovements'))
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(productRef)
    if (!snap.exists()) throw new Error('Product not found.')
    const prev = Number(snap.data().quantity) || 0
    const next = Math.max(0, prev + delta)
    tx.update(productRef, { quantity: next, updatedAt: serverTimestamp() })
    tx.set(movementRef, {
      productId,
      productName: snap.data().name,
      type: 'adjustment',
      quantity: delta,
      previousQty: prev,
      newQty: next,
      reason,
      performedBy: actorId,
      performedByName: actorName,
      createdAt: serverTimestamp(),
    })
  })
}
