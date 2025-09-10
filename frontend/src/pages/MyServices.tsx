import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle, XCircle, MessageSquare, Plus } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'
import NewServiceModal from '../components/NewServiceModal'

interface Service {
  id: number
  title: string
  description: string
  status: string
  priority: string
  createdAt: string
  updatedAt: string
  decision?: string
  decisionReason?: string
  serviceType?: string
  createdByUser?: {
    firstName: string
    lastName: string
    username: string
  }
  activities?: Array<{
    id: number
    action: string
    details: string
    when: string
    who: string
  }>
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
  const { t } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [completedServices, setCompletedServices] = useState<Service[]>([])
  const [servicesWithInquiries, setServicesWithInquiries] = useState<ServiceWithInquiries[]>([])
  const [servicesWithInformation, setServicesWithInformation] = useState<ServiceWithInformation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<ServiceWithInquiries | null>(null)
  const [inquiryResponse, setInquiryResponse] = useState('')
  const [showInquiryModal, setShowInquiryModal] = useState(false)
  const [sendingResponse, setSendingResponse] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [showNewServiceModal, setShowNewServiceModal] = useState(false)
  const [newServiceTitle, setNewServiceTitle] = useState('')
  const [newServiceDescription, setNewServiceDescription] = useState('')
  const [newServiceType, setNewServiceType] = useState('FREETEXT')
  const [submittingNewService, setSubmittingNewService] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

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
        
        // Anträge nach Status filtern
        const allServices = servicesResponse.data.services || []
        
        // Offene Anträge (Ausstehend und In Bearbeitung)
        const filteredServices = allServices.filter((service: Service) => 
          service.status === 'PENDING' || service.status === 'IN_PROGRESS'
        )
        setServices(filteredServices)
        
        // Abgeschlossene Anträge (Abgeschlossen und Abgelehnt)
        const filteredCompletedServices = allServices.filter((service: Service) => 
          service.status === 'COMPLETED' || service.status === 'REJECTED'
        )
        setCompletedServices(filteredCompletedServices)

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

  const handleServiceClick = (service: Service) => {
    setSelectedService(service)
    setShowServiceModal(true)
  }



  const handleNewServiceClick = () => {
    setShowNewServiceModal(true)
    setNewServiceTitle('')
    setNewServiceDescription('')
    setNewServiceType('FREETEXT')
  }

