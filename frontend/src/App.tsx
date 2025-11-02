import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'
import api from './services/api'


import ServiceDetail from './pages/ServiceDetail'
import ServiceDetailParticipationMoney from './pages/ServiceDetailParticipationMoney'
import MyServices from './pages/MyServices'
import AllMyServices from './pages/AllMyServices'
import NewService from './pages/NewService'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogs from './pages/AdminLogs'
import HouseManagement from './pages/HouseManagement'
import InmatesOverview from './pages/InmatesOverview'
import UserOverview from './pages/UserOverview'
import Profile from './pages/Profile'
import Legal from './pages/Legal'
import { AuthProvider } from './contexts/AuthContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { AIModeProvider } from './contexts/AIModeContext'
import './App.css'

// Komponente für Service-Detail-Routing basierend auf Service-Type
const ServiceDetailRouter = () => {
  const { id } = useParams<{ id: string }>()
  const [serviceType, setServiceType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchServiceType = async () => {
      try {
        const response = await api.get(`/services/${id}`)
        setServiceType(response.data.serviceType)
      } catch (error) {
        console.error('Fehler beim Laden des Service-Types:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (id) {
      fetchServiceType()
    }
  }, [id])
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // Routing basierend auf Service-Type
  if (serviceType === 'PARTICIPATION_MONEY') {
    return <ServiceDetailParticipationMoney />
  }
  
  // Fallback für alle anderen Service-Types (Freitextanträge, etc.)
  return <ServiceDetail />
}

// Komponente für Dashboard-Weiterleitung basierend auf Benutzerrolle
const DashboardRedirect = () => {
  const { user } = useAuth()
  
  // Prüfe Gruppen-Mitgliedschaften
  const userGroups = user?.groups?.map(g => g.name) || []
  console.log('User groups:', userGroups) // DEBUG: Gruppen anzeigen
  
  const isInmate = userGroups.some(group => group === 'PS Inmates')
  const isAdmin = userGroups.some(group => group === 'PS Designers')
  const isStaff = userGroups.some(group => 
    group.includes('PS General Enforcement Service') || 
    group.includes('PS Vollzugsabteilungsleitung') ||
    group.includes('PS Vollzugsleitung') ||
    group.includes('PS Anstaltsleitung') ||
    group.includes('PS Payments Office') ||
    group.includes('PS Medical Staff')
  )
  
  console.log('Role detection:', { isInmate, isAdmin, isStaff }) // DEBUG: Rollen-Erkennung
  
  if (isInmate) {
    return <Navigate to="/my-services" replace />
  } else if (isAdmin) {
    return <Navigate to="/admin-dashboard" replace />
  } else if (isStaff) {
    return <Navigate to="/staff-dashboard" replace />
  } else {
    // Fallback: Wenn keine spezifische Rolle erkannt wird, zum Staff-Dashboard
    console.log('No specific role detected, redirecting to staff-dashboard')
    return <Navigate to="/staff-dashboard" replace />
  }
}

// Komponente für Routen, die nur für Staff/Admin zugänglich sind
const StaffOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth()
  
  const userGroups = user?.groups?.map(g => g.name) || []
  const isInmate = userGroups.some(group => group === 'PS Inmates')
  const isAdmin = userGroups.some(group => group === 'PS Designers')
  const isStaff = userGroups.some(group => 
    group.includes('PS General Enforcement Service') || 
    group.includes('PS Vollzugsabteilungsleitung') ||
    group.includes('PS Vollzugsleitung') ||
    group.includes('PS Anstaltsleitung') ||
    group.includes('PS Payments Office') ||
    group.includes('PS Medical Staff')
  )
  
  // Wenn Insasse, zur Insassen-Seite weiterleiten
  if (isInmate) {
    return <Navigate to="/my-services" replace />
  }
  
  // Wenn Staff oder Admin, Zugriff erlauben
  if (isStaff || isAdmin) {
    return <>{children}</>
  }
  
  // Fallback: Zur Login-Seite weiterleiten
  return <Navigate to="/login" replace />
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Wenn nicht authentifiziert, zeige nur Login-Seite
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  // Wenn authentifiziert, zeige normalen Layout mit Navbar und Footer
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* Protected Routes */}
          <Route path="/login" element={
            <Navigate to="/dashboard" replace />
          } />
          <Route path="/" element={
            <Navigate to="/dashboard" replace />
          } />
          <Route path="/dashboard" element={
            <DashboardRedirect />
          } />

          <Route path="/services/:id" element={
            <ServiceDetailRouter />
          } />
          <Route path="/my-services" element={
            <MyServices />
          } />
          <Route path="/all-my-services" element={
            <AllMyServices />
          } />
          <Route path="/new-service" element={
            <NewService />
          } />
          <Route path="/staff-dashboard" element={
            <StaffOnlyRoute><StaffDashboard /></StaffOnlyRoute>
          } />
          <Route path="/admin-dashboard" element={
            <StaffOnlyRoute><AdminDashboard /></StaffOnlyRoute>
          } />
          <Route path="/admin-logs" element={
            <StaffOnlyRoute><AdminLogs /></StaffOnlyRoute>
          } />
          <Route path="/house-management" element={
            <StaffOnlyRoute><HouseManagement /></StaffOnlyRoute>
          } />
          <Route path="/inmates-overview" element={
            <StaffOnlyRoute><InmatesOverview /></StaffOnlyRoute>
          } />
          <Route path="/user-overview" element={
            <StaffOnlyRoute><UserOverview /></StaffOnlyRoute>
          } />
          <Route path="/profile" element={
            <Profile />
          } />
          <Route path="/legal" element={
            <Legal />
          } />
        </Routes>
      </main>
      
      {/* Footer mit Copyright */}
      <footer className="bg-gray-100 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2025 Dr. Alexander Hayward - Prisoner Services System. Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AIModeProvider>
          <Router>
            <AppContent />
          </Router>
        </AIModeProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}

export default App
