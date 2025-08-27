import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import { useAuth } from './contexts/AuthContext'

import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import MyServices from './pages/MyServices'
import NewService from './pages/NewService'
import StaffDashboard from './pages/StaffDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminLogs from './pages/AdminLogs'
import HouseManagement from './pages/HouseManagement'
import InmatesOverview from './pages/InmatesOverview'
import UserOverview from './pages/UserOverview'
import { AuthProvider } from './contexts/AuthContext'
import './App.css'

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

function AppContent() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <>
      {isAuthenticated && <Navbar />}
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
          } />
          {/* Protected Routes */}
          <Route path="/" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          } />
          <Route path="/dashboard" element={
            isAuthenticated ? <DashboardRedirect /> : <Navigate to="/login" replace />
          } />
          <Route path="/services" element={
            isAuthenticated ? <Services /> : <Navigate to="/login" replace />
          } />
          <Route path="/services/:id" element={
            isAuthenticated ? <ServiceDetail /> : <Navigate to="/login" replace />
          } />
          <Route path="/my-services" element={
            isAuthenticated ? <MyServices /> : <Navigate to="/login" replace />
          } />
          <Route path="/new-service" element={
            isAuthenticated ? <NewService /> : <Navigate to="/login" replace />
          } />
          <Route path="/staff-dashboard" element={
            isAuthenticated ? <StaffDashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/admin-dashboard" element={
            isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" replace />
          } />
          <Route path="/admin-logs" element={
            isAuthenticated ? <AdminLogs /> : <Navigate to="/login" replace />
          } />
          <Route path="/house-management" element={
            isAuthenticated ? <HouseManagement /> : <Navigate to="/login" replace />
          } />
          <Route path="/inmates-overview" element={
            isAuthenticated ? <InmatesOverview /> : <Navigate to="/login" replace />
          } />
          <Route path="/user-overview" element={
            isAuthenticated ? <UserOverview /> : <Navigate to="/login" replace />
          } />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
