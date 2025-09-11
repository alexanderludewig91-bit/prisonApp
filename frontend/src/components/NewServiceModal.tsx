import { useState } from 'react'
import { Languages, Loader2, Check, X } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'

interface NewServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, description: string, titleInmate?: string, descriptionInmate?: string) => Promise<void>
  isSubmitting: boolean
}

const NewServiceModal = ({ isOpen, onClose, onSubmit, isSubmitting }: NewServiceModalProps) => {
  const { t, currentLanguage } = useLanguage()
  const [step, setStep] = useState<'input' | 'processing' | 'review'>('input')
  const [originalText, setOriginalText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [originalTitle, setOriginalTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleClose = () => {
    // Reset state
    setStep('input')
    setOriginalText('')
    setTranslatedText('')
    setGeneratedTitle('')
    setOriginalTitle('')
    setError('')
    onClose()
  }

  const handlePrepareRequest = async () => {
    if (!originalText.trim()) {
      setError(t('messages.required'))
      return
    }

    setLoading(true)
    setError('')
    setStep('processing')

    try {
      const response = await api.post('/ai/translate', {
        text: originalText,
        language: currentLanguage // Sprachparameter hinzufügen
      })

      const { translatedText: result, generatedTitle: title, originalTitle: origTitle, languageMode } = response.data
      setTranslatedText(result)
      setGeneratedTitle(title)
      setOriginalTitle(origTitle)
      setStep('review')
      
      // Debug: Zeige verwendeten Modus
      if (languageMode === 'german') {
        console.log('🇩🇪 Deutsch-Modus: Nur Titel generiert')
      } else {
        console.log('🌍 Übersetzungs-Modus: Vollständige KI-Pipeline')
      }
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
    // Deutscher Titel (KI-generiert)
    const germanTitle = generatedTitle
    
    // Original-Titel (KI-generiert)
    const originalTitleGenerated = originalTitle
    
    // Getrennte Beschreibungen
    const germanDescription = translatedText
    const originalDescription = originalText
    
    await onSubmit(germanTitle, germanDescription, originalTitleGenerated, originalDescription)
    handleClose()
  }

  const handleBackToInput = () => {
    setStep('input')
    setTranslatedText('')
    setGeneratedTitle('')
    setOriginalTitle('')
    setError('')
  }

  // Debug: Zeige KI-generierte Titel in der Konsole
  const debugTitleGeneration = () => {
    if (originalText) {
      console.log('🔍 KI-Titel-Generierung Debug:', {
        original: originalText,
        germanTitle: generatedTitle,
        originalTitle: originalTitle,
        wordCount: originalText.split(/\s+/).length
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('modals.newService.title')}
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
                {t('modals.newService.serviceType')}
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
                    <div className="text-sm font-medium text-gray-900">{t('modals.newService.freetext')}</div>
                    <div className="text-sm text-gray-500">{t('modals.newService.freetextDescription')}</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Beschreibung */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('modals.newService.description')} *
              </label>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder={t('modals.newService.descriptionPlaceholder')}
                className="w-full input resize-none"
                rows={4}
                maxLength={500}
              />
              <p className="text-sm text-gray-500 mt-1">
                {t('modals.newService.descriptionHelp')}
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
                {t('buttons.cancel')}
              </button>
              <button
                onClick={() => {
                  debugTitleGeneration()
                  handlePrepareRequest()
                }}
                disabled={!originalText.trim()}
                className="btn btn-primary flex-1 flex items-center justify-center"
              >
                <Languages className="h-4 w-4 mr-2" />
                {t('modals.newService.prepareRequest')}
              </button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="text-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {t('messages.aiProcessing')}
            </h4>
            <p className="text-gray-600">
              {t('messages.aiProcessingDescription')}
            </p>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">{t('modals.newService.successfullyPrepared')}</span>
            </div>

            {/* Bedingte Anzeige basierend auf Sprache */}
            {currentLanguage === 'de' ? (
              /* Ein-Spalten Layout für Deutsch */
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">{t('modals.newService.originalText')}:</h4>
                
                {/* Titel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('modals.newService.originalTitle')}:
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-800 font-medium">
                      {originalTitle}
                    </p>
                  </div>
                </div>

                {/* Beschreibung */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('modals.newService.originalDescription')}:
                  </label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {originalText}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Zwei-Spalten Layout für andere Sprachen */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Linke Spalte - Insassen-Sprache */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">{t('modals.newService.originalText')}:</h4>
                  
                  {/* Titel in Insassen-Sprache */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('modals.newService.originalTitle')}:
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-gray-800 font-medium">
                        {originalTitle}
                      </p>
                    </div>
                  </div>

                  {/* Beschreibung in Insassen-Sprache */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('modals.newService.originalDescription')}:
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {originalText}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rechte Spalte - Mitarbeiter-Sprache */}
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">{t('modals.newService.forStaff')}:</h4>
                  
                  {/* Titel für Mitarbeiter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('modals.newService.germanTitle')}:
                    </label>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-800 font-medium">
                        {generatedTitle}
                      </p>
                    </div>
                  </div>

                  {/* Beschreibung für Mitarbeiter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('modals.newService.germanDescription')}:
                    </label>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 whitespace-pre-wrap">
                        {translatedText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleBackToInput}
                className="btn btn-secondary flex-1"
              >
                {t('modals.newService.back')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="btn btn-primary flex-1 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('modals.newService.submitting')}
                  </>
                ) : (
                  t('modals.newService.submitRequest')
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
