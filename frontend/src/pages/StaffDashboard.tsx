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
  Edit,
  Calendar,
  User,
  X
} from 'lucide-react'
import api from '../services/api'

interface Service {
  id: number
  title: string
  description: string
  status: string
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
    autoAssignmentsToday: 0,
    workflowTransitionsToday: 0
  })
  const [filters, setFilters] = useState<FilterState>({
    status: '',
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
        autoAssignmentsToday: 0,
        workflowTransitionsToday: 0
      })
    } catch (error) {
      console.error('Fehler beim Laden der Workflow-Statistiken:', error)
      setWorkflowStats({
        myAssignedServices: 0,
        autoAssignmentsToday: 0,
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
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const handleStatusChange = async (serviceId: number, newStatus: string) => {
    try {
      await api.patch(`/services/${serviceId}/status`, { status: newStatus })
      // Service-Liste und Statistiken aktualisieren
      fetchServices()
      fetchWorkflowStats()
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error)
    }
  }

  const handleAssignPending = async () => {
    try {
      await api.post('/services/staff/assign-pending')
      // Service-Liste und Statistiken aktualisieren
      fetchServices()
      fetchWorkflowStats()
      setMessage({ type: 'success', text: 'PENDING Anträge wurden automatisch zugewiesen!' })
      // Nach 3 Sekunden die Nachricht ausblenden
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Fehler beim Zuweisen der PENDING Anträge:', error)
      setMessage({ type: 'error', text: 'Fehler beim Zuweisen der Anträge' })
      // Nach 5 Sekunden die Fehlermeldung ausblenden
      setTimeout(() => setMessage(null), 5000)
    }
  }

  const filteredServices = services.filter(service => {
    if (filters.status && service.status !== filters.status) return false
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
           <button
             onClick={handleAssignPending}
             className="btn btn-primary flex items-center space-x-2"
           >
             <User className="w-4 h-4" />
             <span>PENDING Anträge zuweisen</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

               {/* Workflow-Statistiken */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Meine zugewiesenen Anträge</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflowStats.myAssignedServices}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Auto-Zuweisungen heute</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflowStats.autoAssignmentsToday}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Workflow-Übergänge heute</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workflowStats.workflowTransitionsToday}
                </p>
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
                        {service.status === 'REJECTED' && 'Abgelehnt'}
                      </span>
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
                    value={service.status}
                    onChange={(e) => handleStatusChange(service.id, e.target.value)}
                    className="input text-sm"
                  >
                    <option value="PENDING">Ausstehend</option>
                    <option value="IN_PROGRESS">In Bearbeitung</option>
                    <option value="COMPLETED">Abgeschlossen</option>
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
