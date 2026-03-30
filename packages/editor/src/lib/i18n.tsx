'use client'

import { type ReactNode, createContext, useContext, useEffect, useState } from 'react'

export type Locale = 'en' | 'zh'

type Messages = typeof import('./messages/en.json')

const messagesCache: Record<Locale, Messages> = {
  en: {} as Messages,
  zh: {} as Messages,
}

const loadMessages = async (locale: Locale): Promise<Messages> => {
  if (Object.keys(messagesCache[locale]).length === 0) {
    const module = await import(`./messages/${locale}.json`)
    messagesCache[locale] = module.default || module
  }
  return messagesCache[locale]
}

type I18nContextType = {
  locale: Locale
  messages: Messages
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [messages, setMessages] = useState<Messages>({} as Messages)

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null
    if (savedLocale && (savedLocale === 'en' || savedLocale === 'zh')) {
      setLocaleState(savedLocale)
    }
  }, [])

  useEffect(() => {
    loadMessages(locale).then(setMessages)
  }, [locale])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    document.documentElement.lang = newLocale
  }

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.')
    let value: unknown = messages

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k]
      } else {
        return key
      }
    }

    if (typeof value !== 'string') {
      return key
    }

    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, String(paramValue)),
        value,
      )
    }

    return value
  }

  return (
    <I18nContext.Provider value={{ locale, messages, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export function useTranslation() {
  const { t, locale } = useI18n()
  return { t, locale }
}
