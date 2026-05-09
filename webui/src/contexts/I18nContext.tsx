import { createContext, useContext, useState, useCallback, type ReactNode, useMemo } from 'react'
import { t, translations, langRegistry, type LangCode } from '../i18n'

const STORAGE_KEY = 'tsee-lang'

function detectLang(): LangCode {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && translations[saved]) return saved
  const nav = navigator.language.toLowerCase()
  for (const meta of langRegistry) {
    if (nav.startsWith(meta.code.toLowerCase())) return meta.code
  }
  return langRegistry[0]?.code ?? 'en'
}

interface I18nContextType {
  lang: LangCode
  setLang: (lang: LangCode) => void
  t: (key: Parameters<typeof t>[0]) => string
  availableLangs: { code: LangCode; label: string }[]
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangRaw] = useState<LangCode>(detectLang)

  const setLang = useCallback((l: LangCode) => {
    setLangRaw(l)
    localStorage.setItem(STORAGE_KEY, l)
  }, [])

  const translate = useCallback(
    (key: Parameters<typeof t>[0]) => t(key, lang),
    [lang]
  )

  const availableLangs = useMemo(() => langRegistry.map(({ code, label }) => ({ code, label })), [])

  return (
    <I18nContext.Provider value={{ lang, setLang, t: translate, availableLangs }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
