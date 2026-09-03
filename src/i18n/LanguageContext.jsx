import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { translate } from './translations'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('hc-lang') || 'en')

  useEffect(() => {
    localStorage.setItem('hc-lang', lang)
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr'
  }, [lang])

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang])

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'en' ? 'ur' : 'en'))
  }, [])

  const value = useMemo(() => ({ lang, setLang, toggleLang, t, dir: lang === 'ur' ? 'rtl' : 'ltr' }), [lang, toggleLang, t])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
