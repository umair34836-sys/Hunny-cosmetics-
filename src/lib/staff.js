import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore'
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth'
import { db, getSecondaryAuth } from '../firebase'

export function listenStaff(onData, onError) {
  const q = query(collection(db, 'users'), orderBy('createdAt', 'asc'))
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  )
}

/**
 * Creates a new staff (cashier/admin) account without disturbing the
 * currently signed-in admin's session. Uses a second, isolated Firebase
 * Auth app instance to create the user, then immediately signs that
 * instance out — the admin's own `auth` session on the primary app is
 * untouched throughout.
 */
export async function createStaffAccount({ name, email, password, role, actorId }) {
  const secondaryAuth = getSecondaryAuth()
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password)
  const uid = cred.user.uid
  try {
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      role,
      active: true,
      createdAt: serverTimestamp(),
      createdBy: actorId,
    })
  } finally {
    await signOut(secondaryAuth)
  }
  return uid
}

export async function setStaffActive(uid, active) {
  return updateDoc(doc(db, 'users', uid), { active })
}

export async function setStaffRole(uid, role) {
  return updateDoc(doc(db, 'users', uid), { role })
}
