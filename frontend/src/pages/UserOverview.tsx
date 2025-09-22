import { useState, useEffect, useRef, useCallback } from 'react'
import { getStaffUsers } from '../services/api'
import { User, Search, Filter, Users } from 'lucide-react'

interface User {
  id: number
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: string
  groups: {
    group: {
      id: number
      name: string
      description: string
      category: string
      permissions: string[]
      isActive: boolean
    }
  }[]
}

const UserOverview = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterActive, setFilterActive] = useState<boolean | null>(null)
  
  // Resizable columns state
  const [columnWidths, setColumnWidths] = useState({
    user: 300,
    groups: 250,
    status: 120
  })
  const [isResizing, setIsResizing] = useState(false)
  const [resizingColumn, setResizingColumn] = useState<string | null>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)

  useEffect(() => {
    fetchUsers()
    // Load saved column widths from localStorage
    const savedWidths = localStorage.getItem('userOverview-columnWidths')
    if (savedWidths) {
      setColumnWidths(JSON.parse(savedWidths))
    }
  }, [])

  // Save column widths to localStorage
  useEffect(() => {
    localStorage.setItem('userOverview-columnWidths', JSON.stringify(columnWidths))
  }, [columnWidths])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await getStaffUsers()
      setUsers(response.users || [])
    } catch (error) {
      console.error('Fehler beim Laden der STAFF-Benutzer:', error)
      setError('Fehler beim Laden der Benutzer')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterActive === null || user.isActive === filterActive
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Mouse event handlers for resizable columns
  const handleMouseDown = useCallback((e: React.MouseEvent, column: string) => {
    e.preventDefault()
    e.stopPropagation()
    setIsResizing(true)
    setResizingColumn(column)
    startXRef.current = e.clientX
    startWidthRef.current = columnWidths[column as keyof typeof columnWidths]
    
    // Add event listeners with proper cleanup
    const handleMouseMoveEvent = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault()
      const deltaX = moveEvent.clientX - startXRef.current
      const newWidth = Math.max(100, startWidthRef.current + deltaX)
      
      setColumnWidths(prev => ({
        ...prev,
        [column]: newWidth
      }))
    }
    
    const handleMouseUpEvent = () => {
      setIsResizing(false)
      setResizingColumn(null)
      document.removeEventListener('mousemove', handleMouseMoveEvent)
      document.removeEventListener('mouseup', handleMouseUpEvent)
    }
    
    document.addEventListener('mousemove', handleMouseMoveEvent)
    document.addEventListener('mouseup', handleMouseUpEvent)
    
    // Store references for cleanup
    startXRef.current = e.clientX
  }, [columnWidths])

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      // Remove any remaining event listeners
      document.removeEventListener('mousemove', () => {})
      document.removeEventListener('mouseup', () => {})
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Users className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Benutzerübersicht</h1>
        </div>
        <p className="text-gray-600">
          Übersicht aller Mitarbeitenden
        </p>
      </div>

      {/* Such- und Filterleiste */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Suchfeld */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Nach Namen, Benutzername oder E-Mail suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filterActive === null ? 'all' : filterActive.toString()}
              onChange={(e) => {
                const value = e.target.value
                setFilterActive(value === 'all' ? null : value === 'true')
              }}
              className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Alle Benutzer</option>
              <option value="true">Nur aktive</option>
              <option value="false">Nur inaktive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <div className="h-3 w-3 bg-green-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Aktiv</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => user.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
              <div className="h-3 w-3 bg-red-600 rounded-full"></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Inaktiv</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => !user.isActive).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benutzerliste */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">

        {filteredUsers.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm || filterActive !== null 
                ? 'Keine Benutzer gefunden, die den Suchkriterien entsprechen.'
                : 'Keine STAFF-Benutzer im System vorhanden.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table ref={tableRef} className="min-w-full divide-y divide-gray-200" style={{ tableLayout: 'fixed' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none"
                    style={{ width: columnWidths.user }}
                  >
                    Benutzer
                    <div 
                      className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400 bg-transparent hover:opacity-100 transition-opacity ${
                        isResizing && resizingColumn === 'user' ? 'bg-blue-500 opacity-100' : 'opacity-0'
                      }`}
                      onMouseDown={(e) => handleMouseDown(e, 'user')}
                      style={{ zIndex: 10 }}
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none"
                    style={{ width: columnWidths.groups }}
                  >
                    Gruppen
                    <div 
                      className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400 bg-transparent hover:opacity-100 transition-opacity ${
                        isResizing && resizingColumn === 'groups' ? 'bg-blue-500 opacity-100' : 'opacity-0'
                      }`}
                      onMouseDown={(e) => handleMouseDown(e, 'groups')}
                      style={{ zIndex: 10 }}
                    />
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative select-none"
                    style={{ width: columnWidths.status }}
                  >
                    Status
                    <div 
                      className={`absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-blue-400 bg-transparent hover:opacity-100 transition-opacity ${
                        isResizing && resizingColumn === 'status' ? 'bg-blue-500 opacity-100' : 'opacity-0'
                      }`}
                      onMouseDown={(e) => handleMouseDown(e, 'status')}
                      style={{ zIndex: 10 }}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.groups
                          .filter((userGroup) => userGroup.group.description !== "Alle Benutzer")
                          .map((userGroup) => (
                            <span
                              key={userGroup.group.id}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {userGroup.group.description || userGroup.group.name}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.isActive ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default UserOverview
