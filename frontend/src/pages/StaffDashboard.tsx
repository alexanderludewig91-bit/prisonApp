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
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import api from '../services/api'

interface Service {
  id: number
  title: string
  description: string
  status: string
  decision?: string // Neue Entscheidungs-Spalte
  priority: string
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
  decision: string // Neuer Filter für Entscheidungen
  priority: string
  search: string
  dateFrom: string
  dateTo: string
}

const StaffDashboard = () => {
  const navigate = useNavigate()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [workflowStats, setWorkflowStats] = useState({
    myAssignedServices: 0,
    workflowTransitionsToday: 0
  })
  const [filters, setFilters] = useState<FilterState>({
    status: '',
    decision: '', // Neuer Filter
    priority: '',
    search: '',
    dateFrom: '',
    dateTo: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    fetchServices()
    fetchWorkflowStats()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await api.get('/services/staff/all')
      setServices(response.data.services || [])
    } catch (error) {
      console.error('Fehler beim Laden der Anträge:', error)
      setServices([])
    } finally {
      setLoading(false)
    }
  }

  const fetchWorkflowStats = async () => {
    try {
      const response = await api.get('/services/staff/workflow-stats')
      setWorkflowStats(response.data.workflowStats || {
        myAssignedServices: 0,
        workflowTransitionsToday: 0
      })
    } catch (error) {
      console.error('Fehler beim Laden der Workflow-Statistiken:', error)
      setWorkflowStats({
        myAssignedServices: 0,
        workflowTransitionsToday: 0
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
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
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Neue Funktionen für Entscheidungen
  const getDecisionIcon = (decision?: string) => {
    switch (decision) {
      case 'APPROVED':
        return <ThumbsUp className="w-4 h-4 text-green-500" />
      case 'REJECTED':
        return <ThumbsDown className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getDecisionColor = (decision?: string) => {
    switch (decision) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const handleStatusChange = async (serviceId: number, newStatus: string) => {
    try {
      await api.patch(`/services/${serviceId}/status`, { status: newStatus })
      setMessage({ type: 'success', text: 'Status erfolgreich geändert' })
      // Service-Liste und Statistiken aktualisieren
      fetchServices()
      fetchWorkflowStats()
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error)
      setMessage({ type: 'error', text: 'Fehler beim Ändern des Status' })
    }
  }

  // Neue Funktion für Entscheidungsänderung
  const handleDecisionChange = async (serviceId: number, newDecision: string) => {
    try {
      await api.patch(`/services/${serviceId}/decision`, { decision: newDecision })
      setMessage({ type: 'success', text: 'Entscheidung erfolgreich getroffen' })
      // Service-Liste und Statistiken aktualisieren
      fetchServices()
      fetchWorkflowStats()
    } catch (error) {
      console.error('Fehler beim Treffen der Entscheidung:', error)
      setMessage({ type: 'error', text: 'Fehler beim Treffen der Entscheidung' })
    }
  }

  const filteredServices = services.filter(service => {
    if (filters.status && service.status !== filters.status) return false
    if (filters.decision && service.decision !== filters.decision) return false // Neuer Filter
    if (filters.priority && service.priority !== filters.priority) return false
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      if (!service.title.toLowerCase().includes(searchTerm) && 
          !service.description.toLowerCase().includes(searchTerm) &&
          !service.createdByUser.firstName.toLowerCase().includes(searchTerm) &&
          !service.createdByUser.lastName.toLowerCase().includes(searchTerm)) {
        return false
      }
    }
    if (filters.dateFrom) {
      const serviceDate = new Date(service.createdAt)
      const fromDate = new Date(filters.dateFrom)
      if (serviceDate < fromDate) return false
    }
    if (filters.dateTo) {
      const serviceDate = new Date(service.createdAt)
      const toDate = new Date(filters.dateTo)
      if (serviceDate > toDate) return false
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
          <h1 className="text-3xl font-bold text-gray-900">Mitarbeiter-Dashboard</h1>
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
                <option value="">Alle Prioritäten</option>
                <option value="HIGH">Hohe Priorität</option>
                <option value="URGENT">Höchste Priorität</option>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Von Datum
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
                Bis Datum
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

             {/* Kompakte Statistiken */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         {/* Status-Übersicht */}
         <div className="bg-white rounded-lg shadow p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-base font-semibold text-gray-700">Status</h3>
             <FileText className="w-5 h-5 text-gray-400" />
           </div>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <FileText className="w-4 h-4 text-gray-500" />
                 <span className="text-sm text-gray-600">Alle Anträge</span>
               </div>
               <span className="text-base font-bold text-gray-900">
                 {services.length}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <Clock className="w-4 h-4 text-yellow-500" />
                 <span className="text-sm text-gray-600">Ausstehend</span>
               </div>
               <span className="text-base font-bold text-gray-900">
                 {services.filter(s => s.status === 'PENDING').length}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <AlertCircle className="w-4 h-4 text-blue-500" />
                 <span className="text-sm text-gray-600">In Bearbeitung</span>
               </div>
               <span className="text-base font-bold text-gray-900">
                 {services.filter(s => s.status === 'IN_PROGRESS').length}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <CheckCircle className="w-4 h-4 text-green-500" />
                 <span className="text-sm text-gray-600">Abgeschlossen</span>
               </div>
               <span className="text-base font-bold text-gray-900">
                 {services.filter(s => s.status === 'COMPLETED').length}
               </span>
             </div>
           </div>
         </div>

         {/* Entscheidungs-Übersicht */}
         <div className="bg-white rounded-lg shadow p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-base font-semibold text-gray-700">Entscheidungen</h3>
             <ThumbsUp className="w-5 h-5 text-gray-400" />
           </div>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <ThumbsUp className="w-4 h-4 text-green-500" />
                 <span className="text-sm text-gray-600">Genehmigt</span>
               </div>
               <span className="text-base font-bold text-gray-900">
                 {services.filter(s => s.decision === 'APPROVED').length}
               </span>
             </div>
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <ThumbsDown className="w-4 h-4 text-red-500" />
                 <span className="text-sm text-gray-600">Abgelehnt</span>
               </div>
               <span className="text-base font-bold text-gray-900">
                 {services.filter(s => s.decision === 'REJECTED').length}
               </span>
             </div>
           </div>
         </div>

         {/* Meine Anträge */}
         <div className="bg-white rounded-lg shadow p-4">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-base font-semibold text-gray-700">Meine Anträge</h3>
             <User className="w-5 h-5 text-blue-500" />
           </div>
           <div className="space-y-3">
             <div className="flex items-center justify-between">
               <div className="flex items-center space-x-2">
                 <User className="w-4 h-4 text-blue-500" />
                 <span className="text-sm text-gray-600">Zugewiesene Anträge</span>
               </div>
               <span className="text-base font-bold text-gray-900">
                 {workflowStats.myAssignedServices}
               </span>
             </div>
           </div>
         </div>

         
       </div>

              {/* Anträge Liste */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Anträge ({filteredServices.length})
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
                        {service.status === 'PENDING' && 'Ausstehend'}
                        {service.status === 'IN_PROGRESS' && 'In Bearbeitung'}
                        {service.status === 'COMPLETED' && 'Abgeschlossen'}
                      </span>
                      {getDecisionIcon(service.decision)}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDecisionColor(service.decision)}`}>
                        {!service.decision && 'Keine Entscheidung'}
                        {service.decision === 'APPROVED' && 'Genehmigt'}
                        {service.decision === 'REJECTED' && 'Abgelehnt'}
                      </span>
                                              {service.priority && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(service.priority)}`}>
                            {service.priority === 'HIGH' && 'Hohe Priorität'}
                            {service.priority === 'URGENT' && 'Höchste Priorität'}
                          </span>
                        )}
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
                    value={service.status}
                    onChange={(e) => handleStatusChange(service.id, e.target.value)}
                    className="input text-sm"
                  >
                    <option value="PENDING">Ausstehend</option>
                    <option value="IN_PROGRESS">In Bearbeitung</option>
                    <option value="COMPLETED">Abgeschlossen</option>
                  </select>
                  <select
                    value={service.decision || ''}
                    onChange={(e) => handleDecisionChange(service.id, e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">Keine Entscheidung</option>
                    <option value="APPROVED">Genehmigt</option>
                    <option value="REJECTED">Abgelehnt</option>
                  </select>
                </div>
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