  const handleSubmitNewService = async () => {
    if (!newServiceTitle.trim() || !newServiceDescription.trim()) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    setSubmittingNewService(true)
    try {
      const serviceData = {
        title: newServiceTitle.trim(),
        description: newServiceDescription.trim(),
        serviceType: newServiceType
      }

      console.log('Sende neuen Antrag:', serviceData)
      const response = await api.post('/services/my/services', serviceData)
      console.log('Antrag erfolgreich erstellt:', response.data)

      // Modal schließen und Daten zurücksetzen
      setShowNewServiceModal(false)
      setNewServiceTitle('')
      setNewServiceDescription('')
      setNewServiceType('FREETEXT')

      // Anträge neu laden
      const servicesResponse = await api.get('/services/my/services')
      const allServices = servicesResponse.data.services || []
      
      const openServices = allServices.filter((service: Service) => 
        service.status === 'PENDING' || service.status === 'IN_PROGRESS'
      )
      const completedServices = allServices.filter((service: Service) => 
        service.status === 'COMPLETED'
      )
      
      setServices(openServices)
      setCompletedServices(completedServices)

      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000) // Nach 5 Sekunden ausblenden
    } catch (error) {
      console.error('Fehler beim Erstellen des Antrags:', error)
      // Fehlermeldung wird über den Button-Status angezeigt (disabled state)
    } finally {
      setSubmittingNewService(false)
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
        return t('status.pending')
      case 'IN_PROGRESS':
        return t('status.inProgress')
      case 'COMPLETED':
        return t('status.completed')
      case 'REJECTED':
        return t('status.rejected')
      default:
        return status
    }
  }



  const getDecisionText = (decision: string) => {
    switch (decision) {
      case 'APPROVED':
        return t('status.approved')
      case 'REJECTED':
        return t('status.rejected')
      case 'RETURNED':
        return t('status.returned')
      case 'PENDING':
        return t('status.pending')
      default:
        return decision
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('messages.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('pages.myServices.title')} {user?.firstName} {user?.lastName}
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleNewServiceClick}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#060E5D] hover:bg-[#050B4A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#060E5D]/40 shadow-sm"
          >
            <Plus className="h-5 w-5 mr-2" />
            {t('pages.myServices.newRequest')}
          </button>
          <button
            onClick={() => window.location.href = '/all-my-services'}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#060E5D] hover:bg-[#050B4A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#060E5D]/40 shadow-sm"
          >
            <Clock className="h-5 w-5 mr-2" />
            {t('pages.myServices.allRequests')}
          </button>
        </div>
      </div>

      {/* Informationen und Rückfragen in zwei Spalten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informationen zu Anträgen */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-500" />
              <span>
                {servicesWithInformation.length > 0 
                  ? `${t('pages.myServices.newInformation')} (${servicesWithInformation.length})`
                  : t('pages.myServices.noNewInformation')
                }
              </span>
            </h2>
          </div>
          {servicesWithInformation.length > 0 && (
            <div className="divide-y divide-gray-200">
              {servicesWithInformation.map((service) => (
                <div 
                  key={service.id} 
                  className="px-6 py-4 bg-white border-t border-gray-100 rounded-md transition-all duration-150 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-500/10 motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-green-500" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {t('pages.myServices.informationForRequest')} "{service.title}"
                        </h3>
                        <p className="text-sm text-gray-600">
                          {service.activities[0]?.details}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('pages.myServices.informationReceived')} {new Date(service.activities[0]?.when || '').toLocaleDateString(t('pages.myServices.dateFormat'))}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rückfragen zu Anträgen */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span>
                {servicesWithInquiries.length > 0 
                  ? `${t('pages.myServices.newInquiries')} (${servicesWithInquiries.length})`
                  : t('pages.myServices.noNewInquiries')
                }
              </span>
            </h2>
          </div>
          {servicesWithInquiries.length > 0 && (
            <div className="divide-y divide-gray-200">
              {servicesWithInquiries.map((service) => (
                <div 
                  key={service.id} 
                  className="px-6 py-4 bg-white border-t border-gray-100 rounded-md transition-all duration-150 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-500/10 motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer"
                  onClick={() => handleInquiryClick(service)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {t('pages.myServices.inquiryForRequest')} "{service.title}"
                        </h3>
                        <p className="text-sm text-gray-600">
                          {service.activities[0]?.details}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('pages.myServices.inquiryReceived')} {new Date(service.activities[0]?.when || '').toLocaleDateString(t('pages.myServices.dateFormat'))}
                        </p>
                      </div>
                    </div>
                    <div className="text-blue-600">
                      <span className="text-sm">{t('pages.myServices.reply')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Anträge in zwei Spalten */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Offene Anträge */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('pages.myServices.recentRequests')}
            </h2>
          </div>
          {services.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('pages.myServices.noOpenRequests')}
              </h3>
              <p className="text-gray-600 mb-4">
                {t('pages.myServices.noOpenRequestsDescription')}
              </p>
              <button
                onClick={handleNewServiceClick}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#060E5D] hover:bg-[#050B4A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#060E5D]/40"
              >
{t('pages.myServices.newRequest')}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {services.slice(0, 5).map((service) => (
                <div 
                  key={service.id} 
                  className="px-6 py-4 bg-white border-t border-gray-100 rounded-md transition-all duration-150 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-500/10 motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {service.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('pages.myServices.submittedOn')} {new Date(service.createdAt).toLocaleDateString(t('pages.myServices.dateFormat'))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

        {/* Abgeschlossene Anträge */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('pages.myServices.recentCompletedRequests')}
            </h2>
          </div>
          {completedServices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('pages.myServices.noCompletedRequests')}
              </h3>
              <p className="text-gray-600">
                {t('pages.myServices.noCompletedRequestsDescription')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {completedServices.slice(0, 5).map((service) => (
                <div 
                  key={service.id} 
                  className="px-6 py-4 bg-white border-t border-gray-100 rounded-md transition-all duration-150 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-500/10 motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer"
                  onClick={() => handleServiceClick(service)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(service.status)}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900">
                          {service.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {t('pages.myServices.submittedOn')} {new Date(service.createdAt).toLocaleDateString(t('pages.myServices.dateFormat'))}
                        </p>
                        {service.decision && (
                          <p className="text-sm text-gray-700 mt-1">
                            <span className="font-medium">Entscheidung:</span> {getDecisionText(service.decision)}
                          </p>
                        )}

                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {getStatusText(service.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

            </div>
          )}
        </div>
      </div>

      {/* Antragsdetails-Modal */}
      {showServiceModal && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedService.serviceType === 'FREETEXT' ? 'Sonstiges Anliegen' : 'Antragsdetails'}
            </h3>
            
            <div className="space-y-6">
              {/* Antragsteller-Informationen */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Antragsteller-Informationen
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <p className="text-gray-900 mt-1">
                      {selectedService.createdByUser?.firstName} {selectedService.createdByUser?.lastName}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Buchnummer:</span>
                    <p className="text-gray-900 mt-1">{selectedService.createdByUser?.username}</p>
                  </div>
                </div>
              </div>

              {/* Antragsdetails */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                  Antragsdetails
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Antragsdatum:</span>
                    <p className="text-gray-900 mt-1">
                      {new Date(selectedService.createdAt).toLocaleDateString(t('pages.myServices.dateFormat'))} um {new Date(selectedService.createdAt).toLocaleTimeString(t('pages.myServices.timeFormat'))}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Status:</span>
                    <p className="text-gray-900 mt-1">{getStatusText(selectedService.status)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Titel:</span>
                    <p className="text-gray-900 mt-1">{selectedService.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Beschreibung:</span>
                    <p className="text-gray-900 mt-1 leading-relaxed">{selectedService.description}</p>
                  </div>
                </div>
              </div>

              {/* Rückfragen und Antworten (falls vorhanden) */}
              {(() => {
                if (selectedService.activities && selectedService.activities.length > 0) {
                  // Alle Rückfrage-bezogenen Activities finden und chronologisch sortieren (älteste zuerst)
                  const inquiryActivities = selectedService.activities
                    .filter(activity => 
                      activity.action === 'inquiry' || 
                      activity.action === 'answer' ||
                      activity.action === 'information'
                    )
                    .sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime());

                  if (inquiryActivities.length > 0) {
                    return (
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                          Zusätzliche Informationen
                        </h4>
                        <div className="space-y-2">
                          {inquiryActivities.map((activity, index) => (
                            <div key={index} className="py-1">
                              <h5 className="text-sm font-medium text-gray-600 mb-2">
                                {activity.action === 'inquiry' ? 'Rückfrage' :
                                 activity.action === 'answer' ? 'Antwort' :
                                 activity.action === 'information' ? 'Information' : 'Nachricht'} von {activity.who.split(' (')[0]} vom {new Date(activity.when).toLocaleDateString(t('pages.myServices.dateFormat'))} um {new Date(activity.when).toLocaleTimeString(t('pages.myServices.timeFormat'))}
                              </h5>
                              <p className="text-gray-900 leading-relaxed">{activity.details}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                }
                return null;
              })()}

              {/* Entscheidung und Begründung (nur bei abgeschlossenen Anträgen) */}
              {selectedService.decision && selectedService.status === 'COMPLETED' && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                    Entscheidung
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Entscheidung:</span>
                      <p className="text-gray-900 mt-1">{getDecisionText(selectedService.decision)}</p>
                    </div>
                    {selectedService.decisionReason && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Begründung:</span>
                        <p className="text-gray-900 mt-1">{selectedService.decisionReason}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowServiceModal(false)
                  setSelectedService(null)
                }}
                className="btn btn-secondary"
              >
                Schließen
              </button>
            </div>
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
                  Gestellt von: {selectedInquiry.activities[0]?.who} am {new Date(selectedInquiry.activities[0]?.when || '').toLocaleDateString(t('pages.myServices.dateFormat'))}
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

      {/* Erfolgsmeldung */}
      {showSuccessMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-green-500 text-white px-8 py-4 rounded-lg shadow-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6" />
              <span className="text-lg font-medium">Ihr Antrag wurde erfolgreich eingereicht!</span>
            </div>
          </div>
        </div>
      )}

      {/* Neuer Antrag Modal mit KI-Integration */}
      <NewServiceModal
        isOpen={showNewServiceModal}
        onClose={() => {
          setShowNewServiceModal(false)
          setNewServiceTitle('')
          setNewServiceDescription('')
          setNewServiceType('FREETEXT')
        }}
        onSubmit={async (title, description, titleInmate, descriptionInmate) => {
          setNewServiceTitle(title)
          setNewServiceDescription(description)
          setSubmittingNewService(true)
          
          try {
            const serviceData = {
              title: title.trim(),
              titleInmate: titleInmate?.trim() || null,
              description: description.trim(),
              descriptionInmate: descriptionInmate?.trim() || null,
              serviceType: newServiceType
            }

            console.log('Sende neuen Antrag:', serviceData)
            const response = await api.post('/services/my/services', serviceData)
            console.log('Antrag erfolgreich erstellt:', response.data)

            // Modal schließen und Daten zurücksetzen
            setShowNewServiceModal(false)
            setNewServiceTitle('')
            setNewServiceDescription('')
            setNewServiceType('FREETEXT')

            // Anträge neu laden
            const servicesResponse = await api.get('/services/my/services')
            const allServices = servicesResponse.data.services || []
            
            const openServices = allServices.filter((service: Service) => 
              service.status === 'PENDING' || service.status === 'IN_PROGRESS'
            )
            const completedServices = allServices.filter((service: Service) => 
              service.status === 'COMPLETED'
            )
            
            setServices(openServices)
            setCompletedServices(completedServices)

            setShowSuccessMessage(true)
            setTimeout(() => setShowSuccessMessage(false), 5000)
          } catch (error) {
            console.error('Fehler beim Erstellen des Antrags:', error)
          } finally {
            setSubmittingNewService(false)
          }
        }}
        isSubmitting={submittingNewService}
      />
    </div>
  )
}

export default MyServices
