import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import api from '../services/api'
import { 
  Users, 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  UserPlus, 
  UserMinus,
  CheckCircle,
  XCircle,
  X,
  BarChart3,
  FileText,
  Clock
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

  // Admin-Berechtigung prüfen
  const userGroups = user?.groups?.map(g => g.name) || []
  const isAdmin = userGroups.some(group => group === 'PS Designers')

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchGroups()
    fetchUsers()
    fetchServices()
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
      setUsers(response.data.users || [])
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
      const updatedSelectedGroup = updatedGroups.find(g => g.id === groupId)
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
      const updatedSelectedGroup = updatedGroups.find(g => g.id === userToRemove.groupId)
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
            <h2 className="text-xl font-semibold text-gray-900">Gruppen-Verwaltung</h2>
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
                                           <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => group.category !== 'SYSTEM' && setSelectedGroup(selectedGroup?.id === group.id ? null : group)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{group.description}</div>
                            <div className="text-sm text-gray-500">Technisch: {group.name}</div>
                          </div>
                        </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(group.category)}`}>
                           {group.category}
                         </span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap">
                         <div className="text-sm text-gray-900">{group.users.length} Mitglieder</div>
                         <div className="text-sm text-gray-500">
                           {group.users.slice(0, 3).map(u => u.firstName).join(', ')}
                           {group.users.length > 3 && '...'}
                         </div>
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
                     
                                           {/* Ausklappbare Mitgliederliste */}
                      {selectedGroup?.id === group.id && group.category !== 'SYSTEM' && (
                       <tr>
                         <td colSpan={5} className="px-0 py-0">
                           <div className="bg-gray-50 border-t border-gray-200">
                             <div className="px-6 py-4">
                               <div className="flex items-center justify-between mb-4">
                                 <h4 className="text-sm font-semibold text-gray-900">
                                   Mitglieder von {group.name}
                                 </h4>
                                 <span className="text-xs text-gray-500">
                                   {group.users.length} Mitglieder
                                 </span>
                               </div>
                               {group.users.length > 0 ? (
                                 <div className="overflow-x-auto">
                                   <table className="min-w-full divide-y divide-gray-200">
                                     <thead className="bg-white">
                                       <tr>
                                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                           Benutzer
                                         </th>
                                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                           Rolle
                                         </th>
                                         <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                           Aktionen
                                         </th>
                                       </tr>
                                     </thead>
                                     <tbody className="bg-white divide-y divide-gray-200">
                                       {group.users.map((user) => (
                                         <tr key={user.id} className="hover:bg-gray-50">
                                           <td className="px-4 py-3 whitespace-nowrap">
                                             <div className="flex items-center">
                                               <div>
                                                 <div className="text-sm font-medium text-gray-900">
                                                   {user.firstName} {user.lastName}
                                                 </div>
                                                 <div className="text-sm text-gray-500">{user.username}</div>
                                               </div>
                                             </div>
                                           </td>
                                           <td className="px-4 py-3 whitespace-nowrap">
                                             <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                               {user.role}
                                             </span>
                                           </td>
                                           <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                                             <button
                                               onClick={() => handleRemoveUserFromGroup(group.id, user.id)}
                                               className="text-red-600 hover:text-red-900 flex items-center transition-colors"
                                             >
                                               <UserMinus className="w-4 h-4 mr-1" />
                                               Entfernen
                                             </button>
                                           </td>
                                         </tr>
                                       ))}
                                     </tbody>
                                   </table>
                                 </div>
                               ) : (
                                 <div className="text-center py-6 text-gray-500">
                                   <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                   <p className="text-sm">Keine Mitglieder in dieser Gruppe</p>
                                   <p className="text-xs mt-1">Klicken Sie auf "Hinzufügen" um Benutzer zur Gruppe hinzuzufügen</p>
                                 </div>
                               )}
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
