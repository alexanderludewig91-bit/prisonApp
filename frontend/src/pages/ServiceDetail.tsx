import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Calendar,
  Edit,
  FileText
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Service {
  id: number
  title: string
  description: string
  status: string
  priority: string
  serviceType: string
  createdAt: string
  updatedAt: string
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
    description?: string
  }
  activities: Array<{
    id: number
    action: string
    details: string
    when: string
    who: string
    user?: {
      id: number
      username: string
      firstName: string
      lastName: string
    }
  }>
}



const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)
  
  // Neue States für Bearbeiter-Aktionen
  const [selectedAction, setSelectedAction] = useState<'rückfrage' | 'weiterleiten' | 'entscheiden' | 'kommentieren' | null>(null)
  const [rückfrageText, setRückfrageText] = useState('')
  const [selectedStaffGroup, setSelectedStaffGroup] = useState('')
  const [weiterleitungsKommentar, setWeiterleitungsKommentar] = useState('')
  const [kommentarText, setKommentarText] = useState('')
  const [savingComment, setSavingComment] = useState(false)
  const [staffGroups, setStaffGroups] = useState<Array<{id: number, name: string, description?: string}>>([])
  const [loadingStaffGroups, setLoadingStaffGroups] = useState(false)
  const [forwardingService, setForwardingService] = useState(false)

  useEffect(() => {
    if (id) {
      fetchServiceDetails()
    }
  }, [id])

  // Staff-Gruppen laden wenn Weiterleiten ausgewählt wird
  useEffect(() => {
    if (selectedAction === 'weiterleiten') {
      fetchStaffGroups()
    }
  }, [selectedAction])

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/services/${id}`)
      setService(response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Service-Details:', error)
      setService(null)
    } finally {
      setLoading(false)
    }
  }





  const handleStatusChange = async () => {
    if (!newStatus || !statusReason.trim()) return

    try {
      await api.patch(`/services/${id}/status`, { 
        status: newStatus,
        reason: statusReason
      })
      
      // Kommentar hinzufügen
      await api.post(`/services/${id}/comments`, {
        content: `Status geändert zu "${getStatusText(newStatus)}". Grund: ${statusReason}`
      })

      setShowStatusModal(false)
      setNewStatus('')
      setStatusReason('')
      fetchServiceDetails()
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error)
    }
  }

  const handleSaveComment = async () => {
    if (!kommentarText.trim()) return

    setSavingComment(true)
    try {
      await api.post(`/services/${id}/comments`, {
        content: kommentarText
      })

      // Kommentar erfolgreich gespeichert
      setKommentarText('')
      setSelectedAction(null) // Aktions-Auswahl zurücksetzen
      fetchServiceDetails() // Aktivitätsverlauf aktualisieren
    } catch (error) {
      console.error('Fehler beim Speichern des Kommentars:', error)
    } finally {
      setSavingComment(false)
    }
  }

  const fetchStaffGroups = async () => {
    setLoadingStaffGroups(true)
    try {
      const response = await api.get('/services/staff-groups')
      setStaffGroups(response.data.groups || [])
    } catch (error) {
      console.error('Fehler beim Laden der Staff-Gruppen:', error)
    } finally {
      setLoadingStaffGroups(false)
    }
  }

  const handleForwardService = async () => {
    if (!selectedStaffGroup || !weiterleitungsKommentar.trim()) return

    setForwardingService(true)
    try {
      await api.post(`/services/${id}/forward`, {
        groupId: parseInt(selectedStaffGroup),
        comment: weiterleitungsKommentar
      })

      // Weiterleitung erfolgreich
      setSelectedStaffGroup('')
      setWeiterleitungsKommentar('')
      setSelectedAction(null) // Aktions-Auswahl zurücksetzen
      fetchServiceDetails() // Aktivitätsverlauf aktualisieren
    } catch (error) {
      console.error('Fehler beim Weiterleiten des Services:', error)
    } finally {
      setForwardingService(false)
    }
  }

  const handleSendInquiry = async () => {
    if (!rückfrageText.trim()) return

    try {
      await api.post(`/services/${id}/inquiries`, {
        content: rückfrageText
      })

      // Rückfrage erfolgreich gespeichert
      setRückfrageText('')
      setSelectedAction(null) // Aktions-Auswahl zurücksetzen
      fetchServiceDetails() // Aktivitätsverlauf aktualisieren
    } catch (error) {
      console.error('Fehler beim Senden der Rückfrage:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'IN_PROGRESS':
        return <AlertCircle className="w-5 h-5 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Ausstehend'
      case 'IN_PROGRESS':
        return 'In Bearbeitung'
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

  const getActionText = (action: string) => {
    switch (action) {
      case 'created':
        return 'Antrag gestellt'
      case 'comment':
        return 'Kommentar'
      case 'inquiry':
        return 'Rückfrage an Insassen'
      case 'answer':
        return 'Antwort des Insassen'
      case 'forward':
        return 'Weiterleitung'
      case 'workflow_transition':
        return 'Status-Änderung'
      case 'decision_made':
        return 'Entscheidung'
      case 'status_and_decision_updated':
        return 'Status und Entscheidung aktualisiert'
      case 'returned':
        return 'Antrag zurückgewiesen'
      default:
        return action
    }
  }

  const getDecisionText = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return 'Genehmigt'
      case 'REJECTED':
        return 'Abgelehnt'
      case 'RETURNED':
        return 'Zurückgewiesen'
      default:
        return decision
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!service) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Service nicht gefunden</h2>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-primary"
        >
          Zurück
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{service.title}</h1>
            <p className="text-gray-600 mt-1">Antrag #{service.id}</p>
          </div>
        </div>
        {(user?.groups?.some(g => g.name.includes('PS General Enforcement Service') || g.name.includes('PS Vollzugsabteilungsleitung') || g.name.includes('PS Vollzugsleitung') || g.name.includes('PS Anstaltsleitung') || g.name.includes('PS Payments Office') || g.name.includes('PS Medical Staff') || g.name === 'PS Designers')) && (
          <button
            onClick={() => setShowStatusModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Status ändern</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hauptinhalt */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Antragsdetails</h2>
              <div className="flex items-center space-x-2">
                {getStatusIcon(service.status)}
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(service.status)}`}>
                  {getStatusText(service.status)}
                </span>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(service.priority)}`}>
                  {service.priority === 'LOW' && 'Niedrig'}
                  {service.priority === 'MEDIUM' && 'Mittel'}
                  {service.priority === 'HIGH' && 'Hoch'}
                  {service.priority === 'URGENT' && 'Dringend'}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Beschreibung</h3>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {service.description}
                </p>
              </div>
              
                             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <h3 className="text-sm font-medium text-gray-700 mb-1">Antragsteller</h3>
                   <p className="text-gray-900 flex items-center space-x-1">
                     <User className="w-4 h-4" />
                     <span>{service.createdByUser.firstName} {service.createdByUser.lastName}</span>
                   </p>
                 </div>
                 <div>
                   <h3 className="text-sm font-medium text-gray-700 mb-1">Erstellt am</h3>
                   <p className="text-gray-900 flex items-center space-x-1">
                     <Calendar className="w-4 h-4" />
                     <span>{formatDate(service.createdAt)}</span>
                   </p>
                 </div>
                 {service.assignedToUser && (
                   <div>
                     <h3 className="text-sm font-medium text-gray-700 mb-1">Zugewiesen an</h3>
                     <p className="text-gray-900 flex items-center space-x-1">
                       <User className="w-4 h-4" />
                       <span>{service.assignedToUser.firstName} {service.assignedToUser.lastName}</span>
                     </p>
                   </div>
                 )}
                 {service.assignedToGroupRef && (
                   <div>
                     <h3 className="text-sm font-medium text-gray-700 mb-1">Zugewiesen an Gruppe</h3>
                     <p className="text-gray-900 flex items-center space-x-1">
                       <User className="w-4 h-4" />
                       <span>{service.assignedToGroupRef.description || service.assignedToGroupRef.name}</span>
                     </p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Bearbeiter-Aktionen */}
          {(user?.groups?.some(g => g.name.includes('PS General Enforcement Service') || g.name.includes('PS Vollzugsabteilungsleitung') || g.name.includes('PS Vollzugsleitung') || g.name.includes('PS Anstaltsleitung') || g.name.includes('PS Payments Office') || g.name.includes('PS Medical Staff') || g.name === 'PS Designers')) && (
                         <div className="bg-white rounded-lg shadow p-6">
               <h2 className="text-xl font-semibold text-gray-900 mb-4">Sie haben folgende Auswahlmöglichkeiten:</h2>
              
                             {/* Aktions-Buttons */}
               <div className="flex space-x-4 mb-6">
                 <button
                   onClick={() => setSelectedAction('rückfrage')}
                   className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                     selectedAction === 'rückfrage'
                       ? 'border-blue-500 bg-blue-50 text-blue-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   Rückfrage an Insasse
                 </button>
                 <button
                   onClick={() => setSelectedAction('weiterleiten')}
                   className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                     selectedAction === 'weiterleiten'
                       ? 'border-blue-500 bg-blue-50 text-blue-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   Weiterleiten
                 </button>
                 <button
                   onClick={() => setSelectedAction('entscheiden')}
                   className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                     selectedAction === 'entscheiden'
                       ? 'border-blue-500 bg-blue-50 text-blue-700'
                       : 'border-gray-300 hover:border-gray-400'
                   }`}
                 >
                   Entscheiden
                 </button>
                                   <button
                    onClick={() => setSelectedAction('kommentieren')}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      selectedAction === 'kommentieren'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Kommentar erstellen
                  </button>
               </div>

              {/* Rückfrage an Insasse */}
              {selectedAction === 'rückfrage' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Welche Rückfrage möchten Sie an den Insassen stellen?
                  </h3>
                  <div className="flex space-x-3">
                    <textarea
                      value={rückfrageText}
                      onChange={(e) => setRückfrageText(e.target.value)}
                      placeholder="Ihre Rückfrage..."
                      className="flex-1 input resize-none"
                      rows={4}
                    />
                                         <button
                       onClick={handleSendInquiry}
                       className="btn btn-primary self-end"
                       disabled={!rückfrageText.trim()}
                     >
                       Rückfrage absenden
                     </button>
                  </div>
                </div>
              )}

                             {/* Weiterleiten */}
               {selectedAction === 'weiterleiten' && (
                 <div className="space-y-4">
                   <div className="flex items-center space-x-3">
                     <h3 className="text-lg font-medium text-gray-900">
                       An wen möchten Sie den Antrag weiterleiten?
                     </h3>
                     <select
                       value={selectedStaffGroup}
                       onChange={(e) => setSelectedStaffGroup(e.target.value)}
                       className="input"
                       disabled={loadingStaffGroups}
                     >
                       <option value="">
                         {loadingStaffGroups ? 'Lade Gruppen...' : 'Staff-Gruppe auswählen'}
                       </option>
                       {staffGroups.map((group) => (
                         <option key={group.id} value={group.id}>
                           {group.description || group.name}
                         </option>
                       ))}
                     </select>
                   </div>
                   
                   <div className="space-y-2">
                     <h4 className="text-sm font-medium text-gray-700">
                       Ihr Bearbeitungskommentar und Hinweis für den nächsten Bearbeiter
                     </h4>
                     <div className="flex space-x-3">
                       <textarea
                         value={weiterleitungsKommentar}
                         onChange={(e) => setWeiterleitungsKommentar(e.target.value)}
                         placeholder="Ihr Kommentar..."
                         className="flex-1 input resize-none"
                         rows={4}
                       />
                       <button
                         onClick={handleForwardService}
                         className="btn btn-primary self-end"
                         disabled={!selectedStaffGroup || !weiterleitungsKommentar.trim() || forwardingService}
                       >
                         {forwardingService ? 'Weiterleiten...' : 'Absenden'}
                       </button>
                     </div>
                   </div>
                 </div>
               )}

                             {/* Entscheiden */}
               {selectedAction === 'entscheiden' && (
                 <div className="text-center py-8">
                   <p className="text-gray-600">Entscheidungsfunktion wird später implementiert...</p>
                 </div>
               )}

               {/* Kommentieren */}
               {selectedAction === 'kommentieren' && (
                 <div className="space-y-4">
                   <h3 className="text-lg font-medium text-gray-900">
                     Geben Sie einen Kommentar zum Antrag ein
                   </h3>
                   <div className="flex space-x-3">
                     <textarea
                       value={kommentarText}
                       onChange={(e) => setKommentarText(e.target.value)}
                       placeholder="Ihr Kommentar..."
                       className="flex-1 input resize-none"
                       rows={4}
                     />
                     <button
                       onClick={handleSaveComment}
                       className="btn btn-primary self-end"
                       disabled={!kommentarText.trim() || savingComment}
                     >
                       {savingComment ? 'Speichern...' : 'Kommentar speichern'}
                     </button>
                   </div>
                 </div>
               )}
             </div>
           )}

          
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Aktivitätsverlauf */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Antragsverlauf</span>
            </h2>
            
                         <div className="space-y-0">
                              {service.activities.map((activity, index) => (
                 <div key={activity.id}>
                   <div className="flex items-start space-x-3 py-4">
                     <div className="flex-1">
                       <div className="flex items-center space-x-2 mb-1">
                         <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                           {getActionText(activity.action)}
                         </span>
                       </div>
                       <p className="text-sm text-gray-900">{activity.details}</p>
                       <div className="flex items-center space-x-2 mt-1">
                         <span className="text-xs text-gray-500">{activity.who}</span>
                         <span className="text-xs text-gray-400">•</span>
                         <span className="text-xs text-gray-500">{formatDate(activity.when)}</span>
                       </div>
                     </div>
                   </div>
                   {index < service.activities.length - 1 && (
                     <div className="border-t border-gray-200"></div>
                   )}
                 </div>
               ))}
            </div>
          </div>

          
        </div>
      </div>

      {/* Status-Änderung Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Status ändern
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Neuer Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Status auswählen</option>
                  <option value="PENDING">Ausstehend</option>
                  <option value="IN_PROGRESS">In Bearbeitung</option>
                  <option value="COMPLETED">Abgeschlossen</option>
                  <option value="REJECTED">Abgelehnt</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Begründung
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Grund für die Status-Änderung..."
                  className="input w-full resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowStatusModal(false)
                  setNewStatus('')
                  setStatusReason('')
                }}
                className="btn btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!newStatus || !statusReason.trim()}
                className="btn btn-primary flex-1"
              >
                Status ändern
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ServiceDetail
