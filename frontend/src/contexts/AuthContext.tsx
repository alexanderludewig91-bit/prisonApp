import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { loginUser, verifyToken } from '../services/api'

interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  groups: Array<{
    id: number
    name: string
    category: string
    role: string
  }>
  permissions: string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        try {
          const userData = await verifyToken(storedToken)
          setUser(userData)
          setToken(storedToken)
        } catch (error) {
          console.error('Token verification failed:', error)
          localStorage.removeItem('token')
          setToken(null)
        }
      }
      setLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await loginUser(username, password)
      console.log('Login response:', response) // DEBUG: Login-Antwort anzeigen
      setUser(response.user)
      setToken(response.token)
      localStorage.setItem('token', response.token)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    // KI-Modus auf Standard (aus) zurücksetzen
    localStorage.setItem('aiMode', 'false')
    // Sprache auf Deutsch zurücksetzen
    localStorage.setItem('i18nextLng', 'de')
    // Dispatch custom events to update contexts immediately
    window.dispatchEvent(new Event('aiModeReset'))
    window.dispatchEvent(new Event('languageReset'))
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
