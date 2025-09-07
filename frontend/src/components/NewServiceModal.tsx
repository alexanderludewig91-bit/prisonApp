import { useState } from 'react'
import { Languages, Loader2, Check, X } from 'lucide-react'
import api from '../services/api'

interface NewServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, description: string) => Promise<void>
  isSubmitting: boolean
}

const NewServiceModal = ({ isOpen, onClose, onSubmit, isSubmitting }: NewServiceModalProps) => {
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input')
  const [originalText, setOriginalText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    // Reset state
    setStep('input')
    setOriginalText('')
    setTranslatedText('')
    setGeneratedTitle('')
    setError('')
    onClose()
  }

  const handlePrepareRequest = async () => {
    if (!originalText.trim()) {
      setError('Bitte geben Sie einen Text ein')
      return
    }

    setLoading(true)
    setError('')
    setStep('processing')

    try {
      const response = await api.post('/ai/translate', {
        text: originalText
      })

      const { translatedText: result, generatedTitle: title } = response.data
      setTranslatedText(result)
      setGeneratedTitle(title)
      setStep('review')
    } catch (error: any) {
      console.error('KI-Verarbeitung Fehler:', error)
      
      if (error.response?.status === 402) {
        setError('API-Limit erreicht. Bitte versuchen Sie es später erneut.')
      } else if (error.response?.status === 500) {
        setError('Service nicht verfügbar. Bitte kontaktieren Sie den Administrator.')
      } else {
        setError('Fehler bei der Verarbeitung. Bitte versuchen Sie es erneut.')
      }
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    // Formatierung: "[Original] / [Deutsch]" für Titel
    const originalTitle = originalText.split(' ').slice(0, 5).join(' ')
    const formattedTitle = `${originalTitle} / ${generatedTitle}`
    
    // Formatierung: "[Original] - mit KI übersetzt: [Deutsch]" für Beschreibung
    const formattedDescription = `${originalText} - mit KI übersetzt: ${translatedText}`
    
    await onSubmit(formattedTitle, formattedDescription)
    handleClose()
  }

  const handleBackToInput = () => {
    setStep('input')
    setTranslatedText('')
    setGeneratedTitle('')
    setError('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Neuen Antrag stellen
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'input' && (
          <div className="space-y-6">
            {/* Antragstyp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Antragstyp:
              </label>
              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="serviceType"
                    value="FREETEXT"
                    defaultChecked
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">Sonstiges Anliegen</div>
                    <div className="text-sm text-gray-500">Für allgemeine Anfragen und Anliegen</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Beschreibung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung Ihres Anliegens: *
              </label>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="Beschreiben Sie Ihr Anliegen in Ihrer gewünschten Sprache..."
                className="w-full input resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                Sie können Ihren Text in jeder Sprache eingeben. Die KI wird ihn ins Deutsche übersetzen und einen passenden Titel generieren.
              </p>
            </div>

            {/* Fehlermeldung */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="btn btn-secondary flex-1"
              >
                Abbrechen
              </button>
              <button
                onClick={handlePrepareRequest}
                disabled={!originalText.trim()}
                className="btn btn-primary flex-1 flex items-center justify-center"
              >
                <Languages className="h-4 w-4 mr-2" />
                Antrag vorbereiten
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              Antrag wird vorbereitet...
            </h4>
            <p className="text-gray-600">
              Die KI übersetzt Ihren Text und generiert einen passenden Titel.
            </p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">Antrag erfolgreich vorbereitet</span>
            </div>

            {/* Zwei-Spalten Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Linke Spalte - Original */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Ihr ursprünglicher Text:</h4>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-800 whitespace-pre-wrap">{originalText}</p>
                </div>
              </div>

              {/* Rechte Spalte - Finale Formatierung */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Finale Antragsdaten:</h4>
                
                {/* Formatierten Titel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Titel:
                  </label>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-green-800 font-medium">
                      {originalText.split(' ').slice(0, 5).join(' ')} / {generatedTitle}
                    </p>
                  </div>
                </div>

                {/* Formatierte Beschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung:
                  </label>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-blue-800 whitespace-pre-wrap">
                      {originalText} - mit KI übersetzt: {translatedText}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleBackToInput}
                className="btn btn-secondary flex-1"
              >
                Zurück bearbeiten
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary flex-1 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Wird eingereicht...
                  </>
                ) : (
                  'Antrag einreichen'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default NewServiceModal
