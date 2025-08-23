import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import api from '../services/api'
import { 
  Users, 
  Shield, 
  UserPlus, 
  UserMinus,
  CheckCircle,
  XCircle,
  X,
  FileText,
  ChevronDown,
  Search,
  Download,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  EyeOff
} from 'lucide-react'

interface Group {
  id: number
  name: string
  description: string
  category: string
  permissions: string[]
  isActive: boolean
  users: Array<{
    id: number
    username: string
    firstName: string
    lastName: string
    role: string
  }>
}

interface User {
  id: number
  username: string
  firstName: string
  lastName: string
  email: string
  isActive: boolean
  groups?: Array<{
    group: {
      id: number
      name: string
      description: string
      category: string
      permissions: string
      isActive: boolean
    }
  }>
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [userToRemove, setUserToRemove] = useState<{ groupId: number, userId: number, userName: string, groupName: string } | null>(null)
  const [activeUserTab, setActiveUserTab] = useState<'inmates' | 'allUsers' | 'admins'>('inmates')
  const [showEditUserModal, setShowEditUserModal] = useState(false)
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false)
  const [userToEdit, setUserToEdit] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [userToChangePassword, setUserToChangePassword] = useState<User | null>(null)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  
  // Benutzer-Suche State
  const [userSearch, setUserSearch] = useState('')
  const [userStatusFilter, setUserStatusFilter] = useState('')
  
  // Mitglieder-Tabelle State
  const [memberSearch, setMemberSearch] = useState('')
  const [memberFilters, setMemberFilters] = useState({
    role: '',
    status: ''
  })
  const [memberSort, setMemberSort] = useState({
    field: 'firstName',
    direction: 'asc'
  })
  const [memberPagination, setMemberPagination] = useState({
    page: 1,
    pageSize: 25
  })
  const [memberData, setMemberData] = useState({
    members: [],
    total: 0,
    loading: false
  })

  // Admin-Berechtigung prüfen
  const userGroups = user?.groups?.map(g => g.name) || []
  const isAdmin = userGroups.some(group => group === 'PS Designers')

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchGroups(),
        fetchUsers(),
        fetchServices()
      ])
    }
    loadData()
  }, [])

  const fetchGroups = async () => {
    try {
      const response = await api.get('/groups')
      console.log('Backend Groups Response:', response.data)
      setGroups(response.data.groups || [])
    } catch (error) {
      console.error('Fehler beim Laden der Gruppen:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users')
      console.log('Users API Response:', response.data)
      setUsers(response.data.users || [])
      console.log('Users Array gesetzt:', response.data.users || [])
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
    }
  }



  const fetchServices = async () => {
    try {
      const response = await api.get('/services')
      setServices(response.data.services || [])
    } catch (error) {
      console.error('Fehler beim Laden der Anträge:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUserToGroup = async (groupId: number, userId: number) => {
    try {
      await api.post(`/groups/${groupId}/users`, { userId, role: 'MEMBER' })
      const group = groups.find(g => g.id === groupId)
      const user = users.find(u => u.id === userId)
      
      if (group && user) {
        setMessage({ type: 'success', text: `${user.firstName} ${user.lastName} wurde erfolgreich zur Gruppe "${group.name}" hinzugefügt!` })
        // Nach 3 Sekunden die Nachricht ausblenden
        setTimeout(() => setMessage(null), 3000)
      }
      
      // Gruppen neu laden und selectedGroup aktualisieren
      const response = await api.get('/groups')
      const updatedGroups = response.data.groups || []
      setGroups(updatedGroups)
      
      // selectedGroup mit den aktualisierten Daten aktualisieren
      const updatedSelectedGroup = updatedGroups.find((g: any) => g.id === groupId)
      if (updatedSelectedGroup) {
        setSelectedGroup(updatedSelectedGroup)
      }
      
      setShowAddUserModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Benutzers:', error)
      setMessage({ type: 'error', text: 'Fehler beim Hinzufügen des Benutzers zur Gruppe!' })
      // Nach 5 Sekunden die Fehlermeldung ausblenden
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleRemoveUserFromGroup = async (groupId: number, userId: number) => {
    const group = groups.find(g => g.id === groupId)
    const user = group?.users.find(u => u.id === userId)
    
    if (!group || !user) return
    
    // In-app Modal anzeigen statt Browser-Dialog
    setUserToRemove({
      groupId,
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      groupName: group.name
    })
    setShowRemoveConfirm(true)
  }

  const confirmRemoveUserFromGroup = async () => {
    if (!userToRemove) return
    
    try {
      await api.delete(`/groups/${userToRemove.groupId}/users/${userToRemove.userId}`)
      setMessage({ type: 'success', text: `${userToRemove.userName} wurde erfolgreich aus der Gruppe "${userToRemove.groupName}" entfernt!` })
      
      // Gruppen neu laden und selectedGroup aktualisieren
      const response = await api.get('/groups')
      const updatedGroups = response.data.groups || []
      setGroups(updatedGroups)
      
      // selectedGroup mit den aktualisierten Daten aktualisieren
      const updatedSelectedGroup = updatedGroups.find((g: any) => g.id === userToRemove.groupId)
      if (updatedSelectedGroup) {
        setSelectedGroup(updatedSelectedGroup)
      }
      
      // Nach 3 Sekunden die Nachricht ausblenden
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Fehler beim Entfernen des Benutzers:', error)
      setMessage({ type: 'error', text: 'Fehler beim Entfernen des Benutzers aus der Gruppe!' })
      // Nach 5 Sekunden die Fehlermeldung ausblenden
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setShowRemoveConfirm(false)
      setUserToRemove(null)
    }
  }

  const handleDeleteAllServices = async () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteAllServices = async () => {
    try {
      await api.delete('/services/all')
      setMessage({ type: 'success', text: 'Alle Anträge wurden erfolgreich gelöscht!' })
      fetchServices() // Aktualisiere die Anzeige
      // Nach 3 Sekunden die Nachricht ausblenden
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Fehler beim Löschen aller Anträge:', error)
      setMessage({ type: 'error', text: 'Fehler beim Löschen der Anträge!' })
      // Nach 5 Sekunden die Fehlermeldung ausblenden
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setShowDeleteConfirm(false)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'INMATE': return 'bg-red-100 text-red-800'
      case 'STAFF': return 'bg-blue-100 text-blue-800'
      case 'ADMIN': return 'bg-purple-100 text-purple-800'
      case 'SYSTEM': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUserGroups = (userId: number) => {
    // Verwende die Gruppen-Informationen aus der groups-API
    return groups.filter(group => 
      group.users.some(groupUser => groupUser.id === userId)
    )
  }



  // Hilfsfunktion: Sammelt alle Benutzer aus Inmate-Gruppen und dedupliziert sie
  const getInmateUsers = () => {
    const inmateUserIds = new Set<number>()
    const inmateUsersList: User[] = []
    
    // Alle Inmate-Gruppen durchgehen
    groups.forEach(group => {
      if (group.category === 'INMATE') {
        // Alle Benutzer dieser Inmate-Gruppe sammeln
        group.users.forEach(groupUser => {
          if (!inmateUserIds.has(groupUser.id)) {
            inmateUserIds.add(groupUser.id)
            // Vollständige Benutzer-Informationen aus der users-Liste holen
            const fullUser = users.find(u => u.id === groupUser.id)
            if (fullUser) {
              inmateUsersList.push(fullUser)
            }
          }
        })
      }
    })
    
    return inmateUsersList
  }

  // Benutzer basierend auf Tab und Suche filtern
  const getFilteredUsers = () => {
    let baseUsers: User[] = []
    
    if (activeUserTab === 'inmates') {
      baseUsers = getInmateUsers()
    } else if (activeUserTab === 'allUsers') {
      baseUsers = users.filter(user => 
        !getUserGroups(user.id).some(group => group.category === 'INMATE')
      )
    } else if (activeUserTab === 'admins') {
      baseUsers = users.filter(user => 
        getUserGroups(user.id).some(group => group.name === 'PS Designers')
      )
    }
    
    // Suche anwenden
    if (userSearch.trim()) {
      const searchTerm = userSearch.toLowerCase()
      baseUsers = baseUsers.filter(user => 
        user.firstName.toLowerCase().includes(searchTerm) ||
        user.lastName.toLowerCase().includes(searchTerm) ||
        user.username.toLowerCase().includes(searchTerm)
      )
    }
    
    // Status-Filter anwenden
    if (userStatusFilter) {
      baseUsers = baseUsers.filter(user => {
        if (userStatusFilter === 'active') {
          return user.isActive
        } else if (userStatusFilter === 'inactive') {
          return !user.isActive
        }
        return true
      })
    }
    
    return baseUsers
  }
  
  const filteredUsers = getFilteredUsers()
  
  // CSV Export Funktion
  const exportUsersToCSV = () => {
    if (filteredUsers.length === 0) {
      setMessage({ type: 'error', text: 'Keine Benutzer zum Exportieren vorhanden!' })
      setTimeout(() => setMessage(null), 3000)
      return
    }
    
    // CSV Header
    const headers = ['Name', 'Benutzername', 'E-Mail', 'Status', 'Gruppen', 'Erstellt am']
    
    // CSV Daten
    const csvData = filteredUsers.map(user => [
      `${user.firstName} ${user.lastName}`,
      user.username,
      user.email,
      user.isActive ? 'Aktiv' : 'Inaktiv',
      getUserGroups(user.id).map((group: any) => group.description).join('; '),
      new Date().toLocaleDateString('de-DE')
    ])
    
    // CSV String erstellen
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    // Datei herunterladen
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `benutzer_${activeUserTab}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setMessage({ type: 'success', text: `${filteredUsers.length} Benutzer erfolgreich exportiert!` })
    setTimeout(() => setMessage(null), 3000)
  }





  const handleEditUser = (user: User) => {
    console.log('handleEditUser aufgerufen mit:', user)
    setUserToEdit(user)
    setUserToChangePassword(user) // Für Passwort-Änderung im Modal
    setPasswordData({ newPassword: '', confirmPassword: '' }) // Passwort-Felder zurücksetzen
    setShowEditUserModal(true)
    console.log('Modal sollte jetzt geöffnet sein')
  }

  const handleSaveUser = async () => {
    if (!userToEdit) return
    
    // Frontend-Validierung
    if (!userToEdit.firstName.trim() || !userToEdit.lastName.trim() || !userToEdit.username.trim() || !userToEdit.email.trim()) {
      setMessage({ type: 'error', text: 'Alle Felder müssen ausgefüllt werden!' })
      setTimeout(() => setMessage(null), 5000)
      return
    }
    
    // E-Mail-Validierung
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(userToEdit.email)) {
      setMessage({ type: 'error', text: 'Bitte geben Sie eine gültige E-Mail-Adresse ein!' })
      setTimeout(() => setMessage(null), 5000)
      return
    }
    
    try {
             await api.put(`/users/${userToEdit.id}`, {
         firstName: userToEdit.firstName,
         lastName: userToEdit.lastName,
         username: userToEdit.username,
         email: userToEdit.email,
         isActive: userToEdit.isActive
       })
      
      setMessage({ type: 'success', text: `${userToEdit.firstName} ${userToEdit.lastName} wurde erfolgreich bearbeitet!` })
      
      // Benutzerliste neu laden
      fetchUsers()
      
      // Modal schließen
      setShowEditUserModal(false)
      setUserToEdit(null)
      
      // Nachricht nach 3 Sekunden ausblenden
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Fehler beim Bearbeiten des Benutzers:', error)
      const errorMessage = error.response?.data?.error || 'Fehler beim Bearbeiten des Benutzers!'
      setMessage({ type: 'error', text: errorMessage })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setShowDeleteUserConfirm(true)
  }



  const handleSavePassword = async () => {
    if (!userToChangePassword) return
    
    // Frontend-Validierung
    if (!passwordData.newPassword.trim() || !passwordData.confirmPassword.trim()) {
      setMessage({ type: 'error', text: 'Alle Felder müssen ausgefüllt werden!' })
      return
    }
    
    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Das Passwort muss mindestens 6 Zeichen lang sein!' })
      return
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'Die Passwörter stimmen nicht überein!' })
      return
    }
    
         try {
       await api.put(`/users/${userToChangePassword.id}/password`, {
         newPassword: passwordData.newPassword,
         confirmPassword: passwordData.confirmPassword
       })
      
      setMessage({ type: 'success', text: `Passwort für ${userToChangePassword.firstName} ${userToChangePassword.lastName} wurde erfolgreich geändert!` })
      
             // Modal schließen
       setUserToChangePassword(null)
      setPasswordData({ newPassword: '', confirmPassword: '' })
      
      // Nachricht nach 3 Sekunden ausblenden
      setTimeout(() => setMessage(null), 3000)
    } catch (error: any) {
      console.error('Fehler beim Ändern des Passworts:', error)
      const errorMessage = error.response?.data?.error || 'Fehler beim Ändern des Passworts!'
      setMessage({ type: 'error', text: errorMessage })
    }
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return
    
    try {
      await api.delete(`/users/${userToDelete.id}`)
      setMessage({ type: 'success', text: `${userToDelete.firstName} ${userToDelete.lastName} wurde erfolgreich gelöscht!` })
      fetchUsers() // Aktualisiere die Benutzerliste
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Fehler beim Löschen des Benutzers:', error)
      setMessage({ type: 'error', text: 'Fehler beim Löschen des Benutzers!' })
      setTimeout(() => setMessage(null), 5000)
    } finally {
      setShowDeleteUserConfirm(false)
      setUserToDelete(null)
    }
  }

  // Mitglieder-Tabelle Funktionen
  const fetchGroupMembers = async (groupId: number) => {
    if (!selectedGroup) return
    
    setMemberData(prev => ({ ...prev, loading: true }))
    
    try {
      const params = new URLSearchParams({
        page: memberPagination.page.toString(),
        pageSize: memberPagination.pageSize.toString(),
        search: memberSearch,
        sortField: memberSort.field,
        sortDirection: memberSort.direction,
        ...(memberFilters.role && { role: memberFilters.role }),
        ...(memberFilters.status && { status: memberFilters.status })
      })
      
      const response = await api.get(`/groups/${groupId}/members?${params}`)
      setMemberData({
        members: response.data.members || [],
        total: response.data.total || 0,
        loading: false
      })
    } catch (error) {
      console.error('Fehler beim Laden der Gruppenmitglieder:', error)
      setMemberData(prev => ({ ...prev, loading: false }))
    }
  }

  const handleMemberSearch = (searchTerm: string) => {
    setMemberSearch(searchTerm)
    setMemberPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleMemberFilter = (filterType: string, value: string) => {
    setMemberFilters(prev => ({ ...prev, [filterType]: value }))
    setMemberPagination({ page: 1, pageSize: memberPagination.pageSize })
  }

  const handleMemberSort = (field: string) => {
    setMemberSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleMemberPageChange = (page: number) => {
    setMemberPagination(prev => ({ ...prev, page }))
  }

     const handleMemberPageSizeChange = (pageSize: number) => {
     setMemberPagination({ page: 1, pageSize })
   }

  // Mitglieder-Tabelle neu laden wenn sich Parameter ändern
  useEffect(() => {
    if (selectedGroup) {
      fetchGroupMembers(selectedGroup.id)
    }
  }, [selectedGroup, memberSearch, memberFilters, memberSort, memberPagination])

  // State zurücksetzen wenn sich die ausgewählte Gruppe ändert
  useEffect(() => {
    if (selectedGroup) {
      setMemberSearch('')
      setMemberFilters({ role: '', status: '' })
      setMemberSort({ field: 'firstName', direction: 'asc' })
      setMemberPagination({ page: 1, pageSize: 25 })
    }
  }, [selectedGroup?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Admin-Dashboard...</p>
        </div>
      </div>
    )
  }

  // CSS für Animation und Accessibility
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="w-8 h-8 mr-3 text-purple-600" />
            Admin-Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Verwaltung von Gruppen und Berechtigungen
          </p>
        </div>

        {/* In-App Nachrichten */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 mr-2" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
              <button
                onClick={() => setMessage(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

                 {/* System-KPIs */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                       {/* Übersicht der Anträge */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Übersicht der Anträge</h3>
                    <p className="text-sm text-gray-600">Aktuelle Statistiken zu allen Anträgen</p>
                  </div>
                </div>
                <button
                  onClick={handleDeleteAllServices}
                  className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:border-red-300 transition-colors"
                >
                  Anträge löschen
                </button>
              </div>
             <div className="grid grid-cols-4 gap-4">
               <div className="text-center">
                 <p className="text-2xl font-bold text-blue-600">{services.length}</p>
                 <p className="text-sm text-gray-600">Gesamt</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-yellow-600">
                   {services.filter(service => service.status === 'PENDING').length}
                 </p>
                 <p className="text-sm text-gray-600">Offen</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-orange-600">
                   {services.filter(service => service.status === 'IN_PROGRESS').length}
                 </p>
                 <p className="text-sm text-gray-600">In Bearbeitung</p>
               </div>
               <div className="text-center">
                 <p className="text-2xl font-bold text-green-600">
                   {services.filter(service => service.status === 'COMPLETED' || service.status === 'REJECTED').length}
                 </p>
                 <p className="text-sm text-gray-600">Abgeschlossen</p>
               </div>
             </div>
           </div>
           
           {/* Benutzer und Gruppen */}
           <div className="bg-white rounded-lg shadow p-6">
             <div className="flex items-center mb-4">
               <Users className="w-8 h-8 text-purple-600" />
                               <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Benutzer und Gruppen</h3>
                  <p className="text-sm text-gray-600">Übersicht der Benutzer und Gruppen im System</p>
                </div>
             </div>
                           <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{users.length}</p>
                  <p className="text-sm text-gray-600">Registrierte Benutzer</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600">{groups.length}</p>
                  <p className="text-sm text-gray-600">Gruppen</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">
                    {(() => {
                      const inmateCount = users.filter(user => 
                        groups.some(group => 
                          group.name === 'PS Inmates' && 
                          group.users.some(groupUser => groupUser.id === user.id)
                        )
                      ).length;
                      
                      // Debug-Logs
                      console.log('Debug Insassen-Kennzahl:');
                      console.log('Users:', users);
                      console.log('Groups:', groups);
                      console.log('PS Inmates group:', groups.find(g => g.name === 'PS Inmates'));
                      console.log('Inmate count:', inmateCount);
                      
                      return inmateCount;
                    })()}
                  </p>
                  <p className="text-sm text-gray-600">Insassen</p>
                </div>
              </div>
           </div>
         </div>





                 {/* Gruppen-Liste */}
         <div className="bg-white rounded-lg shadow">
           <div className="px-6 py-4 border-b border-gray-200">
             <h2 className="text-xl font-semibold text-gray-900">Gruppenverwaltung</h2>
             <p className="text-sm text-gray-600 mt-1">Verwalten Sie Gruppen und deren Mitglieder</p>
           </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gruppe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategorie
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mitglieder
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {groups
                  .sort((a, b) => {
                    // Sortierung nach Kategorie: ADMIN, STAFF, INMATE, SYSTEM
                    const categoryOrder = { 'ADMIN': 0, 'STAFF': 1, 'INMATE': 2, 'SYSTEM': 3 }
                    const orderA = categoryOrder[a.category as keyof typeof categoryOrder] ?? 4
                    const orderB = categoryOrder[b.category as keyof typeof categoryOrder] ?? 4
                    
                    if (orderA !== orderB) {
                      return orderA - orderB
                    }
                    
                    // Bei gleicher Kategorie alphabetisch nach Beschreibung sortieren
                    return a.description.localeCompare(b.description)
                  })
                  .map((group) => (
                    <React.Fragment key={group.id}>
                      <tr className="hover:bg-gray-50" id={`group-row-${group.id}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                                                         <button
                               onClick={() => (group.category !== 'SYSTEM' || group.name === 'PS All Users') && setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                               className="flex items-center text-left w-full"
                               aria-expanded={selectedGroup?.id === group.id}
                               aria-controls={`group-details-${group.id}`}
                               disabled={group.category === 'SYSTEM' && group.name !== 'PS All Users'}
                             >
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{group.description}</div>
                                <div className="text-sm text-gray-500">Technisch: {group.name}</div>
                              </div>
                                                             {(group.category !== 'SYSTEM' || group.name === 'PS All Users') && (
                                 <ChevronDown 
                                   className={`w-4 h-4 ml-2 text-gray-400 transition-transform duration-200 ${
                                     selectedGroup?.id === group.id ? 'rotate-180' : ''
                                   }`}
                                   aria-hidden="true"
                                 />
                               )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(group.category)}`}>
                            {group.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{group.users.length} Mitglieder</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {group.isActive ? (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Aktiv
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Inaktiv
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {group.category === 'SYSTEM' ? (
                            <div className="flex items-center text-gray-400">
                              <Shield className="w-4 h-4 mr-1" />
                              <span className="text-xs">System-Gruppe</span>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation() // Verhindert das Ausklappen beim Klick auf den Button
                                  setSelectedGroup(group)
                                  setShowAddUserModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Hinzufügen
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      
                                             {/* Detailzeile mit kartenartiger Mitgliederliste */}
                       {selectedGroup?.id === group.id && (group.category !== 'SYSTEM' || group.name === 'PS All Users') && (
                        <tr>
                          <td colSpan={5} className="px-0 py-0">
                                                         <div 
                               id={`group-details-${group.id}`}
                               className="bg-gray-50 border-t border-gray-200 overflow-hidden"
                               style={{
                                 maxHeight: '800px',
                                 opacity: 1,
                                 transform: 'translateY(0)',
                                 transition: prefersReducedMotion ? 'none' : 'all 300ms ease-in-out'
                               }}
                               aria-labelledby={`group-row-${group.id}`}
                             >
                                                                                                                           <div className="px-6 py-4">

                                 {/* Toolbar */}
                                 <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                                   {/* Suchfeld */}
                                   <div className="flex-1">
                                     <div className="relative">
                                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                       <input
                                         type="text"
                                         placeholder="Nach Name oder Benutzername suchen..."
                                         value={memberSearch}
                                         onChange={(e) => handleMemberSearch(e.target.value)}
                                         className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                       />
                                     </div>
                                   </div>

                                   {/* Filter */}
                                   <div className="flex gap-2">
                                     
                                     <select
                                       value={memberFilters.status}
                                       onChange={(e) => handleMemberFilter('status', e.target.value)}
                                       className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                     >
                                       <option value="">Alle Status</option>
                                       <option value="active">Aktiv</option>
                                       <option value="inactive">Inaktiv</option>
                                     </select>
                                   </div>

                                   {/* Page Size */}
                                   <div className="flex items-center gap-2">
                                     <span className="text-sm text-gray-600">Anzeige:</span>
                                     <select
                                       value={memberPagination.pageSize}
                                       onChange={(e) => handleMemberPageSizeChange(Number(e.target.value))}
                                       className="px-2 py-1 border border-gray-300 rounded text-sm"
                                     >
                                       <option value={25}>25</option>
                                       <option value={50}>50</option>
                                       <option value={100}>100</option>
                                     </select>
                                   </div>

                                   
                                 </div>

                                                                   {/* Mitglieder-Tabelle */}
                                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-96">
                                    <div className="overflow-x-auto overflow-y-auto max-h-80">
                                     <table className="min-w-full table-fixed">
                                                                               <thead className="bg-gray-50 sticky top-0">
                                          <tr>
                                            <th 
                                              className={`w-1/4 px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                                                memberSort.field === 'firstName' 
                                                  ? 'font-medium text-gray-900' 
                                                  : 'font-medium text-gray-500'
                                              }`}
                                              onClick={() => handleMemberSort('firstName')}
                                              aria-sort={
                                                memberSort.field === 'firstName' 
                                                  ? (memberSort.direction === 'asc' ? 'ascending' : 'descending')
                                                  : 'none'
                                              }
                                            >
                                              <div className="flex items-center gap-1">
                                                Name
                                                {memberSort.field === 'firstName' && (
                                                  memberSort.direction === 'asc' ? 
                                                    <ChevronUp className="w-3 h-3" /> : 
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                              </div>
                                            </th>
                                            <th 
                                              className={`w-1/4 px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                                                memberSort.field === 'username' 
                                                  ? 'font-medium text-gray-900' 
                                                  : 'font-medium text-gray-500'
                                              }`}
                                              onClick={() => handleMemberSort('username')}
                                              aria-sort={
                                                memberSort.field === 'username' 
                                                  ? (memberSort.direction === 'asc' ? 'ascending' : 'descending')
                                                  : 'none'
                                              }
                                            >
                                              <div className="flex items-center gap-1">
                                                Benutzername
                                                {memberSort.field === 'username' && (
                                                  memberSort.direction === 'asc' ? 
                                                    <ChevronUp className="w-3 h-3" /> : 
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                              </div>
                                            </th>
                                            
                                            <th 
                                              className={`w-1/6 px-4 py-3 text-left text-xs uppercase tracking-wider cursor-pointer hover:bg-gray-100 ${
                                                memberSort.field === 'status' 
                                                  ? 'font-medium text-gray-900' 
                                                  : 'font-medium text-gray-500'
                                              }`}
                                              onClick={() => handleMemberSort('status')}
                                              aria-sort={
                                                memberSort.field === 'status' 
                                                  ? (memberSort.direction === 'asc' ? 'ascending' : 'descending')
                                                  : 'none'
                                              }
                                            >
                                              <div className="flex items-center gap-1">
                                                Status
                                                {memberSort.field === 'status' && (
                                                  memberSort.direction === 'asc' ? 
                                                    <ChevronUp className="w-3 h-3" /> : 
                                                    <ChevronDown className="w-3 h-3" />
                                                )}
                                              </div>
                                            </th>
                                            <th className="w-1/6 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                              Aktionen
                                            </th>
                                          </tr>
                                        </thead>
                                       <tbody className="bg-white divide-y divide-gray-200">
                                         {memberData.loading ? (
                                                                                       <tr>
                                              <td colSpan={4} className="px-4 py-8 text-center">
                                               <div className="flex items-center justify-center">
                                                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                                 <span className="ml-2 text-sm text-gray-600">Lade Mitglieder...</span>
                                               </div>
                                             </td>
                                           </tr>
                                         ) : memberData.members.length > 0 ? (
                                           memberData.members.map((user: any) => (
                                             <tr key={user.id} className="hover:bg-gray-50">
                                               <td className="px-4 py-3 text-sm text-gray-900">
                                                 {user.firstName} {user.lastName}
                                               </td>
                                               <td className="px-4 py-3 text-sm text-gray-900">
                                                 {user.username}
                                               </td>
                                               
                                               <td className="px-4 py-3 text-sm">
                                                 <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                                   user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                 }`}>
                                                   {user.status === 'active' ? (
                                                     <>
                                                       <CheckCircle className="w-3 h-3 mr-1" />
                                                       Aktiv
                                                     </>
                                                   ) : (
                                                     <>
                                                       <XCircle className="w-3 h-3 mr-1" />
                                                       Inaktiv
                                                     </>
                                                   )}
                                                 </span>
                                               </td>
                                               <td className="px-4 py-3 text-sm">
                                                 {group.name !== 'PS All Users' && (
                                                   <button
                                                     onClick={() => handleRemoveUserFromGroup(group.id, user.id)}
                                                     className="text-red-600 hover:text-red-900 p-1 rounded transition-colors duration-200"
                                                     aria-label={`${user.firstName} ${user.lastName} aus Gruppe entfernen`}
                                                   >
                                                     <UserMinus className="w-4 h-4" />
                                                   </button>
                                                 )}
                                               </td>
                                             </tr>
                                           ))
                                         ) : (
                                                                                       <tr>
                                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                               <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                               <p className="text-sm font-medium">Keine Mitglieder gefunden</p>
                                               <p className="text-xs">Passen Sie Ihre Suchkriterien an</p>
                                             </td>
                                           </tr>
                                         )}
                                       </tbody>
                                     </table>
                                   </div>

                                                                       {/* Pagination */}
                                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                      <div className="flex items-center justify-between">
                                        <div className="text-sm text-gray-700">
                                          {(() => {
                                            const from = memberData.total === 0 ? 0 : (memberPagination.page - 1) * memberPagination.pageSize + 1;
                                            const to = Math.min(memberPagination.page * memberPagination.pageSize, memberData.total);
                                            const totalFmt = new Intl.NumberFormat('de-DE').format(memberData.total);
                                            
                                            return memberData.total === 0 
                                              ? '0 von 0'
                                              : `${from}–${to} von ${totalFmt}`;
                                          })()}
                                        </div>
                                         <div className="flex items-center gap-2">
                                           <button
                                             onClick={() => handleMemberPageChange(memberPagination.page - 1)}
                                             disabled={memberPagination.page <= 1}
                                             className="px-2 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                           >
                                             <ChevronLeft className="w-4 h-4" />
                                           </button>
                                           <span className="text-sm text-gray-700">
                                             Seite {memberPagination.page} von {Math.ceil(memberData.total / memberPagination.pageSize)}
                                           </span>
                                           <button
                                             onClick={() => handleMemberPageChange(memberPagination.page + 1)}
                                             disabled={memberPagination.page >= Math.ceil(memberData.total / memberPagination.pageSize)}
                                             className="px-2 py-1 text-sm text-gray-500 bg-white border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                           >
                                             <ChevronRight className="w-4 h-4" />
                                           </button>
                                         </div>
                                       </div>
                                     </div>
                                 </div>
                               </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Benutzerverwaltung */}
        <div className="bg-white rounded-lg shadow mt-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Benutzerverwaltung</h2>
            <p className="text-sm text-gray-600 mt-1">Verwalten Sie Insassen und Verwaltungsbenutzer</p>
          </div>
          
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
                             <button
                 onClick={() => {
                   setActiveUserTab('inmates')
                   setUserSearch('')
                   setUserStatusFilter('')
                 }}
                 className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                   activeUserTab === 'inmates'
                     ? 'border-blue-500 text-blue-600'
                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                 }`}
               >
                <Users className="w-4 h-4 mr-2" />
                Insassen
              </button>
              
                                                                  <button
                                       onClick={() => {
                     setActiveUserTab('allUsers')
                     setUserSearch('')
                     setUserStatusFilter('')
                   }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeUserTab === 'allUsers'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                   <Shield className="w-4 h-4 mr-2" />
                   Verwaltungsbenutzer
                 </button>
                                   <button
                                       onClick={() => {
                     setActiveUserTab('admins')
                     setUserSearch('')
                     setUserStatusFilter('')
                   }}
                    className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                      activeUserTab === 'admins'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                   <Crown className="w-4 h-4 mr-2" />
                   Admins
                 </button>
            </nav>
          </div>

                     {/* Tab Content */}
           <div className="px-6 py-4">
             {/* Suchleiste */}
             <div className="flex flex-col sm:flex-row gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
               <div className="flex-1">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                   <input
                     type="text"
                     placeholder="Nach Name oder Benutzername suchen..."
                     value={userSearch}
                     onChange={(e) => setUserSearch(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                   />
                 </div>
               </div>
               
               {/* Status-Filter */}
               <div className="flex gap-2">
                 <select
                   value={userStatusFilter}
                   onChange={(e) => setUserStatusFilter(e.target.value)}
                   className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                 >
                   <option value="">Alle Status</option>
                   <option value="active">Aktiv</option>
                   <option value="inactive">Inaktiv</option>
                 </select>
                 
                 {/* Export */}
                 <button
                   onClick={() => exportUsersToCSV()}
                   className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                 >
                   <Download className="w-4 h-4" />
                   Export
                 </button>
               </div>
             </div>
             
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold text-gray-900">
                 {activeUserTab === 'inmates' ? 'Insassen verwalten' : 
                  activeUserTab === 'allUsers' ? 'Verwaltungsbenutzer verwalten' :
                  'Admins verwalten'}
               </h3>
               <p className="text-sm text-gray-600">
                 {activeUserTab === 'inmates' ? 'Verwalten Sie die Benutzerkonten der Insassen' :
                  activeUserTab === 'allUsers' ? 'Alle Benutzer außer Insassen verwalten' :
                  'Admin-Benutzer mit vollen Systemrechten verwalten'}
               </p>
             </div>

                                                                             {/* Benutzer-Tabelle */}
                                                         {activeUserTab === 'allUsers' || activeUserTab === 'admins' ? (
                                                                    // Alle Benutzer außer Insassen oder Admins
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[768px]">
                    <div className="overflow-x-auto overflow-y-auto max-h-[640px]">
                      <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            NAME
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            BENUTZERNAME
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            STATUS
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            GRUPPEN
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            ERSTELLT AM
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            AKTIONEN
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.username}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {user.isActive ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Aktiv
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Inaktiv
                                    </>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {getUserGroups(user.id).map((group: any) => group.description).join(', ')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {new Date().toLocaleDateString('de-DE')}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  Bearbeiten
                                </button>
                                {activeUserTab !== 'admins' && (
                                  <button
                                    onClick={() => handleDeleteUser(user)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    Löschen
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>
                  </div>
                                                        ) : (
                // Benutzer-Tabelle für Insassen
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-[768px]">
                  <div className="overflow-x-auto overflow-y-auto max-h-[640px]">
                    <table className="min-w-full divide-y divide-gray-200">
                   <thead className="bg-gray-50">
                     <tr>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         NAME
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         BENUTZERNAME
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         STATUS
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         GRUPPEN
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         ERSTELLT AM
                       </th>
                       <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         AKTIONEN
                       </th>
                     </tr>
                   </thead>
                   <tbody className="bg-white divide-y divide-gray-200">
                     {filteredUsers.map((user) => (
                       <tr key={user.id} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm font-medium text-gray-900">
                             {user.firstName} {user.lastName}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-900">{user.username}</div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm">
                             <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                               user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                             }`}>
                               {user.isActive ? (
                                 <>
                                   <CheckCircle className="w-3 h-3 mr-1" />
                                   Aktiv
                                 </>
                               ) : (
                                 <>
                                   <XCircle className="w-3 h-3 mr-1" />
                                   Inaktiv
                                 </>
                               )}
                             </span>
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-900">
                             {getUserGroups(user.id).map((group: any) => group.description).join(', ')}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <div className="text-sm text-gray-900">
                             {new Date().toLocaleDateString('de-DE')}
                           </div>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                           <div className="flex space-x-2">
                             <button
                               onClick={() => handleEditUser(user)}
                               className="text-blue-600 hover:text-blue-900"
                             >
                               Bearbeiten
                             </button>
                             <button
                               onClick={() => handleDeleteUser(user)}
                               className="text-red-600 hover:text-red-900"
                             >
                               Löschen
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 </div>
               </div>
             )}
          </div>
        </div>

                 {/* Modal für Benutzer bearbeiten */}
         {showEditUserModal && userToEdit && (
           <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
             <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
               <div className="mt-3">
                 <h3 className="text-lg font-medium text-gray-900 mb-4">
                   Benutzer bearbeiten: {userToEdit.firstName} {userToEdit.lastName}
                 </h3>
                 <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Vorname
                     </label>
                     <input
                       type="text"
                       value={userToEdit.firstName}
                       onChange={(e) => setUserToEdit({...userToEdit, firstName: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Nachname
                     </label>
                     <input
                       type="text"
                       value={userToEdit.lastName}
                       onChange={(e) => setUserToEdit({...userToEdit, lastName: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       Benutzername
                     </label>
                     <input
                       type="text"
                       value={userToEdit.username}
                       onChange={(e) => setUserToEdit({...userToEdit, username: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">
                       E-Mail
                     </label>
                     <input
                       type="email"
                       value={userToEdit.email}
                       onChange={(e) => setUserToEdit({...userToEdit, email: e.target.value})}
                       className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                     />
                   </div>
                                                            <div>
                       <label className="block text-sm font-medium text-gray-700 mb-1">
                         Status
                       </label>
                       <div className="flex items-center">
                         <input
                           type="checkbox"
                           id="userStatus"
                           checked={userToEdit.isActive}
                           onChange={(e) => setUserToEdit({...userToEdit, isActive: e.target.checked})}
                           className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                         />
                         <label htmlFor="userStatus" className="ml-2 text-sm text-gray-700">
                           Benutzer ist aktiv
                         </label>
                       </div>
                       <p className="mt-1 text-xs text-gray-500">
                         Inaktive Benutzer können sich nicht mehr anmelden
                       </p>
                     </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gruppen
                      </label>
                                             <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                         {getUserGroups(userToEdit.id).map((group: any) => group.description).join(', ') || 'Keine Gruppen zugewiesen'}
                       </div>
                    </div>
                    
                    {/* Passwort-Änderung */}
                    <div className="border-t pt-4 mt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Passwort ändern</h4>
                      <div className="space-y-3">
                                                 <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Neues Passwort
                           </label>
                           <div className="relative">
                             <input
                               type={showNewPassword ? "text" : "password"}
                               value={passwordData.newPassword}
                               onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                               className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Mindestens 6 Zeichen"
                             />
                             <button
                               type="button"
                               onClick={() => setShowNewPassword(!showNewPassword)}
                               className="absolute inset-y-0 right-0 pr-3 flex items-center"
                             >
                               {showNewPassword ? (
                                 <EyeOff className="h-4 w-4 text-gray-400" />
                               ) : (
                                 <Eye className="h-4 w-4 text-gray-400" />
                               )}
                             </button>
                           </div>
                           <p className="mt-1 text-xs text-gray-500">
                             Das Passwort muss mindestens 6 Zeichen lang sein
                           </p>
                         </div>
                                                 <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">
                             Passwort bestätigen
                           </label>
                           <div className="relative">
                             <input
                               type={showConfirmPassword ? "text" : "password"}
                               value={passwordData.confirmPassword}
                               onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                               className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                               placeholder="Passwort wiederholen"
                             />
                             <button
                               type="button"
                               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                               className="absolute inset-y-0 right-0 pr-3 flex items-center"
                             >
                               {showConfirmPassword ? (
                                 <EyeOff className="h-4 w-4 text-gray-400" />
                               ) : (
                                 <Eye className="h-4 w-4 text-gray-400" />
                               )}
                             </button>
                           </div>
                           <p className="mt-1 text-xs text-gray-500">
                             Geben Sie das Passwort erneut ein
                           </p>
                         </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handleSavePassword}
                            disabled={!passwordData.newPassword || !passwordData.confirmPassword}
                            className="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Passwort ändern
                          </button>
                        </div>
                      </div>
                    </div>
                   <div className="flex justify-end space-x-3">
                     <button
                       onClick={() => {
                         setShowEditUserModal(false)
                         setUserToEdit(null)
                         setShowNewPassword(false)
                         setShowConfirmPassword(false)
                       }}
                       className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                     >
                       Abbrechen
                     </button>
                                           <button
                        onClick={handleSaveUser}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Speichern
                      </button>
                   </div>
                 </div>
               </div>
             </div>
           </div>
                   )}



          {/* Modal für Benutzer hinzufügen */}
         {showAddUserModal && selectedGroup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Benutzer zu {selectedGroup.name} hinzufügen
                </h3>
                <div className="space-y-4">
                  <select
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Benutzer auswählen...</option>
                    {users
                      .filter(user => !selectedGroup.users.find(u => u.id === user.id))
                      .map(user => (
                        <option key={user.id} value={user.id}>
                          {user.firstName} {user.lastName} ({user.username})
                        </option>
                      ))
                    }
                  </select>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddUserModal(false)
                        setSelectedUser(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={() => selectedUser && handleAddUserToGroup(selectedGroup.id, selectedUser)}
                      disabled={!selectedUser}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      Hinzufügen
                    </button>
                  </div>
                </div>
              </div>
            </div>
                     </div>
         )}

                 {/* System-Status */}
         <div className="bg-white rounded-lg shadow p-6 mt-8">
           <h2 className="text-lg font-semibold text-gray-900 mb-4">
             System-Status
           </h2>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <span className="text-gray-600">Backend API</span>
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                 Online
               </span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-gray-600">Datenbank</span>
               <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                 Verbunden
               </span>
             </div>
             <div className="flex items-center justify-between">
               <span className="text-gray-600">Letzte Synchronisation</span>
               <span className="text-sm text-gray-500">
                 {new Date().toLocaleString('de-DE')}
               </span>
             </div>
           </div>
         </div>

                   {/* Bestätigungs-Modal für Löschen aller Anträge */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center mb-4">
                    <XCircle className="w-8 h-8 text-red-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Alle Anträge löschen
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Sind Sie sicher, dass Sie alle Anträge löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={confirmDeleteAllServices}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Alle löschen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

                     {/* Bestätigungs-Modal für Löschen von Benutzer */}
           {showDeleteUserConfirm && userToDelete && (
             <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
               <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                 <div className="mt-3">
                   <div className="flex items-center mb-4">
                     <XCircle className="w-8 h-8 text-red-500 mr-3" />
                     <h3 className="text-lg font-medium text-gray-900">
                       Benutzer löschen
                     </h3>
                   </div>
                   <p className="text-gray-600 mb-6">
                     Sind Sie sicher, dass Sie <strong>{userToDelete.firstName} {userToDelete.lastName}</strong> löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                   </p>
                   <div className="flex justify-end space-x-3">
                     <button
                       onClick={() => {
                         setShowDeleteUserConfirm(false)
                         setUserToDelete(null)
                       }}
                       className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                     >
                       Abbrechen
                     </button>
                     <button
                       onClick={confirmDeleteUser}
                       className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                     >
                       Löschen
                     </button>
                   </div>
                 </div>
               </div>
             </div>
           )}

           {/* Bestätigungs-Modal für Entfernen von Benutzer aus Gruppe */}
           {showRemoveConfirm && userToRemove && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center mb-4">
                    <UserMinus className="w-8 h-8 text-red-500 mr-3" />
                    <h3 className="text-lg font-medium text-gray-900">
                      Benutzer entfernen
                    </h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Sind Sie sicher, dass Sie <strong>{userToRemove.userName}</strong> aus der Gruppe <strong>"{userToRemove.groupName}"</strong> entfernen möchten?
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowRemoveConfirm(false)
                        setUserToRemove(null)
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Abbrechen
                    </button>
                    <button
                      onClick={confirmRemoveUserFromGroup}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Entfernen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

export default AdminDashboard
