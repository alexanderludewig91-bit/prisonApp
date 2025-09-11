import { GoogleGenerativeAI } from '@google/generative-ai'
import { AIProvider, AIProviderConfig, AIProviderError } from './AIProvider'

/**
 * Google Gemini Provider Implementation
 */
export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI
  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
    this.client = new GoogleGenerativeAI(config.apiKey)
  }

  async translate(text: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }
      })

      const prompt = `Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Übersetze den gegebenen Text direkt ins Deutsche. Sollte der Text bereits in deutscher Sprache übermittelt werden, lasse ihn unverändert. Antworte nur mit der deutschen Übersetzung, ohne zusätzliche Erklärungen oder Formatierung.

Text: "${text}"`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const translatedText = response.text()

      if (!translatedText) {
        throw new AIProviderError('Keine Übersetzung erhalten', 'NO_RESPONSE', 500)
      }

      return translatedText.trim()
    } catch (error: any) {
      console.error('Gemini API Fehler:', error)
      
      // Gemini-spezifische Fehlerbehandlung
      if (error.message?.includes('quota')) {
        throw new AIProviderError(
          'Gemini API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.message?.includes('API key')) {
        throw new AIProviderError(
          'Gemini API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.message?.includes('rate limit')) {
        throw new AIProviderError(
          'Rate Limit erreicht. Bitte versuchen Sie es später erneut.',
          'RATE_LIMIT',
          429
        )
      }

      throw new AIProviderError(
        'Fehler bei der Textverarbeitung. Bitte versuchen Sie es erneut.',
        'UNKNOWN_ERROR',
        500
      )
    }
  }

  async generateTitle(text: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: 20, // Sehr kurz für Titel
          temperature: 0.3, // Niedrige Temperatur für konsistente Ergebnisse
        }
      })

      const prompt = `Du bist ein Assistent für die Erstellung von kurzen, prägnanten Titeln im digitalen Antragswesen von Gefangenen im Gefängnis. Erstelle einen Titel mit maximal 5 Wörtern, der den Inhalt des Antrags präzise zusammenfasst. Der Titel soll für Mitarbeiter verständlich sein. Antworte nur mit dem Titel, ohne Anführungszeichen oder zusätzliche Erklärungen.

Text: "${text}"`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const title = response.text()

      if (!title) {
        throw new AIProviderError('Kein Titel generiert', 'NO_RESPONSE', 500)
      }

      return title.trim()
    } catch (error: any) {
      console.error('Gemini Titel-Generierung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei translate
      if (error.message?.includes('quota')) {
        throw new AIProviderError(
          'Gemini API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.message?.includes('API key')) {
        throw new AIProviderError(
          'Gemini API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.message?.includes('rate limit')) {
        throw new AIProviderError(
          'Rate Limit erreicht. Bitte versuchen Sie es später erneut.',
          'RATE_LIMIT',
          429
        )
      }

      throw new AIProviderError(
        'Fehler bei der Titel-Generierung. Bitte versuchen Sie es erneut.',
        'UNKNOWN_ERROR',
        500
      )
    }
  }


  async translateTitleToOriginal(germanTitle: string, originalText: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: 20, // Sehr kurz für Titel
          temperature: 0.3, // Niedrige Temperatur für konsistente Übersetzung
        }
      })

      const prompt = `Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Du erhältst einen kurzen deutschen Titel von einem Antrag und einen zugeöhrigen beschreibenden Text, den ein Insasse in einer fremden Sprache geschrieben hat, der möglicherweise Fehler enthält. Der zugehörige Text ist in einer anderen Sprache als der deutsche Titel. Es wird ein Titel benötigt, der in der gleichen Sprache wie der beschreibende Text ist. Erstelle daher einen kurzen und prägnanten Titel, der in der gleichen Sprache wie der beschreibende Text ist und orientiere dich inhaltlich (nicht sprachlich) an dem deutschen Titel. Antworte nur mit dem neu übersetzten Titel, ohne Anführungszeichen oder zusätzliche Erklärungen.

Hier sind ein deutscher Titel und der beschreibende dazugehörige nicht-deutsche Text, an dessen Sprache du dich orientieren sollst:

Deutscher Titel: "${germanTitle}"

Beschreibender Text, an dessen Sprache du dich orientieren sollst: "${originalText}"

Generiere einen neuen Titel, der in der gleichen Sprache sein MUSS wie der beschreibende Text und orientiere dich inhaltlich (nicht sprachlich) an dem deutschen Titel. WICHTIG: Auch bei fehlerhaften Texten MUSS der neue Titel in der gleichen Sprache sein wie der beschreibende Text, auch wenn diese Sprache nicht perfekt ist.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const translatedTitle = response.text()

      if (!translatedTitle) {
        throw new AIProviderError('Kein übersetzter Titel generiert', 'NO_RESPONSE', 500)
      }

      return translatedTitle.trim()
    } catch (error: any) {
      console.error('Gemini Titel-Übersetzung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei anderen Methoden
      if (error.message?.includes('quota')) {
        throw new AIProviderError(
          'Gemini API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.message?.includes('API key')) {
        throw new AIProviderError(
          'Gemini API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.message?.includes('rate limit')) {
        throw new AIProviderError(
          'Rate Limit erreicht. Bitte versuchen Sie es später erneut.',
          'RATE_LIMIT',
          429
        )
      }

      throw new AIProviderError(
        'Fehler bei der Titel-Übersetzung. Bitte versuchen Sie es erneut.',
        'UNKNOWN_ERROR',
        500
      )
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const model = this.client.getGenerativeModel({ model: this.config.model })
      await model.generateContent('Test')
      return true
    } catch (error) {
      console.error('Gemini Health Check Fehler:', error)
      return false
    }
  }

  getProviderName(): string {
    return 'Google Gemini'
  }
}
