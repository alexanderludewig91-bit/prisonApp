import { useState, useEffect, useRef } from 'react'
import { X, Send, Loader2, Check, Mic, Square, Volume2, VolumeX } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { 
  startSmartServiceChat, 
  sendChatMessage, 
  finalizeSmartService,
  uploadAudioForTranscription,
  getTextToSpeech
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
  const { t, currentLanguage } = useLanguage()
  const [phase, setPhase] = useState<'chat' | 'review' | 'submitting'>('chat')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
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
  
  // Audio-Aufnahme State
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  // TTS State
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false)
  const [playingMessageId, setPlayingMessageId] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

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
      const response = await startSmartServiceChat(currentLanguage)
      
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
      const response = await sendChatMessage(sessionId, userMessage, currentLanguage)

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

  // Audio-Aufnahme Funktionen
  const startRecording = async () => {
    try {
      // Prüfe ob MediaRecorder unterstützt wird
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Audio-Aufnahme wird in diesem Browser nicht unterstützt')
        return
      }

      // Hole Mikrofon-Zugriff
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream
      
      // Erstelle MediaRecorder mit WebM-Format (gut für Browser)
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Sammle Audio-Chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      // Wenn Aufnahme beendet wird
      mediaRecorder.onstop = async () => {
        // Erstelle Audio-Blob
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        
        // Stoppe alle Tracks (Mikrofon freigeben)
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop())
          audioStreamRef.current = null
        }
        
        // Konvertiere Blob zu File
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' })
        
        // Transkribiere Audio
        await handleAudioTranscription(audioFile)
      }

      // Starte Aufnahme
      mediaRecorder.start()
      setIsRecording(true)
      setError('')
    } catch (error: any) {
      console.error('Fehler beim Starten der Audio-Aufnahme:', error)
      setError('Fehler beim Zugriff auf das Mikrofon. Bitte Berechtigungen prüfen.')
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
    // Falls MediaRecorder nicht mehr existiert, stoppe Stream direkt
    if (audioStreamRef.current && !mediaRecorderRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop())
      audioStreamRef.current = null
    }
  }

  const handleAudioTranscription = async (audioFile: File) => {
    if (!sessionId) {
      setError('Keine aktive Chat-Session')
      return
    }

    setIsTranscribing(true)
    setError('')

    try {
      // Lade Audio hoch und transkribiere
      const response = await uploadAudioForTranscription(
        audioFile,
        sessionId,
        currentLanguage
      )

      if (response.transcript) {
        // Setze Transkript in Input-Feld
        setInputMessage(response.transcript)
        
        // Fokus auf Input-Feld
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      } else {
        setError('Keine Transkription erhalten')
      }
    } catch (error: any) {
      console.error('Audio-Transkription Fehler:', error)
      setError(error.response?.data?.error || 'Fehler bei der Audio-Transkription. Bitte versuchen Sie es erneut.')
    } finally {
      setIsTranscribing(false)
    }
  }

  // Cleanup: Stoppe Aufnahme wenn Modal geschlossen wird
  useEffect(() => {
    if (!isOpen && isRecording) {
      stopRecording()
    }
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        stopRecording()
      }
      // Cleanup: Stoppe Audio-Wiedergabe beim Unmount
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [isOpen])

  // TTS: Text-to-Speech für Assistant-Antworten
  const handlePlayTTS = async (text: string, messageIndex: number) => {
    // Stoppe aktuelles Audio falls abgespielt wird
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = '' // Wichtig: Leere src, um Event-Listener zu entfernen
      audioRef.current.load() // Lade leeres Audio, um Event-Listener zu entfernen
      audioRef.current = null
    }

    // Wenn bereits diese Nachricht abgespielt wird, stoppe sie
    if (playingMessageId === messageIndex) {
      setPlayingMessageId(null)
      return
    }

    try {
      setIsGeneratingTTS(true)
      setError('')
      setPlayingMessageId(messageIndex)

      // Generiere Audio mit TTS
      const audioBlob = await getTextToSpeech(text, currentLanguage, 'nova')
      
      // Erstelle Audio-URL aus Blob (mit Timestamp für Cache-Busting)
      const audioUrl = URL.createObjectURL(audioBlob)
      const audio = new Audio(audioUrl)
      
      // Speichere Audio-Referenz
      audioRef.current = audio

      // Warte bis Audio vollständig geladen und gepuffert ist
      // Dies verhindert, dass die ersten Wörter fehlen
      audio.preload = 'auto'
      
      await new Promise<void>((resolve, reject) => {
        let resolved = false
        
        // Prüfe ob genug Daten gepuffert sind (robuster Ansatz)
        const checkBufferReady = (): boolean => {
          // Prüfe ob Audio bereit ist
          if (audio.readyState < 4) return false // HAVE_ENOUGH_DATA
          
          // Prüfe ob gepufferte Daten vorhanden sind
          if (audio.buffered.length === 0) return false
          
          const bufferedEnd = audio.buffered.end(0)
          const duration = audio.duration || 0
          
          // Intelligentes Buffering: Angepasst an Textlänge
          if (duration > 0 && !isNaN(duration) && isFinite(duration)) {
            // Für sehr kurze Texte (< 5s): Warte auf 0.8s gepuffert
            if (duration < 5) {
              return bufferedEnd >= 0.8
            }
            // Für mittlere Texte (5-20s): Warte auf 1.5s oder 20% gepuffert
            if (duration < 20) {
              const minBuffer = Math.max(1.5, duration * 0.2)
              return bufferedEnd >= minBuffer
            }
            // Für längere Texte (> 20s): Warte auf 3s oder 25% gepuffert
            const minBuffer = Math.max(3.0, duration * 0.25)
            return bufferedEnd >= minBuffer
          }
          
          // Wenn Duration noch nicht bekannt, warte auf mindestens 1s gepuffert
          return bufferedEnd >= 1.0
        }

        const handleProgress = () => {
          if (!resolved && checkBufferReady()) {
            cleanup()
            // Audio auf Anfang setzen und dann warten
            audio.currentTime = 0
            // Längere Verzögerung für zuverlässigere Wiedergabe
            const delay = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)
              ? (audio.duration < 5 ? 300 : audio.duration < 20 ? 400 : 500)
              : 400
            setTimeout(() => resolve(), delay)
          }
        }

        const handleCanPlayThrough = () => {
          // canplaythrough bedeutet, dass genug Daten gepuffert sind für ununterbrochene Wiedergabe
          if (!resolved && checkBufferReady()) {
            cleanup()
            // Audio auf Anfang setzen und dann warten
            audio.currentTime = 0
            // Längere Verzögerung für zuverlässigere Wiedergabe
            const delay = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)
              ? (audio.duration < 5 ? 300 : audio.duration < 20 ? 400 : 500)
              : 400
            setTimeout(() => resolve(), delay)
          }
        }

        const handleError = () => {
          cleanup()
          reject(new Error('Fehler beim Laden der Audio-Datei'))
        }

        const cleanup = () => {
          if (resolved) return
          resolved = true
          audio.removeEventListener('progress', handleProgress)
          audio.removeEventListener('canplaythrough', handleCanPlayThrough)
          audio.removeEventListener('loadeddata', handleProgress)
          audio.removeEventListener('error', handleError)
        }

        // Prüfe ob Audio bereits vollständig geladen ist
        if (checkBufferReady()) {
          cleanup()
          audio.currentTime = 0
          const delay = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)
            ? (audio.duration < 5 ? 300 : audio.duration < 20 ? 400 : 500)
            : 400
          setTimeout(() => resolve(), delay)
        } else {
          // Warte auf Events für maximale Sicherheit
          audio.addEventListener('progress', handleProgress) // Wird mehrfach aufgerufen während des Ladens
          audio.addEventListener('canplaythrough', handleCanPlayThrough)
          audio.addEventListener('loadeddata', handleProgress) // Zusätzliches Event für mehr Zuverlässigkeit
          audio.addEventListener('error', handleError)
          // Lade Audio explizit vor
          audio.load()
          
          // Fallback: Prüfe regelmäßig ob Buffer bereit ist
          const checkInterval = setInterval(() => {
            if (!resolved && checkBufferReady()) {
              clearInterval(checkInterval)
              cleanup()
              audio.currentTime = 0
              const delay = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)
                ? (audio.duration < 5 ? 300 : audio.duration < 20 ? 400 : 500)
                : 400
              setTimeout(() => resolve(), delay)
            }
          }, 100) // Prüfe alle 100ms
          
          // Fallback: Timeout nach 10 Sekunden
          setTimeout(() => {
            if (!resolved) {
              clearInterval(checkInterval)
              cleanup()
              if (audio.readyState >= 4) {
                audio.currentTime = 0
                const delay = audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)
                  ? (audio.duration < 5 ? 300 : audio.duration < 20 ? 400 : 500)
                  : 400
                setTimeout(() => resolve(), delay)
              } else {
                reject(new Error('Timeout beim Laden der Audio-Datei'))
              }
            }
          }, 10000)
        }
      })

      // Audio-Events
      audio.onended = () => {
        setPlayingMessageId(null)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }

      audio.onerror = () => {
        // Nur loggen, keine Fehlermeldung anzeigen (kann durch manuelles Stoppen ausgelöst werden)
        console.error('[SmartServiceModal] Audio-Fehler:', audio.error)
        // Keine Fehlermeldung anzeigen, da sie beim manuellen Stoppen irritierend ist
        setPlayingMessageId(null)
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
      }

      // Starte Wiedergabe nachdem alles geladen ist
      await audio.play()
    } catch (error: any) {
      console.error('TTS Fehler:', error)
      setError(error.response?.data?.error || error.message || 'Fehler bei der Text-to-Speech Konvertierung')
      setPlayingMessageId(null)
    } finally {
      setIsGeneratingTTS(false)
    }
  }

  const handleClose = () => {
    // Stoppe Aufnahme falls aktiv
    if (isRecording) {
      stopRecording()
    }
    
    // Stoppe Audio-Wiedergabe falls aktiv
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    
    // Reset State
    setPhase('chat')
    setMessages([])
    setInputMessage('')
    setSessionId(null)
    setShowReadyPopup(false)
    setExtractedData({})
    setError('')
    setIsRecording(false)
    setIsTranscribing(false)
    setIsGeneratingTTS(false)
    setPlayingMessageId(null)
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
              {t('modals.smartService.readyPopup.title')}
            </h3>
            <p className="text-gray-600 text-center">
              {t('modals.smartService.readyPopup.message')}
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handlePopupNo}
                className="flex-1 btn btn-secondary"
              >
                {t('modals.smartService.readyPopup.notYet')}
              </button>
              <button
                onClick={handlePopupYes}
                className="flex-1 btn btn-primary"
              >
                {t('modals.smartService.readyPopup.yesReview')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header mit Gradient */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#060E5D]/10 to-[#1a47a3]/10">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#060E5D] to-[#1a47a3] rounded-xl p-2">
              <span className="text-2xl">✨</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('modals.smartService.title')}</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg p-2 transition-colors"
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
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-3`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#060E5D] to-[#1a47a3] flex items-center justify-center shadow-md">
                        <span className="text-white text-sm font-bold">J</span>
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-md ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-[#060E5D] to-[#1a47a3] text-white'
                          : 'bg-white text-gray-800 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => handlePlayTTS(message.content, index)}
                            disabled={isGeneratingTTS}
                            className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
                              playingMessageId === index
                                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                            title={playingMessageId === index ? 'Audio stoppen' : 'Text vorlesen'}
                          >
                            {playingMessageId === index ? (
                              <VolumeX className="h-4 w-4" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">U</span>
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#060E5D] to-[#1a47a3] flex items-center justify-center shadow-md">
                      <span className="text-white text-sm font-bold">J</span>
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-3 shadow-md border border-gray-200">
                      <Loader2 className="h-5 w-5 animate-spin text-[#060E5D]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="border-t border-gray-200 bg-white p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
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
                    placeholder={t('modals.smartService.messagePlaceholder')}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#060E5D] focus:border-[#060E5D] transition-all disabled:bg-gray-50 disabled:cursor-not-allowed"
                    disabled={isLoading || isTranscribing || !sessionId}
                  />
                  
                  {/* Audio-Aufnahme Button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isLoading || isTranscribing || !sessionId}
                    className={`px-4 py-3 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                    title={isRecording ? 'Aufnahme stoppen' : 'Audio-Aufnahme starten'}
                  >
                    {isRecording ? (
                      <>
                        <Square className="h-5 w-5" />
                        <span className="hidden sm:inline">Stoppen</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5" />
                      </>
                    )}
                  </button>

                  {/* Senden Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isLoading || isTranscribing || !sessionId}
                    className="px-6 py-3 bg-gradient-to-r from-[#060E5D] to-[#1a47a3] text-white rounded-xl hover:from-[#050B4A] hover:to-[#163d8f] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none flex items-center gap-2 font-medium"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Transkribiere...</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span>Senden</span>
                      </>
                    )}
                  </button>
                </div>
                
                {/* Aufnahme-Status */}
                {isRecording && (
                  <div className="mt-3 flex items-center gap-2 text-red-600 text-sm">
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    <span>Aufnahme läuft... Klicken Sie auf "Stoppen" wenn Sie fertig sind.</span>
                  </div>
                )}

              </div>
            </>
          )}

          {phase === 'review' && (
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-2">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{t('modals.smartService.review.title')}</h3>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm shadow-sm">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('modals.smartService.review.serviceType')}
                  </label>
                  <input
                    type="text"
                    value={getServiceTypeLabel(reviewData.serviceType)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700 cursor-not-allowed"
                    disabled
                  />
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('modals.smartService.review.titleOriginal')} *
                  </label>
                  <input
                    type="text"
                    value={reviewData.titleInmate}
                    onChange={(e) => handleReviewChange('titleInmate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#060E5D] focus:border-[#060E5D] transition-all"
                    required
                  />
                </div>

                <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('modals.smartService.review.descriptionOriginal')} *
                  </label>
                  <textarea
                    value={reviewData.descriptionInmate}
                    onChange={(e) => handleReviewChange('descriptionInmate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#060E5D] focus:border-[#060E5D] transition-all resize-none"
                    rows={8}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setPhase('chat')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium shadow-sm hover:shadow-md"
                >
                  {t('modals.smartService.review.backToChat')}
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={!reviewData.titleInmate || !reviewData.descriptionInmate || isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-[#060E5D] to-[#1a47a3] text-white rounded-xl hover:from-[#050B4A] hover:to-[#163d8f] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:scale-105 disabled:transform-none font-medium"
                >
                  {isSubmitting ? t('modals.smartService.review.submitting') : t('modals.smartService.review.submitRequest')}
                </button>
              </div>
            </div>
          )}

          {phase === 'submitting' && (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#060E5D]/10 to-[#1a47a3]/10 mb-4">
                  <Loader2 className="h-8 w-8 animate-spin text-[#060E5D]" />
                </div>
                <p className="text-xl font-semibold text-gray-700">{t('modals.smartService.review.submittingTitle')}</p>
                <p className="text-sm text-gray-500">{t('modals.smartService.review.submittingMessage')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SmartServiceModal

