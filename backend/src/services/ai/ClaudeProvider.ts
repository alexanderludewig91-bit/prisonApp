import Anthropic from '@anthropic-ai/sdk'
import { AIProvider, AIProviderConfig, AIProviderError } from './AIProvider'

/**
 * Anthropic Claude Provider Implementation
 */
export class ClaudeProvider implements AIProvider {
  private client: Anthropic
  private config: AIProviderConfig

  constructor(config: AIProviderConfig) {
    this.config = config
    this.client = new Anthropic({
      apiKey: config.apiKey
    })
  }

  async translate(text: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: "Du bist ein Übersetzungsassistent. Übersetze den gegebenen Text direkt ins Deutsche. Antworte nur mit der deutschen Übersetzung, ohne zusätzliche Erklärungen oder Formatierung.",
        messages: [
          {
            role: "user",
            content: `Übersetze ins Deutsche: "${text}"`
          }
        ]
      })

      const translatedText = message.content[0]?.type === 'text' ? message.content[0].text : null
      
      if (!translatedText) {
        throw new AIProviderError('Keine Übersetzung erhalten', 'NO_RESPONSE', 500)
      }

      return translatedText.trim()
    } catch (error: any) {
      console.error('Claude API Fehler:', error)
      
      // Claude-spezifische Fehlerbehandlung
      if (error.status === 402 || error.message?.includes('quota')) {
        throw new AIProviderError(
          'Claude API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.status === 401 || error.message?.includes('API key')) {
        throw new AIProviderError(
          'Claude API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.status === 429 || error.message?.includes('rate limit')) {
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
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 20, // Sehr kurz für Titel
        temperature: 0.3, // Niedrige Temperatur für konsistente Ergebnisse
        system: "Du bist ein Assistent für die Erstellung von kurzen, prägnanten Titeln. Erstelle einen Titel mit maximal 5 Wörtern, der den Inhalt des Textes präzise zusammenfasst. Antworte nur mit dem Titel, ohne Anführungszeichen oder zusätzliche Erklärungen.",
        messages: [
          {
            role: "user",
            content: `Erstelle einen kurzen Titel (max. 5 Wörter) für diesen Text: "${text}"`
          }
        ]
      })

      const title = message.content[0]?.type === 'text' ? message.content[0].text : null
      
      if (!title) {
        throw new AIProviderError('Kein Titel generiert', 'NO_RESPONSE', 500)
      }

      return title.trim()
    } catch (error: any) {
      console.error('Claude Titel-Generierung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei translate
      if (error.status === 402 || error.message?.includes('quota')) {
        throw new AIProviderError(
          'Claude API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.status === 401 || error.message?.includes('API key')) {
        throw new AIProviderError(
          'Claude API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.status === 429 || error.message?.includes('rate limit')) {
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

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.messages.create({
        model: this.config.model,
        max_tokens: 1,
        messages: [
          {
            role: "user",
            content: "Test"
          }
        ]
      })
      return true
    } catch (error) {
      console.error('Claude Health Check Fehler:', error)
      return false
    }
  }

  getProviderName(): string {
    return 'Anthropic Claude'
  }
}
