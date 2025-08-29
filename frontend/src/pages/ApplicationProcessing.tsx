import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  Eye,
  Calendar,
  User,
  X,
  CheckCircle2,
  ArrowRight
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Service {
  id: number
  title: string
  description: string
  status: string
  priority: string
  antragstyp?: string
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
  priority: string
  search: string
  antragstyp: string
}

const ApplicationProcessing = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    priority: '',
    search: '',
    antragstyp: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [userGroups, setUserGroups] = useState<string[]>([])

  useEffect(() => {
    if (user) {
      // Benutzergruppen extrahieren
      const groups = user.groups?.map(g => g.name) || []
      setUserGroups(groups)
      fetchGroupServices(groups)
    }
  }, [user])

  const fetchGroupServices = async (groups: string[]) => {
    try {
      setLoading(true)
      // Neue API für gruppenspezifische Services verwenden
      const response = await api.get('/services/group/my')
      setServices(response.data.services || [])
    } catch (error) {
      console.error('Fehler beim Laden der Gruppen-Anträge:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (serviceId: number, newStatus: string) => {
    try {
      await api.patch(`/services/${serviceId}/status`, { 
        status: newStatus,
        reason: `Status durch ${user?.firstName} ${user?.lastName} geändert`
      })
      
      // Service-Liste aktualisieren
      fetchGroupServices(userGroups)
      setMessage({ type: 'success', text: 'Status erfolgreich geändert!' })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error)
      setMessage({ type: 'error', text: 'Fehler beim Ändern des Status' })
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'SECURITY_REVIEW':
        return <AlertCircle className="w-4 h-4 text-purple-500" />
      case 'MEDICAL_REVIEW':
        return <AlertCircle className="w-4 h-4 text-pink-500" />
      case 'SECURITY_ASSESSMENT':
        return <AlertCircle className="w-4 h-4 text-indigo-500" />
      case 'MANAGEMENT_REVIEW':
        return <AlertCircle className="w-4 h-4 text-orange-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800'
      case 'SECURITY_REVIEW':
        return 'bg-purple-100 text-purple-800'
      case 'MEDICAL_REVIEW':
        return 'bg-pink-100 text-pink-800'
      case 'SECURITY_ASSESSMENT':
        return 'bg-indigo-100 text-indigo-800'
      case 'MANAGEMENT_REVIEW':
        return 'bg-orange-100 text-orange-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ausstehend'
      case 'IN_PROGRESS':
        return 'In Bearbeitung'
      case 'SECURITY_REVIEW':
        return 'Sicherheitsprüfung'
      case 'MEDICAL_REVIEW':
        return 'Medizinische Prüfung'
      case 'SECURITY_ASSESSMENT':
        return 'Sicherheitsbewertung'
      case 'MANAGEMENT_REVIEW':
        return 'Leitungsprüfung'
      case 'COMPLETED':
        return 'Abgeschlossen'
      case 'REJECTED':
        return 'Abgelehnt'
      default:
        return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800'
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNextStatusOptions = (service: Service) => {
    const options = []
    
    // Basierend auf Antragstyp und aktuellem Status
    if (service.antragstyp === 'Gesundheit') {
      if (service.status === 'MEDICAL_REVIEW') {
        options.push({ value: 'IN_PROGRESS', label: 'In Bearbeitung setzen' })
        options.push({ value: 'COMPLETED', label: 'Genehmigen' })
        options.push({ value: 'REJECTED', label: 'Ablehnen' })
      }
    } else if (service.antragstyp === 'Besuch') {
      if (service.status === 'SECURITY_REVIEW') {
        options.push({ value: 'IN_PROGRESS', label: 'In Bearbeitung setzen' })
        options.push({ value: 'REJECTED', label: 'Ablehnen' })
      }
    } else if (service.antragstyp === 'Vollzugslockerung') {
      if (service.status === 'SECURITY_ASSESSMENT') {
        options.push({ value: 'MANAGEMENT_REVIEW', label: 'An Leitung weiterleiten' })
        options.push({ value: 'REJECTED', label: 'Ablehnen' })
      }
    }
    
    // Allgemeine Optionen
    if (service.status === 'PENDING') {
      options.push({ value: 'IN_PROGRESS', label: 'In Bearbeitung setzen' })
    }
    if (service.status === 'IN_PROGRESS') {
      options.push({ value: 'COMPLETED', label: 'Genehmigen' })
      options.push({ value: 'REJECTED', label: 'Ablehnen' })
    }
    
    return options
  }

  const filteredServices = services.filter(service => {
    if (filters.status && service.status !== filters.status) return false
    if (filters.priority && service.priority !== filters.priority) return false
    if (filters.antragstyp && service.antragstyp !== filters.antragstyp) return false
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      if (!service.title.toLowerCase().includes(searchTerm) && 
          !service.description.toLowerCase().includes(searchTerm) &&
          !service.createdByUser.firstName.toLowerCase().includes(searchTerm) &&
          !service.createdByUser.lastName.toLowerCase().includes(searchTerm)) {
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
            Anträge für {userGroups.join(', ')}
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
                <CheckCircle2 className="w-5 h-5 mr-2" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <option value="SECURITY_REVIEW">Sicherheitsprüfung</option>
                <option value="MEDICAL_REVIEW">Medizinische Prüfung</option>
                <option value="SECURITY_ASSESSMENT">Sicherheitsbewertung</option>
                <option value="MANAGEMENT_REVIEW">Leitungsprüfung</option>
                <option value="COMPLETED">Abgeschlossen</option>
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
                <option value="LOW">Niedrig</option>
                <option value="MEDIUM">Mittel</option>
                <option value="HIGH">Hoch</option>
                <option value="URGENT">Dringend</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Antragstyp
              </label>
              <select
                value={filters.antragstyp}
                onChange={(e) => setFilters({ ...filters, antragstyp: e.target.value })}
                className="input"
              >
                <option value="">Alle Typen</option>
                <option value="Besuch">Besuch</option>
                <option value="Gesundheit">Gesundheit</option>
                <option value="Taschengeld-Antrag">Taschengeld-Antrag</option>
                <option value="Vollzugslockerung">Vollzugslockerung</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Suche
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Titel, Beschreibung, Name..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="input pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistiken */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ausstehend</p>
              <p className="text-2xl font-bold text-gray-900">
                {services.filter(s => s.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
              <p className="text-2xl font-bold text-gray-900">
                {services.filter(s => s.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abgeschlossen</p>
              <p className="text-2xl font-bold text-gray-900">
                {services.filter(s => s.status === 'COMPLETED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Abgelehnt</p>
              <p className="text-2xl font-bold text-gray-900">
                {services.filter(s => s.status === 'REJECTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Anträge Liste */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Meine Anträge ({filteredServices.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredServices.map((service) => (
            <div key={service.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {service.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(service.status)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(service.status)}`}>
                        {getStatusText(service.status)}
                      </span>
                      {service.antragstyp && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {service.antragstyp}
                        </span>
                      )}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(service.priority)}`}>
                        {service.priority === 'LOW' && 'Niedrig'}
                        {service.priority === 'MEDIUM' && 'Mittel'}
                        {service.priority === 'HIGH' && 'Hoch'}
                        {service.priority === 'URGENT' && 'Dringend'}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">{service.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>
                        {service.createdByUser.firstName} {service.createdByUser.lastName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(service.createdAt)}</span>
                    </div>
                    {service.assignedToUser && (
                      <div className="flex items-center space-x-1">
                        <User className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-600">
                          Zugewiesen: {service.assignedToUser.firstName} {service.assignedToUser.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => navigate(`/services/${service.id}`)}
                    className="btn btn-secondary flex items-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Anzeigen</span>
                  </button>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleStatusChange(service.id, e.target.value)
                      }
                    }}
                    className="input text-sm"
                  >
                    <option value="">Aktion wählen</option>
                    {getNextStatusOptions(service).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
        {filteredServices.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            Keine Anträge für deine Gruppe gefunden
          </div>
        )}
      </div>
    </div>
  )
}

export default ApplicationProcessing
