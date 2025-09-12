import { useState, useEffect } from 'react'
import { FileText, Clock, CheckCircle } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Service {
  id: number
  title: string
  titleInmate?: string
  description: string
  descriptionInmate?: string
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
    isActive: boolean
  }>
}



const AllMyServices = () => {
  const { user } = useAuth()
  const [services, setServices] = useState<Service[]>([])
  const [servicesWithInformation, setServicesWithInformation] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [sortField, setSortField] = useState<'id' | 'createdAt' | 'title' | 'status' | 'decision'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState<'all' | 'information'>('all')

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
        console.log('Lade alle Anträge für Benutzer:', user?.id, user?.username)
        
        // Alle Anträge laden
        const servicesResponse = await api.get('/services/my/services')
        console.log('Alle Anträge geladen:', servicesResponse.data)
        
        const allServices = servicesResponse.data.services || []
        setServices(allServices)

        // Informationen laden (alle, auch inaktive)
        if (user?.id) {
          console.log('Lade alle Informationen für Benutzer:', user.id)
          const informationResponse = await api.get(`/services/information/${user.id}/all`)
          console.log('Alle Informationen geladen:', informationResponse.data)
          setServicesWithInformation(informationResponse.data.services || [])
        }
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error)
        setServices([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id])

  const handleServiceClick = (service: Service) => {
    setSelectedService(service)
    setShowServiceModal(true)
  }

  const handleSort = (field: 'id' | 'createdAt' | 'title' | 'status' | 'decision') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
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
      default:
        return status
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
      case 'PENDING':
        return 'Ausstehend'
      default:
        return decision
    }
  }



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE') + ' um ' + new Date(dateString).toLocaleTimeString('de-DE')
  }

  // Gefilterte Services basierend auf aktivem Tab
  const filteredServices = activeTab === 'information' ? servicesWithInformation : services

  // Sortierte Services
  const sortedServices = [...filteredServices].sort((a, b) => {
    let aValue: any = a[sortField]
    let bValue: any = b[sortField]
    
    if (sortField === 'createdAt') {
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    } else if (sortField === 'id') {
      aValue = Number(aValue)
      bValue = Number(bValue)
    }
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laden...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Alle meine Anträge
            </h1>
            <p className="text-gray-600">
              Hier sehen Sie alle Ihre eingereichten Anträge und deren aktuellen Status.
            </p>
          </div>
          <button
            onClick={() => window.location.href = '/my-services'}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#060E5D] hover:bg-[#050B4A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#060E5D]/40"
          >
            Zurück zur Startseite
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'all'
                    ? 'border-[#060E5D] text-[#060E5D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Alle Anträge ({services.length})
              </button>
              <button
                onClick={() => setActiveTab('information')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'information'
                    ? 'border-[#060E5D] text-[#060E5D]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Informationen ({servicesWithInformation.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Anträge Tabelle */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'all' ? 'Alle Anträge' : 'Informationen'} ({sortedServices.length})
            </h2>
          </div>
          
          {sortedServices.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'all' ? 'Keine Anträge vorhanden' : 'Keine Informationen vorhanden'}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === 'all' 
                  ? 'Sie haben noch keine Anträge eingereicht.'
                  : 'Es sind noch keine Informationen für Ihre Anträge verfügbar.'
                }
              </p>
              {activeTab === 'all' && (
                <button
                  onClick={() => window.location.href = '/my-services'}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#060E5D] hover:bg-[#050B4A] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#060E5D]/40"
                >
                  Zurück zur Startseite
                </button>
              )}
            </div>
          ) : (
            <>
                             {/* Tabellen-Header */}
               <div className={`grid gap-x-2 px-6 py-4 bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-10 ${
                 activeTab === 'information' 
                   ? 'grid-cols-[8rem_14rem_minmax(0,2fr)_28rem]' 
                   : 'grid-cols-[8rem_14rem_minmax(0,2fr)_12rem_12rem]'
               }`}>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleSort('id')}
                    className="px-6 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-gray-700 flex items-center space-x-1"
                  >
                    <span>#</span>
                    {sortField === 'id' && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                                     <button
                     onClick={() => handleSort('createdAt')}
                     className="px-6 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-gray-700 flex items-center space-x-1"
                   >
                    <span>Datum</span>
                    {sortField === 'createdAt' && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </div>
                <div className="flex items-center space-x-2">
                                     <button
                     onClick={() => handleSort('title')}
                     className="px-6 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-gray-700 flex items-center space-x-1"
                   >
                    <span>Titel</span>
                    {sortField === 'title' && (
                      <span className="text-gray-400">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </div>
                {activeTab === 'all' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSort('status')}
                        className="px-6 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-gray-700 flex items-center space-x-1"
                      >
                        <span>Status</span>
                        {sortField === 'status' && (
                          <span className="text-gray-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSort('decision')}
                        className="px-6 py-2 text-left text-sm font-semibold text-muted-foreground hover:text-gray-700 flex items-center space-x-1"
                      >
                        <span>Entscheidung</span>
                        {sortField === 'decision' && (
                          <span className="text-gray-400">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </button>
                    </div>
                  </>
                )}
                {activeTab === 'information' && (
                  <div className="flex items-center space-x-2">
                    <span className="px-6 py-2 text-left text-sm font-semibold text-muted-foreground">Information</span>
                  </div>
                )}
              </div>

              {/* Tabellen-Zeilen */}
              <div className="divide-y divide-gray-200">
                {sortedServices.map((service) => (
                  <div 
                    key={service.id} 
                    className={`grid gap-x-2 px-6 py-4 bg-white border-t border-gray-100 rounded-md transition-all duration-150 hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-500/10 motion-safe:hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 cursor-pointer ${
                      activeTab === 'information' 
                        ? 'grid-cols-[8rem_14rem_minmax(0,2fr)_28rem]' 
                        : 'grid-cols-[8rem_14rem_minmax(0,2fr)_12rem_12rem]'
                    }`}
                    onClick={() => handleServiceClick(service)}
                  >
                    {/* Antragsnummer */}
                    <div className="flex items-center px-6 py-2">
                      <p className="text-sm font-medium text-gray-900">
                        #{service.id}
                      </p>
                    </div>
                    {/* Datum */}
                    <div className="flex items-center px-6 py-2">
                      <p className="text-sm text-gray-900">
                        {activeTab === 'information' 
                          ? formatDate(service.activities?.[0]?.when || service.createdAt)
                          : formatDate(service.createdAt)
                        }
                      </p>
                    </div>

                    {/* Titel */}
                    <div className="min-w-0 px-6 py-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activeTab === 'information' 
                          ? (service.titleInmate || service.title)
                          : service.title
                        }
                      </p>
                    </div>

                    {activeTab === 'all' && (
                      <>
                        {/* Status */}
                        <div className="flex items-center px-6 py-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(service.status)}
                            <span className="text-sm text-gray-900">
                              {getStatusText(service.status)}
                            </span>
                          </div>
                        </div>

                        {/* Entscheidung */}
                        <div className="flex items-center px-6 py-2">
                          {service.decision ? (
                            <span className="text-sm text-gray-900">
                              {getDecisionText(service.decision)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </>
                    )}
                    {activeTab === 'information' && (
                      /* Information */
                      <div className="flex items-center px-6 py-2">
                        <div className="flex items-center space-x-2">
                          <FileText className={`h-4 w-4 ${service.activities?.[0]?.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                          <span className={`text-sm ${service.activities?.[0]?.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                            {service.activities?.[0]?.details || 'Information verfügbar'}
                            {!service.activities?.[0]?.isActive && ' (ausgeblendet)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
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
                        {new Date(selectedService.createdAt).toLocaleDateString('de-DE')} um {new Date(selectedService.createdAt).toLocaleTimeString('de-DE')}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <p className="text-gray-900 mt-1">{getStatusText(selectedService.status)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Antragsnummer:</span>
                      <p className="text-gray-900 mt-1">#{selectedService.id}</p>
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

                {/* Zusätzliche Informationen */}
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
                                   activity.action === 'information' ? 'Information' : 'Nachricht'} von {activity.who.split(' (')[0]} vom {new Date(activity.when).toLocaleDateString('de-DE')} um {new Date(activity.when).toLocaleTimeString('de-DE')}
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
    </div>
  )
}

export default AllMyServices
