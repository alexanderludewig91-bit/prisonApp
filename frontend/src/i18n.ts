import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translations
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import ar from './locales/ar.json'
import fa from './locales/fa.json'
import tr from './locales/tr.json'
import ru from './locales/ru.json'
import pl from './locales/pl.json'
import it from './locales/it.json'

const resources = {
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  ar: { translation: ar },
  fa: { translation: fa },
  tr: { translation: tr },
  ru: { translation: ru },
  pl: { translation: pl },
  it: { translation: it }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'de',
    debug: process.env.NODE_ENV === 'development',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng'
    },

    interpolation: {
      escapeValue: false // React already does escaping
    },

    // RTL support
    supportedLngs: ['de', 'en', 'es', 'fr', 'ar', 'fa', 'tr', 'ru', 'pl', 'it'],
    
    // Language names for display
    load: 'languageOnly'
  })

export default i18n
