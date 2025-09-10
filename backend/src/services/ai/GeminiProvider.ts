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

      const prompt = `Du bist ein Übersetzungsassistent. Übersetze den gegebenen Text direkt ins Deutsche. Antworte nur mit der deutschen Übersetzung, ohne zusätzliche Erklärungen oder Formatierung.

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

      const prompt = `Du bist ein Assistent für die Erstellung von kurzen, prägnanten Titeln. Erstelle einen Titel mit maximal 5 Wörtern, der den Inhalt des Textes präzise zusammenfasst. Antworte nur mit dem Titel, ohne Anführungszeichen oder zusätzliche Erklärungen.

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

  async generateOriginalTitle(text: string): Promise<string> {
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: 20, // Sehr kurz für Titel
          temperature: 0.7, // Höhere Temperatur für bessere Spracherkennung
        }
      })

      const prompt = `You are an assistant for creating short, concise titles. You will receive a text and need to create a title in the EXACT SAME LANGUAGE as the input text. Do NOT translate to German, English, or any other language. Keep the original language. The title should summarize the content precisely. Respond only with the title, without quotes or additional explanations.

Examples:
- Persian text → Persian title
- Arabic text → Arabic title  
- Spanish text → Spanish title
- French text → French title

Text: "${text}"

Create a short title (max 5 words) in the EXACT SAME LANGUAGE as the text above. The title must be in the same language as the input text - do not translate it to any other language.`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const title = response.text()

      if (!title) {
        throw new AIProviderError('Kein Original-Titel generiert', 'NO_RESPONSE', 500)
      }

      return title.trim()
    } catch (error: any) {
      console.error('Gemini Original-Titel-Generierung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei generateTitle
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
        'Fehler bei der Original-Titel-Generierung. Bitte versuchen Sie es erneut.',
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

      const prompt = `You are a translation assistant. You will receive a German title and an original text. Translate the German title into the EXACT SAME LANGUAGE as the original text. Do NOT translate to English or any other language. Keep the original language. Respond only with the translated title, without quotes or additional explanations.

German title: "${germanTitle}"

Original text: "${originalText}"

Translate the German title into the EXACT SAME LANGUAGE as the original text.`

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
