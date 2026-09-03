import { createContext, useContext, useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const defaultSettings = {
  name: 'Hunny Cosmetics',
  address: '',
  phone: '',
  currencySymbol: 'Rs',
  taxPercent: 0,
  receiptFooter: 'Thank you for shopping with us!',
  defaultReceiptFormat: 'normal',
  lowStockDefaultThreshold: 5,
}

const SettingsContext = createContext(defaultSettings)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings)

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'shop'),
      (snap) => {
        if (snap.exists()) setSettings({ ...defaultSettings, ...snap.data() })
      },
      () => {}
    )
    return unsub
  }, [])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  return useContext(SettingsContext)
}
