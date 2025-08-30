import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate } from 'react-router-dom'
import api from '../services/api'
import { 
  Shield, 
  Filter,
  User,
  Activity,
  Clock,
  Monitor
} from 'lucide-react'

interface AdminLog {
  id: number
  adminUserId: number
  adminUsername: string
  action: string
  target?: string
  details?: string
  ipAddress?: string
  userAgent?: string
  timestamp: string
  admin: {
    id: number
    username: string
    firstName: string
    lastName: string
  }
}

interface AdminLogStatistics {
  totalLogs: number
  uniqueAdmins: number
  actionCounts: Array<{
    action: string
    _count: { action: number }
  }>
  recentActivity: AdminLog[]
}

const AdminLogs: React.FC = () => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<AdminLog[]>([])
  const [statistics, setStatistics] = useState<AdminLogStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Filter
  const [filters, setFilters] = useState({
    action: '',
    adminUsername: '',
    startDate: '',
    endDate: ''
  })

  // Admin-Berechtigung prüfen
  const userGroups = user?.groups?.map(g => g.name) || []
  const isAdmin = userGroups.some(group => group === 'PS Designers')

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    fetchLogs()
    fetchStatistics()
  }, [currentPage, filters.action, filters.adminUsername, filters.startDate, filters.endDate])

  const fetchLogs = async () => {
    try {
      // Nur nicht-leere Filter-Werte hinzufügen
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })

      // Filter nur hinzufügen wenn sie nicht leer sind
      if (filters.action.trim()) {
        params.append('action', filters.action.trim())
      }
      if (filters.adminUsername.trim()) {
        params.append('adminUsername', filters.adminUsername.trim())
      }
      if (filters.startDate) {
        params.append('startDate', filters.startDate)
      }
      if (filters.endDate) {
        params.append('endDate', filters.endDate)
      }

      console.log('Fetching logs with params:', params.toString()) // Debug-Log

      const response = await api.get(`/admin-logs?${params}`)
      setLogs(response.data.logs)
      setTotalPages(response.data.pagination.totalPages)
      setTotalCount(response.data.pagination.totalCount)
    } catch (error: any) {
      console.error('Fehler beim Laden der Admin-Logs:', error)
      console.error('Error response:', error.response?.data)
      if (error.response?.data?.details) {
        console.error('Server error details:', error.response.data.details)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin-logs/statistics')
      setStatistics(response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Statistiken:', error)
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    console.log(`Filter changed: ${key} = ${value}`) // Debug-Log
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Zurück zur ersten Seite bei Filter-Änderung
  }

  const resetFilters = () => {
    setFilters({
      action: '',
      adminUsername: '',
      startDate: '',
      endDate: ''
    })
    setCurrentPage(1)
  }

  const getActionColor = (action: string) => {
    if (action.includes('DELETE')) return 'text-red-600 bg-red-50'
    if (action.includes('ADD')) return 'text-green-600 bg-green-50'
    if (action.includes('VIEW')) return 'text-blue-600 bg-blue-50'
    return 'text-gray-600 bg-gray-50'
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('de-DE')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Lade Admin-Logs...</p>
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
            Admin-Logs
          </h1>
          <p className="mt-2 text-gray-600">
            Protokoll aller Admin-Aktionen für Audit und Sicherheit
          </p>
        </div>

        {/* Statistiken */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Activity className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalLogs}</p>
                  <p className="text-sm text-gray-600">Gesamte Logs</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <User className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{statistics.uniqueAdmins}</p>
                  <p className="text-sm text-gray-600">Aktive Admins</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.recentActivity.length}
                  </p>
                  <p className="text-sm text-gray-600">Letzte Aktivitäten</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Monitor className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {statistics.actionCounts.length}
                  </p>
                  <p className="text-sm text-gray-600">Aktions-Typen</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filter
            </h2>
            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
            >
              Filter zurücksetzen
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aktion
              </label>
              <input
                type="text"
                value={filters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                placeholder="z.B. DELETE_ALL_SERVICES"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin
              </label>
              <input
                type="text"
                value={filters.adminUsername}
                onChange={(e) => handleFilterChange('adminUsername', e.target.value)}
                placeholder="Benutzername"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start-Datum
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End-Datum
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Logs-Tabelle */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Admin-Aktivitäten ({totalCount} Einträge)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zeitstempel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aktion
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ziel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP-Adresse
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.admin.firstName} {log.admin.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{log.adminUsername}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.target || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Seite {currentPage} von {totalPages} ({totalCount} Einträge)
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Weiter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminLogs
