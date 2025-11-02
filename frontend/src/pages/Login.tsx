import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Lock, User, LogIn, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(username, password)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Anmeldung fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#060E5D] via-[#1a47a3] to-[#060E5D] py-12 px-4 sm:px-6 lg:px-8">
      {/* Dekorative Hintergrund-Elemente */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-md w-full">
        {/* Login-Karte */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header mit Gradient */}
          <div className="bg-gradient-to-r from-[#060E5D] to-[#1a47a3] px-8 py-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Prisoner Services
            </h2>
            <p className="text-white/90 text-sm">
              Melden Sie sich an, um fortzufahren
            </p>
          </div>

          {/* Formular */}
          <form className="px-8 py-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Benutzername */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full pl-12 pr-4 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#060E5D]/20 focus:border-[#060E5D] transition-all bg-gray-50 hover:bg-white"
                  placeholder="Benutzername"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              {/* Passwort */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="appearance-none relative block w-full pl-12 pr-12 py-3 border-2 border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#060E5D]/20 focus:border-[#060E5D] transition-all bg-gray-50 hover:bg-white"
                  placeholder="Passwort"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-[#060E5D] transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Fehler-Meldung */}
            {error && (
              <div className="rounded-xl bg-red-50 border-2 border-red-200 p-4 animate-in fade-in">
                <div className="text-sm text-red-700 font-medium">{error}</div>
              </div>
            )}

            {/* Login-Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-[#060E5D] to-[#1a47a3] hover:from-[#050B4A] hover:to-[#15388a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#060E5D]/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl hover:scale-[1.02]"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Anmelden...
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5 mr-2" />
                    Anmelden
                  </>
                )}
              </button>
            </div>

            {/* Footer: Impressum & Datenschutz + Copyright */}
            <div className="text-center pt-6 border-t border-gray-200 space-y-2">
              <div className="text-xs text-gray-600">
                <Link to="/legal" className="hover:text-[#060E5D] transition-colors">Impressum & Datenschutz</Link>
              </div>
              <p className="text-xs text-gray-500">
                © 2025 Dr. Alexander Hayward - Prisoner Services System. Alle Rechte vorbehalten.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
