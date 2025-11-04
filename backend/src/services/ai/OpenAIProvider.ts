import OpenAI from 'openai'
import { toFile } from 'openai'
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

  /**
   * Speech-to-Text mit Whisper API
   * Konvertiert Audio-Datei in Text
   * @param audioFile - Audio-Datei als Buffer (Node.js) oder File (Browser)
   * @param language - Optionale Sprache (z.B. 'de', 'en')
   * @param filename - Dateiname mit Extension (z.B. 'audio.webm')
   */
  async speechToText(audioFile: Buffer | File, language?: string, filename: string = 'audio.webm'): Promise<string> {
    try {
      // Konvertiere zu Buffer falls nötig
      let buffer: Buffer
      let actualFilename: string
      
      if (Buffer.isBuffer(audioFile)) {
        buffer = audioFile
        actualFilename = filename
      } else {
        // Browser File-Objekt: Konvertiere zu Buffer
        const arrayBuffer = await (audioFile as File).arrayBuffer()
        buffer = Buffer.from(arrayBuffer)
        actualFilename = (audioFile as File).name || filename
      }

      // OpenAI SDK in Node.js: Verwende toFile() Helper-Funktion
      // Das SDK stellt toFile() bereit, um verschiedene Input-Typen in File zu konvertieren
      // Buffer ist ein unterstützter Input-Typ für toFile()
      const file = await toFile(
        buffer, // Buffer direkt übergeben
        actualFilename, // Dateiname
        { type: 'audio/webm' } // MIME-Type
      )

      // Whisper API aufrufen
      // OpenAI SDK akzeptiert File-Objekte direkt (von toFile() erstellt)
      const transcription = await this.client.audio.transcriptions.create({
        file: file,
        model: 'whisper-1',
        language: language || undefined, // Optional: Sprache angeben (z.B. 'de', 'en')
        response_format: 'text' // Text-Format zurückgeben
      })

      // Whisper gibt den transkribierten Text zurück
      // response_format: 'text' gibt direkt einen String zurück
      const transcript = typeof transcription === 'string' 
        ? transcription 
        : (transcription as any).text || ''

      if (!transcript || transcript.trim().length === 0) {
        throw new AIProviderError('Keine Transkription erhalten', 'NO_TRANSCRIPTION', 500)
      }

      console.log('[OpenAI] Whisper Transkription erfolgreich:', {
        length: transcript.length,
        preview: transcript.substring(0, 100),
        language: language || 'auto',
        filename
      })

      return transcript.trim()
    } catch (error: any) {
      console.error('[OpenAI] Whisper Fehler:', error)

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
      } else if (error.message?.includes('file size') || error.message?.includes('too large')) {
        throw new AIProviderError(
          'Audio-Datei ist zu groß. Maximale Größe: 25 MB',
          'FILE_TOO_LARGE',
          400
        )
      } else if (error.message?.includes('format') || error.message?.includes('type') || error.message?.includes('invalid')) {
        throw new AIProviderError(
          'Ungültiges Audio-Format. Unterstützt: mp3, wav, m4a, webm',
          'INVALID_FORMAT',
          400
        )
      } else {
        throw new AIProviderError(
          `Fehler bei der Audio-Transkription: ${error.message || 'Unbekannter Fehler'}`,
          'TRANSCRIPTION_ERROR',
          500
        )
      }
    }
  }

  /**
   * Text-to-Speech: Konvertiert Text in Audio
   * @param text - Text der gesprochen werden soll
   * @param language - Optionale Sprache (z.B. 'de', 'en')
   * @param voice - Optionale Stimme (z.B. 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
   * @returns Promise mit Audio-Daten als Buffer
   */
  async textToSpeech(text: string, language?: string, voice: string = 'nova'): Promise<Buffer> {
    try {
      // OpenAI TTS API aufrufen
      // Das SDK gibt einen Response mit Audio-Daten zurück
      const response = await this.client.audio.speech.create({
        model: 'tts-1', // oder 'tts-1-hd' für höhere Qualität
        voice: voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer',
        input: text,
        // Sprache wird automatisch erkannt, aber wir können sie explizit setzen
        // (OpenAI TTS unterstützt verschiedene Sprachen basierend auf dem Text)
      })

      // Konvertiere Response zu Buffer
      // Das SDK gibt ein Response-Objekt zurück, das ein ArrayBuffer enthält
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Berechne Metriken für bessere Lesbarkeit
      const audioSizeKB = Math.round((buffer.length / 1024) * 100) / 100
      const estimatedDuration = Math.round((buffer.length / 16000) * 10) / 10
      
      console.log('[OpenAI] TTS erfolgreich:', {
        textLength: text.length,
        audioSizeBytes: buffer.length,
        audioSizeKB: `${audioSizeKB} KB`,
        estimatedDuration: `${estimatedDuration}s`,
        voice,
        language: language || 'auto',
        bytesPerSecond: Math.round(buffer.length / (estimatedDuration || 1))
      })

      return buffer
    } catch (error: any) {
      console.error('[OpenAI] TTS Fehler:', error)

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
          `Fehler bei der Text-to-Speech Konvertierung: ${error.message || 'Unbekannter Fehler'}`,
          'TTS_ERROR',
          500
        )
      }
    }
  }
}
