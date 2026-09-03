import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'

export async function saveShopSettings(data) {
  return setDoc(doc(db, 'settings', 'shop'), data, { merge: true })
}
