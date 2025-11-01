import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, Check } from 'lucide-react'
import { 
  startSmartServiceChat, 
  sendChatMessage, 
  getChatStatus,
  finalizeSmartService 
} from '../services/api'

interface SmartServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: () => Promise<void>
  isSubmitting: boolean
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ExtractedData {
  serviceType?: string
  title?: string
  description?: string
  titleInmate?: string
  descriptionInmate?: string
  fields?: Record<string, any>
}

const SmartServiceModal = ({ isOpen, onClose, onSubmit, isSubmitting }: SmartServiceModalProps) => {
  const [phase, setPhase] = useState<'chat' | 'review' | 'submitting'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isReadyToProceed, setIsReadyToProceed] = useState(false)
  const [showReadyPopup, setShowReadyPopup] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractedData>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [reviewData, setReviewData] = useState({
    title: '',
    description: '',
    titleInmate: '',
    descriptionInmate: '',
    serviceType: 'FREETEXT'
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scrollt automatisch zum Ende der Nachrichten
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (phase === 'chat') {
      scrollToBottom()
    }
  }, [messages, phase])

  // Initialisierung: Startet Chat-Session
  useEffect(() => {
    if (isOpen && phase === 'chat' && !sessionId) {
      initializeChat()
    }
  }, [isOpen, phase, sessionId])

  // Fokus auf Eingabefeld setzen wenn Modal geöffnet ist
  useEffect(() => {
    if (isOpen && phase === 'chat' && sessionId) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, phase, sessionId])

  const initializeChat = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await startSmartServiceChat()
      
      setSessionId(response.sessionId)
      setMessages([{
        role: 'assistant',
        content: response.greeting || 'Hallo! Wie kann ich Ihnen heute bei Ihrer Antragstellung helfen?'
      }])
    } catch (error: any) {
      console.error('Chat-Initialisierung Fehler:', error)
      setError('Fehler beim Starten des Chats. Bitte versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !sessionId || isLoading) {
      return
    }

    const userMessage = inputMessage.trim()
    setInputMessage('')
    setError('')

    // User-Nachricht zur UI hinzufügen
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await sendChatMessage(sessionId, userMessage)

      // Assistant-Antwort zur UI hinzufügen
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }])

      // Extrahierte Daten aktualisieren
      if (response.extractedData) {
        setExtractedData(response.extractedData)
      }

      // Debug-Logging
      console.log('[SmartServiceModal] Response:', {
        isComplete: response.isComplete,
        extractedData: response.extractedData,
        missingFields: response.missingFields
      })

      // Prüfe ob Antrag bereit ist
      if (response.isComplete) {
        console.log('[SmartServiceModal] Antrag ist bereit - zeige Popup')
        setIsReadyToProceed(true)
        
        // Zeige Popup wenn es noch nicht angezeigt wird (also beim ersten Mal oder nach "Nein")
        // Das Popup wird nur nicht angezeigt, wenn es bereits sichtbar ist
        if (!showReadyPopup) {
          setShowReadyPopup(true)
        }
        
        // Bereite Review-Daten vor
        // WICHTIG: Nur Original-Felder befüllen (titleInmate, descriptionInmate)
        // Die Mitarbeiter-Felder (title, description) bleiben leer bis zum Einreichen
        setReviewData({
          title: '', // Leer - wird beim Einreichen aus titleInmate kopiert
          description: '', // Leer - wird beim Einreichen aus descriptionInmate kopiert
          titleInmate: response.extractedData?.title || response.extractedData?.titleInmate || '',
          descriptionInmate: response.extractedData?.description || response.extractedData?.descriptionInmate || '',
          serviceType: response.extractedData?.serviceType || 'FREETEXT'
        })
      } else {
        console.log('[SmartServiceModal] Antrag ist NICHT bereit:', response.missingFields)
        setIsReadyToProceed(false)
        setShowReadyPopup(false)
      }
    } catch (error: any) {
      console.error('Nachricht senden Fehler:', error)
      setError('Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.')
      // Entferne User-Nachricht bei Fehler
      setMessages(prev => prev.slice(0, -1))
    } finally {
      setIsLoading(false)
      // Fokus zurück auf Eingabefeld setzen
      setTimeout(() => {
        inputRef.current?.focus()
      }, 0)
    }
  }

  const handleProceedToReview = () => {
    setShowReadyPopup(false)
    setPhase('review')
  }

  const handlePopupYes = () => {
    setShowReadyPopup(false)
    setPhase('review')
  }

  const handlePopupNo = () => {
    setShowReadyPopup(false)
    // Fokus zurück auf Eingabefeld
    setTimeout(() => {
      inputRef.current?.focus()
    }, 100)
  }

  const handleReviewChange = (field: string, value: string) => {
    setReviewData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleFinalize = async () => {
    if (!sessionId || !reviewData.titleInmate || !reviewData.descriptionInmate) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    setPhase('submitting')
    setError('')

    try {
      // Beim Einreichen: Original -> Mitarbeiter kopieren
      await finalizeSmartService({
        sessionId,
        title: reviewData.titleInmate, // Original wird zu Mitarbeiter
        description: reviewData.descriptionInmate, // Original wird zu Mitarbeiter
        titleInmate: reviewData.titleInmate, // Original bleibt Original
        descriptionInmate: reviewData.descriptionInmate, // Original bleibt Original
        serviceType: reviewData.serviceType,
        fields: extractedData.fields
      })

      // Rufe onSubmit auf (zeigt Erfolgsmeldung in MyServices)
      await onSubmit()
      
      // Modal schließen
      handleClose()
    } catch (error: any) {
      console.error('Finalisierung Fehler:', error)
      setError('Fehler beim Einreichen des Antrags. Bitte versuchen Sie es erneut.')
      setPhase('review')
    }
  }

  const handleClose = () => {
    // Reset State
    setPhase('chat')
    setMessages([])
    setInputMessage('')
    setSessionId(null)
    setIsReadyToProceed(false)
    setShowReadyPopup(false)
    setExtractedData({})
    setError('')
    setReviewData({
      title: '',
      description: '',
      titleInmate: '',
      descriptionInmate: '',
      serviceType: 'FREETEXT'
    })
    onClose()
  }

  const getServiceTypeLabel = (serviceType: string) => {
    const labels: Record<string, string> = {
      'FREETEXT': 'Sonstiges Anliegen',
      'PARTICIPATION_MONEY': 'Teilhabegeldantrag',
      'VISIT': 'Besuchsantrag',
      'CONVERSATION': 'Gesprächsanfrage',
      'HEALTH': 'Gesundheit',
      'BOOKINGS_FINANCE': 'Geldtransfer',
      'LEISURE_EDUCATION': 'Freizeit & Bildung',
      'COUNSELING_SUPPORT': 'Beratungsanfrage',
      'PERSONAL_PROPERTY': 'Gegenstände aus der Kammer',
      'WORK_SCHOOL': 'Arbeit & Schule',
      'PACKAGE': 'Paketsendung',
      'PRISON_RELAXATION': 'Vollzugslockerung'
    }
    return labels[serviceType] || serviceType
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Ready Popup Modal */}
      {showReadyPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-green-100 rounded-full p-3">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-gray-900">
              Alle Informationen gesammelt!
            </h3>
            <p className="text-gray-600 text-center">
              Ich habe alle benötigten Informationen für Ihren Antrag gesammelt. Möchten Sie jetzt zur Überprüfung des Antrags gehen?
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePopupNo}
                className="flex-1 btn btn-secondary"
              >
                Nein, noch nicht
              </button>
              <button
                onClick={handlePopupYes}
                className="flex-1 btn btn-primary"
              >
                Ja, zur Überprüfung
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">Neuen Antrag mit Juna stellen</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={phase === 'submitting'}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {phase === 'chat' && (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t p-4">
                {error && (
                  <div className="mb-2 p-2 bg-red-100 text-red-700 rounded text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendMessage()
                      }
                    }}
                    placeholder="Schreiben Sie hier Ihre Nachricht..."
                    className="flex-1 input"
                    disabled={isLoading || !sessionId}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || !sessionId}
                    className="btn btn-primary"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>

              </div>
            </>
          )}

          {phase === 'review' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <h3 className="text-lg font-semibold mb-4">Antrag überprüfen</h3>

              {error && (
                <div className="p-2 bg-red-100 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Antragstyp
                  </label>
                  <input
                    type="text"
                    value={getServiceTypeLabel(reviewData.serviceType)}
                    className="input bg-gray-100"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titel (Original) *
                  </label>
                  <input
                    type="text"
                    value={reviewData.titleInmate}
                    onChange={(e) => handleReviewChange('titleInmate', e.target.value)}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Beschreibung (Original) *
                  </label>
                  <textarea
                    value={reviewData.descriptionInmate}
                    onChange={(e) => handleReviewChange('descriptionInmate', e.target.value)}
                    className="input"
                    rows={6}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setPhase('chat')}
                  className="btn btn-secondary"
                >
                  Zurück zum Chat
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={!reviewData.titleInmate || !reviewData.descriptionInmate || isSubmitting}
                  className="btn btn-primary"
                >
                  Antrag einreichen
                </button>
              </div>
            </div>
          )}

          {phase === 'submitting' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-700">Antrag wird eingereicht...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartServiceModal

