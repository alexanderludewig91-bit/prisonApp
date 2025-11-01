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

  async generateResponse(prompt: string): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new AIProviderError('Keine Antwort erhalten', 'NO_RESPONSE', 500)
      }

      return response.trim()
    } catch (error: any) {
      console.error('OpenAI generateResponse Fehler:', error)
      
      // OpenAI-spezifische Fehlerbehandlung
      if (error.code === 'insufficient_quota') {
        throw new AIProviderError(
          'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      } else if (error.code === 'invalid_api_key') {
        throw new AIProviderError(
          'Ungültiger OpenAI API-Schlüssel.',
          'INVALID_API_KEY',
          401
        )
      } else if (error.code === 'rate_limit_exceeded') {
        throw new AIProviderError(
          'OpenAI Rate Limit erreicht. Bitte versuchen Sie es später erneut.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      } else {
        throw new AIProviderError(
          `OpenAI API Fehler: ${error.message}`,
          'API_ERROR',
          500
        )
      }
    }
  }

  async categorizeService(description: string): Promise<{
    suggestedServiceType: string;
    confidence: number;
    reasoning: string;
  }> {
    try {
      const prompt = `
Analysiere den folgenden Antragstext und bestimme den passenden Antragstyp.
Wähle aus den verfügbaren Kategorien: VISIT, HEALTH, CONVERSATION, BOOKINGS_FINANCE, LEISURE_EDUCATION, COUNSELING_SUPPORT, PERSONAL_PROPERTY, WORK_SCHOOL, PACKAGE, PRISON_RELAXATION, FREETEXT

Antragstext: "${description}"

Beispiele für Kategorien:
- VISIT: Besuche im Gefängnis (nicht außerhalb), Familienbesuche im Gefängnis, Besuchswünsche im Gefängnis
- HEALTH: Krankheit, Arzt, Medizin, Schmerzen, medizinische Probleme
- CONVERSATION: Gespräch mit Personal, Aussprache, Klärung
- BOOKINGS_FINANCE: Geld, Überweisung, Kontostand, finanzielle Angelegenheiten
- LEISURE_EDUCATION: Freizeit, Bildung, Kurse, Sport, Hobby
- COUNSELING_SUPPORT: Beratung, Hilfe, Unterstützung, Seelsorge
- PERSONAL_PROPERTY: Gegenstände, Kleidung, Sachen aus der Kammer
- WORK_SCHOOL: Arbeit, Schule, Ausbildung, Arbeitsplatz
- PACKAGE: Paket, Sendung, Post, Päckchen
- PRISON_RELAXATION: Lockerung, Ausgang, Vollzugslockerung, Urlaub, Gefägnis vorübergehend verlassen, Besuche außerhalb des Gefängnisses
- FREETEXT: Allgemeine Anliegen, die nicht in andere Kategorien passen

Antwort im JSON-Format:
{
  "suggestedServiceType": "VISIT",
  "confidence": 0.85,
  "reasoning": "Text enthält Besuchswünsche und Familienbezug"
}
`

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: "system",
            content: "Du bist ein Assistent für die Kategorisierung von Anträgen im Gefängniswesen. Analysiere den gegebenen Text und kategorisiere ihn in eine der verfügbaren Antragskategorien. Antworte ausschließlich im JSON-Format ohne zusätzliche Erklärungen."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: 0.3 // Niedrigere Temperatur für konsistentere Kategorisierung
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new AIProviderError('Keine Kategorisierung erhalten', 'NO_RESPONSE', 500)
      }

      // JSON aus der Antwort extrahieren
      let categorizationResult
      try {
        // Versuche JSON zu parsen (manchmal kommt zusätzlicher Text)
        const jsonMatch = response.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          categorizationResult = JSON.parse(jsonMatch[0])
        } else {
          categorizationResult = JSON.parse(response)
        }
      } catch (parseError) {
        console.error('JSON Parse Error:', parseError)
        console.error('AI Response:', response)
        
        // Fallback: Als FREETEXT kategorisieren
        return {
          suggestedServiceType: 'FREETEXT',
          confidence: 0.1,
          reasoning: 'KI-Analyse fehlgeschlagen, als Freitextantrag behandelt'
        }
      }

      // Validierung der Antwort
      const validServiceTypes = ['VISIT', 'HEALTH', 'CONVERSATION', 'BOOKINGS_FINANCE', 'LEISURE_EDUCATION', 'COUNSELING_SUPPORT', 'PERSONAL_PROPERTY', 'WORK_SCHOOL', 'PACKAGE', 'PRISON_RELAXATION', 'FREETEXT']
      
      if (!validServiceTypes.includes(categorizationResult.suggestedServiceType)) {
        return {
          suggestedServiceType: 'FREETEXT',
          confidence: 0.1,
          reasoning: 'Ungültige Kategorie erkannt, als Freitextantrag behandelt'
        }
      }

      return {
        suggestedServiceType: categorizationResult.suggestedServiceType,
        confidence: Math.max(0, Math.min(1, categorizationResult.confidence || 0.1)),
        reasoning: categorizationResult.reasoning || 'Keine Begründung verfügbar'
      }

    } catch (error: any) {
      console.error('OpenAI categorizeService Fehler:', error)
      
      // OpenAI-spezifische Fehlerbehandlung
      if (error.code === 'insufficient_quota') {
        throw new AIProviderError(
          'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      } else if (error.code === 'invalid_api_key') {
        throw new AIProviderError(
          'Ungültiger OpenAI API-Schlüssel.',
          'INVALID_API_KEY',
          401
        )
      } else if (error.code === 'rate_limit_exceeded') {
        throw new AIProviderError(
          'OpenAI Rate Limit erreicht. Bitte versuchen Sie es später erneut.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      } else {
        // Bei anderen Fehlern: Fallback zurückgeben statt Error werfen
        return {
          suggestedServiceType: 'FREETEXT',
          confidence: 0.1,
          reasoning: 'Fehler bei der KI-Analyse, als Freitextantrag behandelt'
        }
      }
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

  /**
   * Chat-Service für Konversationen mit Kontext
   */
  async chatService(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    temperature: number = 0.7
  ): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          ...messages
        ],
        max_tokens: this.config.maxTokens,
        temperature
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new AIProviderError('Keine Antwort erhalten', 'NO_RESPONSE', 500)
      }

      return response.trim()
    } catch (error: any) {
      console.error('OpenAI Chat Service Fehler:', error)

      if (error.code === 'insufficient_quota') {
        throw new AIProviderError(
          'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.',
          'QUOTA_EXCEEDED',
          402
        )
      } else if (error.code === 'invalid_api_key') {
        throw new AIProviderError(
          'Ungültiger OpenAI API-Schlüssel.',
          'INVALID_API_KEY',
          401
        )
      } else if (error.code === 'rate_limit_exceeded') {
        throw new AIProviderError(
          'OpenAI Rate Limit erreicht. Bitte versuchen Sie es später erneut.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      } else {
        throw new AIProviderError(
          'Fehler bei der Chat-Verarbeitung. Bitte versuchen Sie es erneut.',
          'CHAT_ERROR',
          500
        )
      }
    }
  }
}
