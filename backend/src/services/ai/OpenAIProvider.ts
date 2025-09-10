import OpenAI from 'openai'
import { AIProvider, AIProviderConfig, AIProviderError } from './AIProvider'

/**
 * OpenAI Provider Implementation
 */
export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey
    })
  }

  async translate(text: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "Du bist ein Übersetzungsassistent. Übersetze den gegebenen Text direkt ins Deutsche. Antworte nur mit der deutschen Übersetzung, ohne zusätzliche Erklärungen oder Formatierung."
          },
          {
            role: "user",
            content: `Übersetze ins Deutsche: "${text}"`
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })

      const translatedText = completion.choices[0]?.message?.content
      if (!translatedText) {
        throw new AIProviderError('Keine Übersetzung erhalten', 'NO_RESPONSE', 500)
      }

      return translatedText.trim()
    } catch (error: any) {
      console.error('OpenAI API Fehler:', error)
      
      // OpenAI-spezifische Fehlerbehandlung
      if (error.code === 'insufficient_quota') {
        throw new AIProviderError(
          'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.code === 'invalid_api_key') {
        throw new AIProviderError(
          'OpenAI API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.code === 'rate_limit_exceeded') {
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
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "Du bist ein Assistent für die Erstellung von kurzen, prägnanten Titeln. Erstelle einen Titel mit maximal 5 Wörtern, der den Inhalt des Textes präzise zusammenfasst. Antworte nur mit dem Titel, ohne Anführungszeichen oder zusätzliche Erklärungen."
          },
          {
            role: "user",
            content: `Erstelle einen kurzen Titel (max. 5 Wörter) für diesen Text: "${text}"`
          }
        ],
        max_tokens: 20, // Sehr kurz für Titel
        temperature: 0.3 // Niedrige Temperatur für konsistente Ergebnisse
      })

      const title = completion.choices[0]?.message?.content
      if (!title) {
        throw new AIProviderError('Kein Titel generiert', 'NO_RESPONSE', 500)
      }

      return title.trim()
    } catch (error: any) {
      console.error('OpenAI Titel-Generierung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei translate
      if (error.code === 'insufficient_quota') {
        throw new AIProviderError(
          'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.code === 'invalid_api_key') {
        throw new AIProviderError(
          'OpenAI API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.code === 'rate_limit_exceeded') {
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
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "You are an assistant for creating short, concise titles. You will receive a text and need to create a title in the EXACT SAME LANGUAGE as the input text. Do NOT translate to German, English, or any other language. Keep the original language. The title should summarize the content precisely. Respond only with the title, without quotes or additional explanations.\n\nExamples:\n- Persian text → Persian title\n- Arabic text → Arabic title\n- Spanish text → Spanish title\n- French text → French title"
          },
          {
            role: "user",
            content: `Create a short title (max 5 words) in the EXACT SAME LANGUAGE as this text. The title must be in the same language as the input text - do not translate it to any other language: "${text}"`
          }
        ],
        max_tokens: 20, // Sehr kurz für Titel
        temperature: 0.7 // Höhere Temperatur für bessere Spracherkennung
      })

      const title = completion.choices[0]?.message?.content
      if (!title) {
        throw new AIProviderError('Kein Original-Titel generiert', 'NO_RESPONSE', 500)
      }

      return title.trim()
    } catch (error: any) {
      console.error('OpenAI Original-Titel-Generierung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei generateTitle
      if (error.code === 'insufficient_quota') {
        throw new AIProviderError(
          'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.code === 'invalid_api_key') {
        throw new AIProviderError(
          'OpenAI API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.code === 'rate_limit_exceeded') {
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
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "You are a translation assistant. You will receive a German title and an original text. Translate the German title into the EXACT SAME LANGUAGE as the original text. Do NOT translate to English or any other language. Keep the original language. Respond only with the translated title, without quotes or additional explanations."
          },
          {
            role: "user",
            content: `Translate this German title into the same language as the original text below:\n\nGerman title: "${germanTitle}"\n\nOriginal text: "${originalText}"\n\nTranslate the German title into the EXACT SAME LANGUAGE as the original text.`
          }
        ],
        max_tokens: 20, // Sehr kurz für Titel
        temperature: 0.3 // Niedrige Temperatur für konsistente Übersetzung
      })

      const translatedTitle = completion.choices[0]?.message?.content
      if (!translatedTitle) {
        throw new AIProviderError('Kein übersetzter Titel generiert', 'NO_RESPONSE', 500)
      }

      return translatedTitle.trim()
    } catch (error: any) {
      console.error('OpenAI Titel-Übersetzung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei anderen Methoden
      if (error.code === 'insufficient_quota') {
        throw new AIProviderError(
          'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.code === 'invalid_api_key') {
        throw new AIProviderError(
          'OpenAI API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.code === 'rate_limit_exceeded') {
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
      await this.client.chat.completions.create({
        model: this.config.model,
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 1
      })
      return true
    } catch (error) {
      console.error('OpenAI Health Check Fehler:', error)
      return false
    }
  }

  getProviderName(): string {
    return 'OpenAI'
  }
}
