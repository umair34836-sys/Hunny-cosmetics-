import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp, runTransaction } from 'firebase/firestore'
import { auth, db } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [bootstrapNeeded, setBootstrapNeeded] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true)
      if (!fbUser) {
        setUser(null)
        setProfile(null)
        // Check whether an admin account has ever been created.
        try {
          const bootstrapSnap = await getDoc(doc(db, 'meta', 'bootstrap'))
          setBootstrapNeeded(!bootstrapSnap.exists())
        } catch {
          setBootstrapNeeded(false)
        }
        setLoading(false)
        return
      }
      setUser(fbUser)
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid))
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
      } catch {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

  async function logout() {
    await signOut(auth)
  }

  /**
   * Creates the very first admin account for this shop. Only succeeds once —
   * enforced by firestore.rules, which only allow this write while
   * meta/bootstrap does not exist yet.
   */
  async function createAdminAccount({ name, email, password }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const uid = cred.user.uid
    await runTransaction(db, async (tx) => {
      const bootstrapRef = doc(db, 'meta', 'bootstrap')
      const bootstrapSnap = await tx.get(bootstrapRef)
      if (bootstrapSnap.exists()) {
        throw new Error('An admin account already exists.')
      }
      tx.set(bootstrapRef, { createdAt: serverTimestamp(), createdBy: uid })
      tx.set(doc(db, 'users', uid), {
        name,
        email,
        role: 'admin',
        active: true,
        createdAt: serverTimestamp(),
      })
    })
    const snap = await getDoc(doc(db, 'users', uid))
    setProfile({ id: snap.id, ...snap.data() })
    return cred.user
  }

  const value = useMemo(
    () => ({
      user,
      profile,
      role: profile?.role || null,
      isAdmin: profile?.role === 'admin',
      isActive: profile?.active !== false,
      loading,
      bootstrapNeeded,
      login,
      logout,
      createAdminAccount,
    }),
    [user, profile, loading, bootstrapNeeded]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
