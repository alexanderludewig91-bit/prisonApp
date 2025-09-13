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
            content: "Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Übersetze den gegebenen Text direkt ins Deutsche. Sollte der Text bereits in deutscher Sprache übermittelt werden, lasse ihn unverändert. Antworte nur mit der deutschen Übersetzung, ohne zusätzliche Erklärungen oder Formatierung."
          },
          {
            role: "user",
            content: `Übersetze ins Deutsche, falls es nicht bereits deutsch ist: "${text}"`
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
            content: "Du bist ein Assistent für die Erstellung von kurzen, prägnanten Titeln im digitalen Antragswesen von Gefangenen im Gefängnis. Erstelle einen Titel mit maximal 5 Wörtern, der den Inhalt des Antrags präzise zusammenfasst. Der Titel soll für Mitarbeiter verständlich sein. Antworte nur mit dem Titel, ohne Anführungszeichen oder zusätzliche Erklärungen."
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


  async translateTitleToOriginal(germanTitle: string, originalText: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Du erhältst einen kurzen deutschen Titel von einem Antrag und einen zugeöhrigen beschreibenden Text, den ein Insasse in einer fremden Sprache geschrieben hat, der möglicherweise Fehler enthält. Der zugehörige Text ist in einer anderen Sprache als der deutsche Titel. Es wird ein Titel benötigt, der in der gleichen Sprache wie der beschreibende Text ist. Erstelle daher einen kurzen und prägnanten Titel, der in der gleichen Sprache wie der beschreibende Text ist und orientiere dich inhaltlich (nicht sprachlich) an dem deutschen Titel. Antworte nur mit dem neu übersetzten Titel, ohne Anführungszeichen oder zusätzliche Erklärungen."
          },
          {
            role: "user",
            content: `Hier sind ein deutscher Titel und der beschreibende dazugehörige nicht-deutsche Text, an dessen Sprache du dich orientieren sollst:\n\nDeutscher Titel: "${germanTitle}"\n\nBeschreibender Text, an dessen Sprache du dich orientieren sollst: "${originalText}"\n\n Generiere einen neuen Titel, der in der gleichen Sprache sein MUSS wie der beschreibende Text und orientiere dich inhaltlich (nicht sprachlich) an dem deutschen Titel. WICHTIG: Auch bei fehlerhaften Texten MUSS der neue Titel in der gleichen Sprache sein wie der beschreibende Text, auch wenn diese Sprache nicht perfekt ist.`
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

  async translateToLanguage(text: string, targetLanguage: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: `Du bist ein Übersetzungsassistent für das digitale Antragswesen von Gefangenen im Gefängnis. Übersetze den gegebenen deutschen Text in die Zielsprache. Antworte nur mit der Übersetzung, ohne zusätzliche Erklärungen oder Formatierung.`
          },
          {
            role: "user",
            content: `Übersetze den folgenden deutschen Text in ${targetLanguage}: "${text}"`
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
      console.error('OpenAI Übersetzung Fehler:', error)
      
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
      
      throw new AIProviderError(
        'Fehler bei der Übersetzung. Bitte versuchen Sie es erneut.',
        'TRANSLATION_ERROR',
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
