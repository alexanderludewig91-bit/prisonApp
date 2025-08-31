import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle,
  XCircle, 
  Filter,
  Calendar,
  User,
  X
} from 'lucide-react'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

interface Service {
  id: number
  title: string
  description: string
  status: string
  decision?: string
  priority: string
  serviceType: string
  createdAt: string
  createdByUser: {
    id: number
    username: string
    firstName: string
    lastName: string
  }
  assignedToUser?: {
    id: number
    username: string
    firstName: string
    lastName: string
  }
  assignedToGroupRef?: {
    id: number
    name: string
    description: string
  }
  activities: Array<{
    id: number
    action: string
    details: string
    when: string
    who: string
  }>
}

interface FilterState {
  status: string
  decision: string
  priority: string
  search: string
  dateFrom: string
  dateTo: string
}

const StaffDashboard = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const isPSDesigner = user?.groups?.some(group => group.name === 'PS Designers') || false
  const defaultTab = isPSDesigner ? 'all' : 'my-assignments'
  
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'my-assignments' | 'my-participation'>(defaultTab)
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'assignee' | 'status' | 'decision'>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    decision: '',
    priority: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    if (!isPSDesigner && activeTab === 'all') {
      setActiveTab('my-assignments')
    }
  }, [isPSDesigner, activeTab])

  useEffect(() => {
    fetchServices()
  }, [activeTab])

  const fetchServices = async () => {
    try {
      setLoading(true)
      let endpoint = '/services/staff/all'
      if (activeTab === 'my-assignments') {
        endpoint = '/services/staff/my-assignments'
      } else if (activeTab === 'my-participation') {
        endpoint = '/services/staff/my-participation'
      }
      const response = await api.get(endpoint)
      setServices(response.data.services || [])
    } catch (error) {
      console.error('Fehler beim Laden der Anträge:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE') + ' ' + new Date(dateString).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }



  const getServiceTypeText = (serviceType: string) => {
    switch (serviceType) {
      case 'FREETEXT': return 'Freitextantrag'
      default: return 'Antrag'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'RETURNED': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'URGENT': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSortedServices = (services: Service[]) => {
    return [...services].sort((a, b) => {
      let aValue: any
      let bValue: any

              switch (sortBy) {
          case 'date':
            aValue = new Date(a.createdAt)
            bValue = new Date(b.createdAt)
            break
          case 'title':
            aValue = a.title.toLowerCase()
            bValue = b.title.toLowerCase()
            break
          case 'assignee':
            aValue = a.assignedToGroupRef?.description || a.assignedToGroupRef?.name || 'Nicht zugewiesen'
            bValue = b.assignedToGroupRef?.description || b.assignedToGroupRef?.name || 'Nicht zugewiesen'
            break
          case 'status':
            aValue = a.status || ''
            bValue = b.status || ''
            break
          case 'decision':
            aValue = a.decision || ''
            bValue = b.decision || ''
            break
          default:
            return 0
        }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }

  const handleSort = (field: 'date' | 'title' | 'assignee' | 'status' | 'decision') => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDirection('desc')
    }
  }

  const getSortIcon = (field: 'date' | 'title' | 'assignee' | 'status' | 'decision') => {
    if (sortBy !== field) return null
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  const filteredServices = services.filter(service => {
    if (filters.status && service.status !== filters.status) return false
    if (filters.decision && service.decision !== filters.decision) return false
    if (filters.priority && service.priority !== filters.priority) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!service.title.toLowerCase().includes(searchLower) &&
          !service.description.toLowerCase().includes(searchLower) &&
          !`${service.createdByUser.firstName} ${service.createdByUser.lastName}`.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Antragsbearbeitung</h1>
          <p className="text-gray-600 mt-2">
            Übersicht und Bearbeitung aller Anträge
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* In-App Nachrichten */}
      {message && (
        <div className={`p-4 rounded-lg border ${
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

      {/* Filter */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="input"
              >
                <option value="">Alle Status</option>
                <option value="PENDING">Ausstehend</option>
                <option value="IN_PROGRESS">In Bearbeitung</option>
                <option value="COMPLETED">Abgeschlossen</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entscheidung
              </label>
              <select
                value={filters.decision}
                onChange={(e) => setFilters({ ...filters, decision: e.target.value })}
                className="input"
              >
                <option value="">Alle Entscheidungen</option>
                <option value="">Keine Entscheidung</option>
                <option value="APPROVED">Genehmigt</option>
                <option value="REJECTED">Abgelehnt</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priorität
              </label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="input"
              >
                <option value="">Alle Prioritäten</option>
                <option value="HIGH">Hohe Priorität</option>
                <option value="URGENT">Höchste Priorität</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suche
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Titel, Beschreibung, Antragsteller..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bis
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input"
              />
            </div>
          </div>
        </div>
      )}

      {/* Anträge Liste */}
      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <nav className="flex space-x-8 px-6">
          {isPSDesigner && (
            <button 
              onClick={() => setActiveTab('all')} 
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all' 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alle Anträge
            </button>
          )}
          <button 
            onClick={() => setActiveTab('my-assignments')} 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-assignments' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Meine Zuweisungen
          </button>
          <button 
            onClick={() => setActiveTab('my-participation')} 
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'my-participation' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Meine Beteiligung
          </button>
        </nav>

        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {activeTab === 'all' ? 'Alle Anträge' : 
             activeTab === 'my-assignments' ? 'Meine Zuweisungen' : 
             'Meine Beteiligung'} ({filteredServices.length})
          </h3>
        </div>

        {/* Tabellenüberschriften */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
          <div className="grid items-center md:grid-cols-[minmax(0,1fr)_22rem_12rem_12rem] gap-x-6 px-6 py-4 text-sm font-medium text-gray-700">
            <div className="min-w-0">
              <div className="font-medium">Antrag</div>
              <div className="mt-1 text-sm text-muted-foreground tabular-nums truncate">
                <button 
                  onClick={() => handleSort('date')}
                  className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Datum {getSortIcon('date')}</span>
                </button>
                <button 
                  onClick={() => handleSort('title')}
                  className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Antragsteller {getSortIcon('title')}</span>
                </button>
              </div>
            </div>
            <div className="min-w-0 justify-self-start">
              <button 
                onClick={() => handleSort('assignee')}
                className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Zuweisung {getSortIcon('assignee')}</span>
              </button>
            </div>
            <div className="justify-self-center text-center">
              <button 
                onClick={() => handleSort('status')}
                className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
              >
                <span>Status {getSortIcon('status')}</span>
              </button>
            </div>
            <div className="justify-self-center text-center">
              <button 
                onClick={() => handleSort('decision')}
                className="inline-flex items-center gap-1 hover:text-gray-900 transition-colors"
              >
                <span>Entscheidung {getSortIcon('decision')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {getSortedServices(filteredServices).map((service) => (
            <div 
              key={service.id} 
              className="grid items-center md:grid-cols-[minmax(0,1fr)_22rem_12rem_12rem] gap-x-6 px-6 odd:bg-muted/30 hover:bg-muted/50 border-t py-3 cursor-pointer transition-colors"
              onClick={() => navigate(`/services/${service.id}`)}
            >
              {/* Linke Spalte: Titel + Metadaten */}
              <div className="min-w-0">
                <div className="font-medium truncate">
                  {service.priority && service.priority !== '' && (
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mr-2 ${getPriorityColor(service.priority)}`}>
                      {service.priority === 'HIGH' ? 'Hohe Priorität' : 'Höchste Priorität'}
                    </span>
                  )}
                  {getServiceTypeText(service.serviceType)}: {service.title}
                </div>
                <div className="mt-1 text-sm text-muted-foreground tabular-nums truncate">
                  <span className="inline-flex items-center gap-1 shrink-0">
                    <Calendar className="h-4 w-4" />
                    <span className="tabular-nums">{formatDate(service.createdAt)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 min-w-0 ml-2">
                    <User className="h-4 w-4" />
                    <span className="truncate">
                      {service.createdByUser.firstName} {service.createdByUser.lastName}
                    </span>
                  </span>
                </div>
              </div>
              
              {/* Mittlere Spalte: Zuweisung */}
              <div className="min-w-0">
                <span className="inline-flex items-center gap-2 truncate">
                  <User className={`h-4 w-4 ${
                    service.assignedToGroupRef ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <span className={
                    service.assignedToGroupRef ? 'text-gray-900' : 'text-gray-500'
                  }>
                    {service.assignedToGroupRef 
                      ? (service.assignedToGroupRef.description || service.assignedToGroupRef.name)
                      : 'Nicht zugewiesen'
                    }
                  </span>
                </span>
              </div>
              
              {/* Status Spalte */}
              <div className="justify-self-center">
                {service.status && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                    {service.status === 'PENDING' ? 'Ausstehend' :
                     service.status === 'IN_PROGRESS' ? 'In Bearbeitung' :
                     service.status === 'COMPLETED' ? 'Abgeschlossen' : ''}
                  </span>
                )}
              </div>
              
              {/* Entscheidung Spalte */}
              <div className="justify-self-center">
                {service.decision && service.decision !== '' && (
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDecisionColor(service.decision)}`}>
                    {service.decision === 'APPROVED' ? 'Genehmigt' :
                     service.decision === 'REJECTED' ? 'Abgelehnt' :
                     service.decision === 'RETURNED' ? 'Zurückgewiesen' : ''}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {filteredServices.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Keine Anträge gefunden
          </div>
        )}
      </div>
    </div>
  )
}

export default StaffDashboard

