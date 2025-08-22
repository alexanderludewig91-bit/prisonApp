import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  User,
  Calendar,
  Edit,
  Send,
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

interface Comment {
  id: number
  content: string
  createdAt: string
  user: {
    id: number
    username: string
    firstName: string
    lastName: string
  }
}

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [service, setService] = useState<Service | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [newStatus, setNewStatus] = useState('')
  const [statusReason, setStatusReason] = useState('')
  const [showStatusModal, setShowStatusModal] = useState(false)

  useEffect(() => {
    if (id) {
      fetchServiceDetails()
      fetchComments()
    }
  }, [id])

  const fetchServiceDetails = async () => {
    try {
      const response = await api.get(`/services/${id}`)
      setService(response.data)
    } catch (error) {
      console.error('Fehler beim Laden der Service-Details:', error)
      // Fallback zu Mock-Daten
      setService({
        id: 1,
        title: 'Antrag auf Besuchserlaubnis',
        description: 'Ich möchte meine Familie besuchen dürfen. Meine Tochter hat Geburtstag und ich würde gerne dabei sein.',
        status: 'PENDING',
        priority: 'MEDIUM',
        createdAt: '2024-12-15T10:30:00Z',
        updatedAt: '2024-12-15T10:30:00Z',
        createdByUser: {
          id: 1,
          username: 'inmate001',
          firstName: 'Max',
          lastName: 'Mustermann'
        },
        activities: [
          {
            id: 1,
            action: 'created',
            details: 'Antrag erstellt',
            when: '2024-12-15T10:30:00Z',
            who: 'inmate001'
          }
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const response = await api.get(`/services/${id}/comments`)
      // Kommentare aus Activity-Format in Comment-Format konvertieren
      const commentsData = response.data.comments || []
      const convertedComments = commentsData.map((activity: any) => ({
        id: activity.id,
        content: activity.details,
        createdAt: activity.when,
        user: activity.user || {
          id: 0,
          username: activity.who,
          firstName: activity.who,
          lastName: ''
        }
      }))
      setComments(convertedComments)
    } catch (error) {
      console.error('Fehler beim Laden der Kommentare:', error)
      // Fallback zu Mock-Kommentaren
      setComments([
        {
          id: 1,
          content: 'Antrag wird geprüft. Dokumente sind vollständig.',
          createdAt: '2024-12-15T11:00:00Z',
          user: {
            id: 2,
            username: 'staff001',
            firstName: 'Maria',
            lastName: 'Müller'
          }
        }
      ])
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const response = await api.post(`/services/${id}/comments`, {
        content: newComment
      })
      // Neuen Kommentar in das richtige Format konvertieren
      const newCommentData = {
        id: response.data.comment.id,
        content: response.data.comment.details,
        createdAt: response.data.comment.when,
        user: response.data.comment.user || {
          id: 0,
          username: response.data.comment.who,
          firstName: response.data.comment.who,
          lastName: ''
        }
      }
      setComments([newCommentData, ...comments])
      setNewComment('')
    } catch (error) {
      console.error('Fehler beim Hinzufügen des Kommentars:', error)
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
      fetchComments()
    } catch (error) {
      console.error('Fehler beim Ändern des Status:', error)
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
               </div>
            </div>
          </div>

          {/* Kommentare */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>Kommentare ({comments.length})</span>
            </h2>
            
            <div className="space-y-4 mb-6">
              {comments.map((comment) => (
                <div key={comment.id} className="border-l-4 border-primary-500 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">
                        {comment.user.firstName} {comment.user.lastName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>

            {(user?.groups?.some(g => g.name.includes('PS General Enforcement Service') || g.name.includes('PS Vollzugsabteilungsleitung') || g.name.includes('PS Vollzugsleitung') || g.name.includes('PS Anstaltsleitung') || g.name.includes('PS Payments Office') || g.name.includes('PS Medical Staff') || g.name === 'PS Designers')) && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Neuer Kommentar</h3>
                <div className="flex space-x-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Kommentar hinzufügen..."
                    className="flex-1 input resize-none"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="btn btn-primary flex items-center space-x-2 self-end"
                  >
                    <Send className="w-4 h-4" />
                    <span>Senden</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Aktivitätsverlauf */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Aktivitätsverlauf</span>
            </h2>
            
            <div className="space-y-4">
              {service.activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.details}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs text-gray-500">{activity.who}</span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">{formatDate(activity.when)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schnellaktionen */}
          {(user?.groups?.some(g => g.name.includes('PS General Enforcement Service') || g.name.includes('PS Vollzugsabteilungsleitung') || g.name.includes('PS Vollzugsleitung') || g.name.includes('PS Anstaltsleitung') || g.name.includes('PS Payments Office') || g.name.includes('PS Medical Staff') || g.name === 'PS Designers')) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Schnellaktionen</h2>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setNewStatus('IN_PROGRESS')
                    setStatusReason('Antrag wird bearbeitet')
                    setShowStatusModal(true)
                  }}
                  className="w-full btn btn-secondary text-left"
                >
                  In Bearbeitung setzen
                </button>
                <button
                  onClick={() => {
                    setNewStatus('COMPLETED')
                    setStatusReason('Antrag genehmigt')
                    setShowStatusModal(true)
                  }}
                  className="w-full btn btn-secondary text-left"
                >
                  Genehmigen
                </button>
                <button
                  onClick={() => {
                    setNewStatus('REJECTED')
                    setStatusReason('')
                    setShowStatusModal(true)
                  }}
                  className="w-full btn btn-secondary text-left"
                >
                  Ablehnen
                </button>
              </div>
            </div>
          )}
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
