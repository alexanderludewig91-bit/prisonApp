import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Gruppenbasierte Navigation
  const getNavigation = () => {
    const baseNavigation = []

    // Prüfe Gruppen-Mitgliedschaften
    const userGroups = user?.groups?.map(g => g.name) || []
    const isInmate = userGroups.some(group => group === 'PS Inmates')
    const isStaff = userGroups.some(group => 
      group.includes('PS General Enforcement Service') ||
      group.includes('PS Vollzugsabteilungsleitung') ||
      group.includes('PS Vollzugsleitung') ||
      group.includes('PS Anstaltsleitung') ||
      group.includes('PS Payments Office') ||
      group.includes('PS Medical Staff')
    )
    const isAdmin = userGroups.some(group => group === 'PS Designers')

    if (isInmate) {
      return [
        { name: 'Meine Anträge', href: '/my-services' },
        { name: 'Neuer Antrag', href: '/new-service' },
        { name: 'Kontoinformationen', href: '/profile' }
      ]
    } else if (isStaff || isAdmin) {
      const staffNavigation = [
        { name: 'Mitarbeiter-Dashboard', href: '/staff-dashboard' },
        { name: 'Anträge', href: '/services' },
        { name: 'Benutzer', href: '/users' }
      ]
      
      // Admin-spezifische Links hinzufügen
      if (isAdmin) {
        staffNavigation.push({ name: 'Admin-Dashboard', href: '/admin-dashboard' })
        staffNavigation.push({ name: 'Admin-Logs', href: '/admin-logs' })
        staffNavigation.push({ name: 'Hausverwaltung', href: '/house-management' })
      }
      
      return staffNavigation
    }

    return baseNavigation
  }

  const navigation = getNavigation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                Prisoner Services
              </h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive(item.href)
                      ? 'border-primary-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <div className="ml-3 relative">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-700">
                  {user?.firstName} {user?.lastName}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-1">Abmelden</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                  isActive(item.href)
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <User className="h-8 w-8 text-gray-400" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-sm font-medium text-gray-500">
                  {user?.email}
                </div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
