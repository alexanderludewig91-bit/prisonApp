import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { LogOut, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import LanguageSelector from './LanguageSelector'

const Navbar = () => {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Gruppenbasierte Navigation
  const getNavigation = () => {
    const baseNavigation: any[] = []

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
        { name: t('navigation.home'), href: '/my-services' },
        { name: t('navigation.allMyRequests'), href: '/all-my-services' },
        { name: t('navigation.newService'), href: '/new-service' },
        { name: t('navigation.accountInfo'), href: '/profile' }
      ]
    } else if (isStaff || isAdmin) {
             const staffNavigation = [
         { name: 'Antragsbearbeitung', href: '/staff-dashboard' },
         { name: 'Benutzerübersicht', href: '/user-overview' },
         { name: 'Insassenübersicht', href: '/inmates-overview' }
       ]
      
      // Admin-spezifische Links hinzufügen
      if (isAdmin) {
        staffNavigation.push({ name: 'Admin-Dashboard', href: '/admin-dashboard' })
        staffNavigation.push({ name: 'Hausverwaltung', href: '/house-management' })
      }
      
      return staffNavigation
    }

    return baseNavigation
  }

  const navigation = getNavigation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-[var(--nav-bg)] text-[var(--nav-fg)] ring-1 ring-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-[var(--nav-fg)]">
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
                      ? 'border-white text-[var(--nav-fg)]'
                      : 'border-transparent text-[var(--nav-fg-muted)] hover:border-white/50 hover:text-[var(--nav-fg)]'
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
                {/* Language Selector nur für Insassen anzeigen */}
                {user?.groups?.some(g => g.name === 'PS Inmates') && (
                  <LanguageSelector />
                )}
                <div className="text-sm text-[var(--nav-fg-muted)]">
                  {user?.firstName} {user?.lastName}
                </div>
                <button
                  onClick={logout}
                  className="flex items-center text-[var(--nav-fg-muted)] hover:text-[var(--nav-fg)] transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="ml-1">{t('navigation.logout')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
                          <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-white/90 hover:text-white hover:bg-white/10 transition-colors"
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
                     ? 'bg-white/10 border-white text-[var(--nav-fg)]'
                     : 'border-transparent text-[var(--nav-fg-muted)] hover:bg-white/10 hover:border-white/50 hover:text-[var(--nav-fg)]'
                 }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
                     <div className="pt-4 pb-3 border-t border-white/20">
                           <div className="flex items-center px-4">
                 <div className="flex-shrink-0">
                   <User className="h-8 w-8 text-white/90" />
                 </div>
                 <div className="ml-3">
                   <div className="text-base font-medium text-[var(--nav-fg)]">
                     {user?.firstName} {user?.lastName}
                   </div>
                   <div className="text-sm font-medium text-[var(--nav-fg-muted)]">
                     {user?.email}
                   </div>
                 </div>
               </div>
            <div className="mt-3 space-y-1">
              {/* Language Selector für Mobile nur für Insassen */}
              {user?.groups?.some(g => g.name === 'PS Inmates') && (
                <div className="px-4 py-2">
                  <LanguageSelector />
                </div>
              )}
                             <button
                 onClick={logout}
                 className="block w-full text-left px-4 py-2 text-base font-medium text-[var(--nav-fg-muted)] hover:text-[var(--nav-fg)] hover:bg-white/10 transition-colors"
               >
                 {t('navigation.logout')}
               </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
