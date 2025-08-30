import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'
import { Navigate } from 'react-router-dom'
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
}

interface ServiceWithInquiries {
  id: number
  title: string
  description: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  activities: Array<{
    id: number
    action: string
    details: string
    when: string
    who: string
  }>
}

interface ServiceWithInformation {
  id: number
  title: string
  description: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  activities: Array<{
    id: number
    action: string
    details: string
    when: string
    who: string
  }>
}

const MyServices = () => {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [servicesWithInquiries, setServicesWithInquiries] = useState<ServiceWithInquiries[]>([])
  const [servicesWithInformation, setServicesWithInformation] = useState<ServiceWithInformation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceWithInquiries | null>(null)
  const [inquiryResponse, setInquiryResponse] = useState('')
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [sendingResponse, setSendingResponse] = useState(false)

  // Prüfe ob Benutzer ein Insasse ist
  const userGroups = user?.groups?.map(g => g.name) || []
  const isInmate = userGroups.some(group => group === 'PS Inmates')
  
  // Wenn nicht Insasse, zur Login-Seite weiterleiten
  if (!isInmate) {
    return <Navigate to="/login" replace />
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Lade Daten für Benutzer:', user?.id, user?.username)
        
        // Anträge laden
        const servicesResponse = await api.get('/services/my/services')
        console.log('Anträge geladen:', servicesResponse.data)
        setServices(servicesResponse.data.services || [])

        // Rückfragen laden
        if (user?.id) {
          console.log('Lade Rückfragen für Benutzer:', user.id)
          const inquiriesResponse = await api.get(`/services/inquiries/${user.id}`)
          console.log('Rückfragen geladen:', inquiriesResponse.data)
          setServicesWithInquiries(inquiriesResponse.data.services || [])
          
          // Informationen laden
          console.log('Lade Informationen für Benutzer:', user.id)
          const informationResponse = await api.get(`/services/information/${user.id}`)
          console.log('Informationen geladen:', informationResponse.data)
          setServicesWithInformation(informationResponse.data.services || [])
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error)
        setServices([])
        setServicesWithInquiries([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleInquiryClick = (service: ServiceWithInquiries) => {
    setSelectedInquiry(service)
    setInquiryResponse('')
    setShowInquiryModal(true)
  }

  const handleSendResponse = async () => {
    if (!selectedInquiry || !inquiryResponse.trim()) return

    setSendingResponse(true)
    try {
      // Antwort über die neue API-Route senden
      await api.post(`/services/${selectedInquiry.id}/answers`, {
        content: inquiryResponse
      })

      setShowInquiryModal(false)
      setSelectedInquiry(null)
      setInquiryResponse('')
      
      // Daten neu laden
      if (user?.id) {
        const inquiriesResponse = await api.get(`/services/inquiries/${user.id}`)
        setServicesWithInquiries(inquiriesResponse.data.services || [])
      }
    } catch (error) {
      console.error('Fehler beim Senden der Antwort:', error)
    } finally {
      setSendingResponse(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'IN_PROGRESS':
        return <Clock className="h-5 w-5 text-blue-500" />
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
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
      case 'HIGH':
        return 'bg-orange-100 text-orange-800'
      case 'URGENT':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Meine Anträge
        </h1>
        <p className="text-gray-600">
          Hier sehen Sie alle Ihre eingereichten Anträge und deren Status.
        </p>
      </div>

      {/* Informationen zu Anträgen */}
      {servicesWithInformation.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-500" />
              <span>Informationen zu Anträgen ({servicesWithInformation.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {servicesWithInformation.map((service) => (
              <div 
                key={service.id} 
                className="px-6 py-4 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-green-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Information zum Antrag "{service.title}"
                      </h3>
                      <p className="text-sm text-gray-600">
                        {service.activities[0]?.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Information erhalten am {new Date(service.activities[0]?.when || '').toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rückfragen zu Anträgen */}
      {servicesWithInquiries.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span>Rückfragen zu Anträgen ({servicesWithInquiries.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {servicesWithInquiries.map((service) => (
              <div 
                key={service.id} 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleInquiryClick(service)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageSquare className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Rückfrage zum Antrag "{service.title}"
                      </h3>
                      <p className="text-sm text-gray-600">
                        {service.activities[0]?.details}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Rückfrage gestellt am {new Date(service.activities[0]?.when || '').toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className="text-blue-600">
                    <span className="text-sm">Antworten</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meine Anträge */}
      {services.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Keine Anträge vorhanden
          </h3>
          <p className="text-gray-600 mb-4">
            Sie haben noch keine Anträge eingereicht.
          </p>
          <a
            href="/new-service"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Neuen Antrag erstellen
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Ihre Anträge ({services.length})
            </h2>
          </div>
          <div className="divide-y divide-gray-200">
            {services.map((service) => (
              <div key={service.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(service.status)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {service.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {service.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Eingereicht am {new Date(service.createdAt).toLocaleDateString('de-DE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {service.priority && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(service.priority)}`}>
                        {service.priority === 'HIGH' && 'Hohe Priorität'}
                        {service.priority === 'URGENT' && 'Höchste Priorität'}
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getStatusText(service.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rückfrage-Modal */}
      {showInquiryModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Rückfrage zum Antrag "{selectedInquiry.title}"
            </h3>
            
            <div className="space-y-4">
              {/* Antragsdetails */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Ihr Antrag:</h4>
                <p className="text-gray-900">{selectedInquiry.description}</p>
              </div>

              {/* Rückfrage */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-700 mb-2">Rückfrage:</h4>
                <p className="text-blue-900">{selectedInquiry.activities[0]?.details}</p>
                <p className="text-xs text-blue-600 mt-2">
                  Gestellt von: {selectedInquiry.activities[0]?.who} am {new Date(selectedInquiry.activities[0]?.when || '').toLocaleDateString('de-DE')}
                </p>
              </div>

              {/* Antwort */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ihre Antwort:
                </label>
                <textarea
                  value={inquiryResponse}
                  onChange={(e) => setInquiryResponse(e.target.value)}
                  placeholder="Geben Sie hier Ihre Antwort auf die Rückfrage ein..."
                  className="w-full input resize-none"
                  rows={4}
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInquiryModal(false)
                  setSelectedInquiry(null)
                  setInquiryResponse('')
                }}
                className="btn btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                onClick={handleSendResponse}
                disabled={!inquiryResponse.trim() || sendingResponse}
                className="btn btn-primary flex-1"
              >
                {sendingResponse ? 'Senden...' : 'Antwort senden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyServices
