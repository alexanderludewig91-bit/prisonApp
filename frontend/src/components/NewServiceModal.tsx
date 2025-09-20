import { useState } from 'react'
import { Languages, Loader2, Check, X, FileText, DollarSign, Users, Heart, Scale, Home, Stethoscope, Briefcase, Package, MessageCircle, BookOpen, UserCheck, Unlock, MoreHorizontal } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import api from '../services/api'

interface NewServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (title: string, description: string, titleInmate?: string, descriptionInmate?: string, serviceType?: string) => Promise<void>
  isSubmitting: boolean
}

const NewServiceModal = ({ isOpen, onClose, onSubmit, isSubmitting }: NewServiceModalProps) => {
  const { t, currentLanguage } = useLanguage()
  const [step, setStep] = useState<'select' | 'input' | 'processing' | 'review'>('select')
  const [selectedServiceType, setSelectedServiceType] = useState<string>('')
  const [expandedCard, setExpandedCard] = useState<string | null>(null)
  const [originalText, setOriginalText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [originalTitle, setOriginalTitle] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [error, setError] = useState('')

  // Funktion zur Generierung der verfügbaren Monate (aktueller Monat + 2 vergangene Monate)
  const getAvailableMonths = () => {
    const now = new Date()
    const months = []
    
    for (let i = 0; i < 3; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthNames = [
        'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
        'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
      ]
      
      const monthName = monthNames[date.getMonth()]
      const year = date.getFullYear()
      const value = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      months.push({
        value: value,
        label: `${monthName} ${year}`
      })
    }
    
    return months
  }

  const handleClose = () => {
    // Reset state
    setStep('select')
    setSelectedServiceType('')
    setExpandedCard(null)
    setOriginalText('')
    setTranslatedText('')
    setGeneratedTitle('')
    setOriginalTitle('')
    setSelectedMonth('')
    setError('')
    onClose()
  }

  const handleCardClick = (serviceType: string) => {
    if (expandedCard === serviceType) {
      // Wenn bereits erweitert, zum Antrag navigieren
      handleServiceTypeSelect(serviceType)
    } else {
      // Karte erweitern
      setExpandedCard(serviceType)
    }
  }

  const handleModalClick = (e: React.MouseEvent) => {
    // Zurücksetzen wenn auf leere Stellen geklickt wird
    const target = e.target as HTMLElement
    // Prüfe ob der Klick NICHT auf eine Karte oder deren Inhalte war
    if (!target.closest('.cursor-pointer') && 
        !target.closest('button') &&
        !target.closest('h3') &&
        !target.closest('h5')) {
      setExpandedCard(null)
    }
  }

  const handlePrepareRequest = async () => {
    if (!originalText.trim()) {
      setError(t('messages.required'))
      return
    }

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
    }
  }

  const handleSubmit = async () => {
    if (selectedServiceType === 'PARTICIPATION_MONEY') {
      // Für Taschengeldantrag: Direkte Übermittlung ohne KI
      const selectedMonthData = getAvailableMonths().find(m => m.value === selectedMonth)
      const germanTitle = `Teilhabegeldantrag - ${selectedMonthData?.label || selectedMonth}`
      const germanDescription = `Antrag auf Teilhabegeld für den Monat ${selectedMonthData?.label || selectedMonth}`
      const originalTitleGenerated = germanTitle
      const originalDescription = germanDescription
      
      await onSubmit(germanTitle, germanDescription, originalTitleGenerated, originalDescription, selectedServiceType)
      handleClose()
    } else {
      // Für andere Anträge: KI-Verarbeitung
      const germanTitle = generatedTitle
      const originalTitleGenerated = originalTitle
      const germanDescription = translatedText
      const originalDescription = originalText
      
      await onSubmit(germanTitle, germanDescription, originalTitleGenerated, originalDescription, selectedServiceType)
      handleClose()
    }
  }

  const handleServiceTypeSelect = (serviceType: string) => {
    setSelectedServiceType(serviceType)
    setStep('input')
  }

  const handleBackToSelect = () => {
    setStep('select')
    setSelectedServiceType('')
    setOriginalText('')
    setTranslatedText('')
    setGeneratedTitle('')
    setOriginalTitle('')
    setError('')
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleModalClick}>
      <div className="bg-gray-50 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={handleModalClick}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {t('modals.newService.selectServiceType')}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {step === 'select' && (
          <div className="space-y-6">
            <div>
              {/* Kategorien mit Anträgen */}
              <div className="space-y-8">
                {/* Finanzen */}
                <div>
                  <div className="mb-4">
                    <h5 className="text-xl font-semibold text-gray-900 flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      {t('modals.newService.categories.finances')}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Teilhabegeldantrag */}
                    <div 
                      onClick={() => handleCardClick('PARTICIPATION_MONEY')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'PARTICIPATION_MONEY'
                          ? 'border-green-300 bg-green-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.participationMoney')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'PARTICIPATION_MONEY' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.participationMoneyDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('PARTICIPATION_MONEY')
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Buchungen und Finanzen */}
                    <div 
                      onClick={() => handleCardClick('BOOKINGS_FINANCE')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'BOOKINGS_FINANCE'
                          ? 'border-green-300 bg-green-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.bookingsFinance')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'BOOKINGS_FINANCE' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.bookingsFinanceDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('BOOKINGS_FINANCE')
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Soziales & Familie */}
                <div>
                  <div className="mb-4">
                    <h5 className="text-xl font-semibold text-gray-900 flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      {t('modals.newService.categories.socialFamily')}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Besuch */}
                    <div 
                      onClick={() => handleCardClick('VISIT')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'VISIT'
                          ? 'border-blue-300 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.visit')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'VISIT' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.visitDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('VISIT')
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Gespräch */}
                    <div 
                      onClick={() => handleCardClick('CONVERSATION')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'CONVERSATION'
                          ? 'border-blue-300 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.conversation')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'CONVERSATION' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.conversationDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('CONVERSATION')
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Freizeit & Bildung */}
                    <div 
                      onClick={() => handleCardClick('LEISURE_EDUCATION')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'LEISURE_EDUCATION'
                          ? 'border-blue-300 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-blue-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.leisureEducation')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'LEISURE_EDUCATION' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.leisureEducationDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('LEISURE_EDUCATION')
                                  }}
                                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Unterstützung & Beratung */}
                <div>
                  <div className="mb-4">
                    <h5 className="text-xl font-semibold text-gray-900 flex items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                        <Heart className="h-4 w-4 text-red-600" />
                      </div>
                      {t('modals.newService.categories.supportAdvice')}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Gesundheit */}
                    <div 
                      onClick={() => handleCardClick('HEALTH')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'HEALTH'
                          ? 'border-red-300 bg-red-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-red-50 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Stethoscope className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.health')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'HEALTH' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.healthDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('HEALTH')
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Beratung & Unterstützung */}
                    <div 
                      onClick={() => handleCardClick('COUNSELING_SUPPORT')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'COUNSELING_SUPPORT'
                          ? 'border-red-300 bg-red-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-red-50 hover:border-red-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <UserCheck className="h-5 w-5 text-red-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.counselingSupport')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'COUNSELING_SUPPORT' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.counselingSupportDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('COUNSELING_SUPPORT')
                                  }}
                                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Organisation & Rechte */}
                <div>
                  <div className="mb-4">
                    <h5 className="text-xl font-semibold text-gray-900 flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                        <Scale className="h-4 w-4 text-purple-600" />
                      </div>
                      {t('modals.newService.categories.organizationRights')}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

                    {/* Mein Eigentum in der Kammer */}
                    <div 
                      onClick={() => handleCardClick('PERSONAL_PROPERTY')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'PERSONAL_PROPERTY'
                          ? 'border-purple-300 bg-purple-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Home className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.personalProperty')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'PERSONAL_PROPERTY' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.personalPropertyDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('PERSONAL_PROPERTY')
                                  }}
                                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Arbeit & Schule */}
                    <div 
                      onClick={() => handleCardClick('WORK_SCHOOL')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'WORK_SCHOOL'
                          ? 'border-purple-300 bg-purple-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.workSchool')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'WORK_SCHOOL' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.workSchoolDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('WORK_SCHOOL')
                                  }}
                                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Paketsendung */}
                    <div 
                      onClick={() => handleCardClick('PACKAGE')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'PACKAGE'
                          ? 'border-purple-300 bg-purple-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Package className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.package')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'PACKAGE' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.packageDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('PACKAGE')
                                  }}
                                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Vollzugslockerung */}
                    <div 
                      onClick={() => handleCardClick('PRISON_RELAXATION')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'PRISON_RELAXATION'
                          ? 'border-purple-300 bg-purple-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-purple-50 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Unlock className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.prisonRelaxation')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'PRISON_RELAXATION' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.prisonRelaxationDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('PRISON_RELAXATION')
                                  }}
                                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sonstiges */}
                <div>
                  <div className="mb-4">
                    <h5 className="text-xl font-semibold text-gray-900 flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <MoreHorizontal className="h-4 w-4 text-gray-600" />
                      </div>
                      {t('modals.newService.categories.miscellaneous')}
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                    {/* Freitextantrag */}
                    <div 
                      onClick={() => handleCardClick('FREETEXT')}
                      className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                        expandedCard === 'FREETEXT'
                          ? 'border-gray-400 bg-gray-50 shadow-md'
                          : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-5 w-5 text-gray-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h5 className="text-base font-semibold text-gray-900">
                            {t('modals.newService.freetext')}
                          </h5>
                          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                            expandedCard === 'FREETEXT' ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                          }`}>
                            <div className="pt-2">
                              <p className="text-sm text-gray-900 mt-1">
                                {t('modals.newService.freetextDescription')}
                              </p>
                              <div className="flex justify-end mt-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleServiceTypeSelect('FREETEXT')
                                  }}
                                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors duration-200"
                                >
                                  {t('modals.newService.toRequest')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleClose}
                className="btn btn-secondary flex-1"
              >
                {t('buttons.cancel')}
              </button>
            </div>
          </div>
        )}

        {step === 'input' && (
          <div className="space-y-6">
            {/* Ausgewählter Antragstyp */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('modals.newService.serviceType')}
              </label>
              <div className="p-3 border border-gray-300 rounded-lg bg-gray-50">
                <div className="text-sm font-medium text-gray-900">
                  {selectedServiceType === 'FREETEXT' ? t('modals.newService.freetext') : 
                   selectedServiceType === 'PARTICIPATION_MONEY' ? t('modals.newService.participationMoney') : 
                   selectedServiceType === 'BOOKINGS_FINANCE' ? t('modals.newService.bookingsFinance') : 
                   selectedServiceType === 'PERSONAL_PROPERTY' ? t('modals.newService.personalProperty') : 
                   selectedServiceType === 'VISIT' ? t('modals.newService.visit') : 
                   selectedServiceType === 'CONVERSATION' ? t('modals.newService.conversation') : 
                   selectedServiceType === 'LEISURE_EDUCATION' ? t('modals.newService.leisureEducation') : 
                   selectedServiceType === 'HEALTH' ? t('modals.newService.health') : 
                   selectedServiceType === 'COUNSELING_SUPPORT' ? t('modals.newService.counselingSupport') : 
                   selectedServiceType === 'WORK_SCHOOL' ? t('modals.newService.workSchool') : 
                   selectedServiceType === 'PACKAGE' ? t('modals.newService.package') : 
                   selectedServiceType === 'PRISON_RELAXATION' ? t('modals.newService.prisonRelaxation') : 
                   'Unbekannter Antragstyp'}
                </div>
                <div className="text-sm text-gray-500">
                  {selectedServiceType === 'FREETEXT' ? t('modals.newService.freetextDescription') : 
                   selectedServiceType === 'PARTICIPATION_MONEY' ? t('modals.newService.participationMoneyDescription') : 
                   selectedServiceType === 'BOOKINGS_FINANCE' ? t('modals.newService.bookingsFinanceDescription') : 
                   selectedServiceType === 'PERSONAL_PROPERTY' ? t('modals.newService.personalPropertyDescription') : 
                   selectedServiceType === 'VISIT' ? t('modals.newService.visitDescription') : 
                   selectedServiceType === 'CONVERSATION' ? t('modals.newService.conversationDescription') : 
                   selectedServiceType === 'LEISURE_EDUCATION' ? t('modals.newService.leisureEducationDescription') : 
                   selectedServiceType === 'HEALTH' ? t('modals.newService.healthDescription') : 
                   selectedServiceType === 'COUNSELING_SUPPORT' ? t('modals.newService.counselingSupportDescription') : 
                   selectedServiceType === 'WORK_SCHOOL' ? t('modals.newService.workSchoolDescription') : 
                   selectedServiceType === 'PACKAGE' ? t('modals.newService.packageDescription') : 
                   selectedServiceType === 'PRISON_RELAXATION' ? t('modals.newService.prisonRelaxationDescription') : 
                   ''}
                </div>
              </div>
            </div>

            {/* Antragsspezifische Eingabefelder */}
            {selectedServiceType === 'FREETEXT' && (
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
            )}

            {selectedServiceType === 'PARTICIPATION_MONEY' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        Bitte wählen Sie den Monat aus, für den Sie Teilhabegeld beantragen möchten.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Monat für Teilhabegeldantrag *
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-full input"
                  >
                    <option value="">Bitte Monat auswählen</option>
                    {getAvailableMonths().map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    Wählen Sie den Monat, für den Sie den Teilhabegeldantrag stellen möchten.
                  </p>
                </div>
              </div>
            )}

            {selectedServiceType === 'BOOKINGS_FINANCE' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <DollarSign className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Buchungen und Finanzen
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen bezüglich Buchungen und Finanzen..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie bezüglich Buchungen und Finanzen benötigen.
                  </p>
                </div>
              </div>
            )}

            {selectedServiceType === 'VISIT' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Users className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Besuch
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen bezüglich Besuchen..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie bezüglich Besuchen benötigen.
                  </p>
                </div>
              </div>
            )}

            {selectedServiceType === 'CONVERSATION' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <MessageCircle className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Gespräch
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen bezüglich Gesprächen..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie bezüglich Gesprächen benötigen.
                  </p>
                </div>
              </div>
            )}

            {selectedServiceType === 'LEISURE_EDUCATION' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BookOpen className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Freizeit & Bildung
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen bezüglich Freizeit & Bildung..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie bezüglich Freizeit & Bildung benötigen.
                  </p>
                </div>
              </div>
            )}

            {selectedServiceType === 'COUNSELING_SUPPORT' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <UserCheck className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Beratung & Unterstützung
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen bezüglich Beratung & Unterstützung..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie bezüglich Beratung & Unterstützung benötigen.
                  </p>
                </div>
              </div>
            )}

            {selectedServiceType === 'PRISON_RELAXATION' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Unlock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Vollzugslockerung
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen bezüglich Vollzugslockerung..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie bezüglich Vollzugslockerung benötigen.
                  </p>
                </div>
              </div>
            )}

            {selectedServiceType === 'PERSONAL_PROPERTY' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Home className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Mein Eigentum in der Kammer
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens bezüglich Ihres Eigentums *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen bezüglich Ihres Eigentums in der Kammer..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie bezüglich Ihres Eigentums in der Kammer benötigen.
                  </p>
                </div>
              </div>
            )}

            {/* Weitere Anträge als Platzhalter */}
            {['HEALTH', 'WORK_SCHOOL', 'PACKAGE'].includes(selectedServiceType) && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        {selectedServiceType === 'HEALTH' ? 'Gesundheit' : 
                         selectedServiceType === 'WORK_SCHOOL' ? 'Arbeit & Schule' : 
                         selectedServiceType === 'PACKAGE' ? 'Paketsendung' : 'Antrag'}
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Diese Funktion ist noch in Entwicklung. Bitte verwenden Sie vorerst den "Sonstiges Anliegen" Antrag.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung Ihres Anliegens *
                  </label>
                  <textarea
                    value={originalText}
                    onChange={(e) => setOriginalText(e.target.value)}
                    placeholder="Beschreiben Sie Ihr Anliegen..."
                    className="w-full input resize-none"
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Beschreiben Sie detailliert, was Sie benötigen.
                  </p>
                </div>
              </div>
            )}

            {/* Fehlermeldung */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={handleBackToSelect}
                className="btn btn-secondary flex-1"
              >
                {t('buttons.back')}
              </button>
              {selectedServiceType === 'PARTICIPATION_MONEY' ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedMonth || isSubmitting}
                  className="btn btn-primary flex-1 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {t('modals.newService.submitting')}
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      {t('modals.newService.submitRequest')}
                    </>
                  )}
                </button>
              ) : (
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
              )}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-800 font-medium">
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
