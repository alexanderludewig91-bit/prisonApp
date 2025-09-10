import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface Language {
  code: string
  name: string
  flag: string
  rtl?: boolean
}

interface LanguageContextType {
  currentLanguage: string
  setLanguage: (languageCode: string) => void
  availableLanguages: Language[]
  isRTL: boolean
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', rtl: true },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' }
]

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { i18n, t } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    // Load from localStorage first, then i18n, then default to 'de'
    return localStorage.getItem('i18nextLng') || i18n.language || 'de'
  })
  const [isRTL, setIsRTL] = useState<boolean>(false)

  // Initialize language on mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng')
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage)
      setCurrentLanguage(savedLanguage)
    }
  }, [i18n])

  // Update RTL state when language changes
  useEffect(() => {
    const language = AVAILABLE_LANGUAGES.find(lang => lang.code === currentLanguage)
    setIsRTL(language?.rtl || false)
    
    // Update document direction
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
    document.documentElement.lang = currentLanguage
  }, [currentLanguage, isRTL])

  const setLanguage = (languageCode: string) => {
    const language = AVAILABLE_LANGUAGES.find(lang => lang.code === languageCode)
    if (language) {
      setCurrentLanguage(languageCode)
      i18n.changeLanguage(languageCode)
      
      // Store in localStorage
      localStorage.setItem('i18nextLng', languageCode)
    }
  }

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
    isRTL,
    t
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
