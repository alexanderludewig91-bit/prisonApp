import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { FileText, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import AITextTranslator from '../components/AITextTranslator'

const NewService = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })

  // Prüfe ob Benutzer ein Insasse ist
  const userGroups = user?.groups?.map(g => g.name) || []
  const isInmate = userGroups.some(group => group === 'PS Inmates')
  
  // Wenn nicht Insasse, zur Login-Seite weiterleiten
  if (!isInmate) {
    return <Navigate to="/login" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.post('/services/my/services', formData)
      console.log('Antrag erfolgreich erstellt:', response.data)
      
      setLoading(false)
      navigate('/my-services')
    } catch (error) {
      console.error('Fehler beim Erstellen des Antrags:', error)
      setLoading(false)
      // TODO: Fehlermeldung anzeigen
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTextTranslated = (translatedText: string) => {
    // Übersetzten Text in das Beschreibungsfeld einfügen
    setFormData(prev => ({
      ...prev,
      description: translatedText
    }))
  }

  const handleTitleGenerated = (generatedTitle: string) => {
    // Generierten Titel in das Titel-Feld einfügen
    setFormData(prev => ({
      ...prev,
      title: generatedTitle
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Neuer Antrag
        </h1>
        <p className="text-gray-600">
          Reichen Sie hier Ihren neuen Antrag ein.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Antragstitel *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input"
              placeholder="z.B. Besuchserlaubnis, Arbeitsplatz-Anfrage, etc."
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="input"
              placeholder="Beschreiben Sie Ihren Antrag detailliert..."
            />
          </div>



          {/* KI-Textübersetzung */}
          <AITextTranslator 
            onTextTranslated={handleTextTranslated}
            onTitleGenerated={handleTitleGenerated}
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <FileText className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Wichtige Hinweise
                </h3>
                <ul className="mt-2 text-sm text-blue-700 space-y-1">
                  <li>• Bitte beschreiben Sie Ihren Antrag so genau wie möglich</li>
                  <li>• Anträge werden in der Reihenfolge der Priorität bearbeitet</li>
                  <li>• Sie können den Status Ihres Antrags unter "Meine Anträge" verfolgen</li>
                  <li>• Bei dringenden Angelegenheiten kontaktieren Sie bitte das Personal</li>
                  <li>• Nutzen Sie die KI-Übersetzung für Texte in anderen Sprachen</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/my-services')}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="btn btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Wird erstellt...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Antrag einreichen
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewService
