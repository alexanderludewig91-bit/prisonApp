import { useState } from 'react'
import { Languages, Loader2, Copy, Check } from 'lucide-react'
import api from '../services/api'

interface AITextTranslatorProps {
  onTextTranslated?: (translatedText: string) => void
  onTitleGenerated?: (generatedTitle: string) => void
}

const AITextTranslator = ({ onTextTranslated, onTitleGenerated }: AITextTranslatorProps) => {
  const [inputText, setInputText] = useState('')
  const [translatedText, setTranslatedText] = useState('')
  const [generatedTitle, setGeneratedTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [titleCopied, setTitleCopied] = useState(false)

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      setError('Bitte geben Sie einen Text ein')
      return
    }

    setLoading(true)
    setError('')
    setTranslatedText('')
    setGeneratedTitle('')

    try {
      const response = await api.post('/ai/translate', {
        text: inputText,
        language: 'auto' // Für AITextTranslator immer Übersetzungsmodus
      })

      const { translatedText: result, generatedTitle: title } = response.data
      setTranslatedText(result)
      setGeneratedTitle(title)
      
      // Callbacks aufrufen, falls vorhanden
      if (onTextTranslated) {
        onTextTranslated(result)
      }
      if (onTitleGenerated) {
        onTitleGenerated(title)
      }
    } catch (error: any) {
      console.error('Übersetzungsfehler:', error)
      
      if (error.response?.status === 402) {
        setError('API-Limit erreicht. Bitte versuchen Sie es später erneut.')
      } else if (error.response?.status === 500) {
        setError('Service nicht verfügbar. Bitte kontaktieren Sie den Administrator.')
      } else {
        setError('Fehler bei der Übersetzung. Bitte versuchen Sie es erneut.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translatedText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Fehler beim Kopieren:', error)
    }
  }

  const handleTitleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedTitle)
      setTitleCopied(true)
      setTimeout(() => setTitleCopied(false), 2000)
    } catch (error) {
      console.error('Fehler beim Kopieren des Titels:', error)
    }
  }

  const handleClear = () => {
    setInputText('')
    setTranslatedText('')
    setGeneratedTitle('')
    setError('')
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center mb-4">
        <Languages className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-blue-900">
          KI-Textübersetzung
        </h3>
      </div>
      
      <p className="text-sm text-blue-700 mb-4">
        Geben Sie Text in einer beliebigen Sprache ein und lassen Sie ihn ins Deutsche übersetzen. Zusätzlich wird automatisch ein kurzer Titel (max. 5 Wörter) generiert.
      </p>

      <div className="space-y-4">
        {/* Eingabefeld */}
        <div>
          <label htmlFor="ai-input" className="block text-sm font-medium text-gray-700 mb-2">
            Text eingeben (beliebige Sprache)
          </label>
          <textarea
            id="ai-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Geben Sie hier Ihren Text ein..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleTranslate}
            disabled={loading || !inputText.trim()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Übersetze...
              </>
            ) : (
              <>
                <Languages className="h-4 w-4 mr-2" />
                Übersetzen
              </>
            )}
          </button>
          
          <button
            onClick={handleClear}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Löschen
          </button>
        </div>

        {/* Fehlermeldung */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Generierter Titel */}
        {generatedTitle && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Generierter Titel (max. 5 Wörter)
              </label>
              <button
                onClick={handleTitleCopy}
                className="flex items-center text-sm text-green-600 hover:text-green-800"
              >
                {titleCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Kopieren
                  </>
                )}
              </button>
            </div>
            <div className="bg-green-50 rounded-md p-3">
              <p className="text-green-800 font-medium">{generatedTitle}</p>
            </div>
          </div>
        )}

        {/* Übersetzungsergebnis */}
        {translatedText && (
          <div className="bg-white border border-gray-200 rounded-md p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Übersetzung (Deutsch)
              </label>
              <button
                onClick={handleCopy}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Kopiert!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Kopieren
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-50 rounded-md p-3">
              <p className="text-gray-800 whitespace-pre-wrap">{translatedText}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AITextTranslator
