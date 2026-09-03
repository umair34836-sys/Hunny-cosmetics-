import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Hunny Cosmetics — Firebase project config.
// Safe to keep in the client bundle: these are public identifiers, not
// secrets. Actual access control is enforced by Firestore/Auth security
// rules (see firestore.rules), not by hiding this object.
export const firebaseConfig = {
  apiKey: 'AIzaSyDZDUdZOHOQSxWlbjl1JkhB1DQ6Dxtv2sI',
  authDomain: 'hunny-cosmetics.firebaseapp.com',
  projectId: 'hunny-cosmetics',
  storageBucket: 'hunny-cosmetics.firebasestorage.app',
  messagingSenderId: '886059343839',
  appId: '1:886059343839:web:c01eac0f70f64ebae2ae6a',
}

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// A second, isolated Firebase app instance used ONLY when an admin creates
// a new staff account. Firebase Auth's createUserWithEmailAndPassword signs
// the caller in as the newly created user on whatever app instance you call
// it on — running it on this secondary instance keeps the admin's own
// session on `auth` untouched.
export function getSecondaryAuth() {
  const secondaryApp = getApps().find((a) => a.name === 'Secondary') || initializeApp(firebaseConfig, 'Secondary')
  return getAuth(secondaryApp)
}
