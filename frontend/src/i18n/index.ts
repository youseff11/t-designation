import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import type { Lang } from '@/api/types'
import ar from './locales/ar.json'
import en from './locales/en.json'

export const DIRECTION: Record<Lang, 'rtl' | 'ltr'> = { ar: 'rtl', en: 'ltr' }

/** يضبط lang/dir على <html> — الـCSS (خطوط وتباعد) بيعتمد عليهم. */
export function applyDocumentLanguage(lang: Lang) {
  document.documentElement.lang = lang
  document.documentElement.dir = DIRECTION[lang]
}

export function initI18n(lang: Lang) {
  void i18n.use(initReactI18next).init({
    lng: lang,
    fallbackLng: 'ar',
    resources: { ar: { translation: ar }, en: { translation: en } },
    interpolation: { escapeValue: false }, // React بيهرّب لوحده
    returnNull: false,
  })
  applyDocumentLanguage(lang)
  return i18n
}

export default i18n
