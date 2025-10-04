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
        system: "Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Übersetze den gegebenen Text direkt ins Deutsche. Sollte der Text bereits in deutscher Sprache übermittelt werden, lasse ihn unverändert. Antworte nur mit der deutschen Übersetzung, ohne zusätzliche Erklärungen oder Formatierung.",
        messages: [
          {
            role: "user",
            content: `Übersetze ins Deutsche, falls es nicht bereits deutsch ist: "${text}"`
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
        system: "Du bist ein Assistent für die Erstellung von kurzen, prägnanten Titeln im digitalen Antragswesen von Gefangenen im Gefängnis. Erstelle einen Titel mit maximal 5 Wörtern, der den Inhalt des Antrags präzise zusammenfasst. Der Titel soll für Mitarbeiter verständlich sein. Antworte nur mit dem Titel, ohne Anführungszeichen oder zusätzliche Erklärungen.",
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


  async translateTitleToOriginal(germanTitle: string, originalText: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: 20, // Sehr kurz für Titel
        temperature: 0.3, // Niedrige Temperatur für konsistente Übersetzung
        system: "Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Du erhältst einen kurzen deutschen Titel von einem Antrag und einen zugeöhrigen beschreibenden Text, den ein Insasse in einer fremden Sprache geschrieben hat, der möglicherweise Fehler enthält. Der zugehörige Text ist in einer anderen Sprache als der deutsche Titel. Es wird ein Titel benötigt, der in der gleichen Sprache wie der beschreibende Text ist. Erstelle daher einen kurzen und prägnanten Titel, der in der gleichen Sprache wie der beschreibende Text ist und orientiere dich inhaltlich (nicht sprachlich) an dem deutschen Titel. Antworte nur mit dem neu übersetzten Titel, ohne Anführungszeichen oder zusätzliche Erklärungen.",
        messages: [
          {
            role: "user",
            content: `Hier sind ein deutscher Titel und der beschreibende dazugehörige nicht-deutsche Text, an dessen Sprache du dich orientieren sollst:\n\nDeutscher Titel: "${germanTitle}"\n\nBeschreibender Text, an dessen Sprache du dich orientieren sollst: "${originalText}"\n\n Generiere einen neuen Titel, der in der gleichen Sprache sein MUSS wie der beschreibende Text und orientiere dich inhaltlich (nicht sprachlich) an dem deutschen Titel. WICHTIG: Auch bei fehlerhaften Texten MUSS der neue Titel in der gleichen Sprache sein wie der beschreibende Text, auch wenn diese Sprache nicht perfekt ist.`
          }
        ]
      })

      const translatedTitle = message.content[0]?.type === 'text' ? message.content[0].text : null

      if (!translatedTitle) {
        throw new AIProviderError('Kein übersetzter Titel generiert', 'NO_RESPONSE', 500)
      }

      return translatedTitle.trim()
    } catch (error: any) {
      console.error('Claude Titel-Übersetzung Fehler:', error)
      
      // Gleiche Fehlerbehandlung wie bei anderen Methoden
      if (error.status === 402) {
        throw new AIProviderError(
          'Claude API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      }
      
      if (error.status === 401) {
        throw new AIProviderError(
          'Claude API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }

      if (error.status === 429) {
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

  async translateToLanguage(text: string, targetLanguage: string): Promise<string> {
    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: "user",
            content: `Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Übersetze den gegebenen deutschen Text in die Zielsprache. Antworte nur mit der Übersetzung, ohne zusätzliche Erklärungen oder Formatierung.

Übersetze den folgenden deutschen Text in ${targetLanguage}: "${text}"`
          }
        ]
      })

      const translatedText = (response.content[0] as any)?.text
      if (!translatedText) {
        throw new AIProviderError('Keine Übersetzung erhalten', 'NO_RESPONSE', 500)
      }

      return translatedText.trim()
    } catch (error: any) {
      console.error('Claude Übersetzung Fehler:', error)
      
      if (error.status === 401) {
        throw new AIProviderError(
          'Claude API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.',
          'INVALID_API_KEY',
          500
        )
      }
      
      throw new AIProviderError(
        'Fehler bei der Übersetzung. Bitte versuchen Sie es erneut.',
        'TRANSLATION_ERROR',
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

  async generateResponse(prompt: string): Promise<string> {
    try {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })

      const generatedText = message.content[0]?.type === 'text' ? message.content[0].text : null
      
      if (!generatedText) {
        throw new AIProviderError('Keine Antwort erhalten', 'NO_RESPONSE', 500)
      }

      return generatedText.trim()
    } catch (error: any) {
      console.error('Claude generateResponse Fehler:', error)
      
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

  async categorizeService(description: string): Promise<{
    suggestedServiceType: string;
    confidence: number;
    reasoning: string;
  }> {
    // Da wir nur OpenAI für Kategorisierung verwenden, geben wir einen Fallback zurück
    return {
      suggestedServiceType: 'FREETEXT',
      confidence: 0.1,
      reasoning: 'Claude Provider unterstützt keine Service-Kategorisierung. Verwenden Sie OpenAI.'
    }
  }
}
