import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface AIModeContextType {
  isAIMode: boolean
  toggleAIMode: () => void
}

const AIModeContext = createContext<AIModeContextType | undefined>(undefined)

export const useAIMode = () => {
  const context = useContext(AIModeContext)
  if (context === undefined) {
    throw new Error('useAIMode must be used within an AIModeProvider')
  }
  return context
}

export const AIModeProvider = ({ children }: { children: ReactNode }) => {
  const [isAIMode, setIsAIMode] = useState(() => {
    // Prüfe localStorage beim ersten Laden
    const saved = localStorage.getItem('aiMode')
    if (saved !== null) {
      return JSON.parse(saved)
    }
    // Standard: KI-Modus ist aus (false)
    return false
  })

  useEffect(() => {
    // Speichere in localStorage
    localStorage.setItem('aiMode', JSON.stringify(isAIMode))
  }, [isAIMode])

  // Listen for logout/reset events
  useEffect(() => {
    const handleReset = () => {
      setIsAIMode(false)
    }

    window.addEventListener('aiModeReset', handleReset)

    return () => {
      window.removeEventListener('aiModeReset', handleReset)
    }
  }, [])

  const toggleAIMode = () => {
    setIsAIMode(!isAIMode)
  }

  return (
    <AIModeContext.Provider value={{ isAIMode, toggleAIMode }}>
      {children}
    </AIModeContext.Provider>
  )
}

