/**
 * AI Provider Interface
 * Definiert die einheitliche Schnittstelle für alle KI-Anbieter
 */
export interface AIProvider {
  /**
   * Übersetzt Text ins Deutsche
   * @param text - Der zu übersetzende Text
   * @returns Promise mit der deutschen Übersetzung
   */
  translate(text: string): Promise<string>

  /**
   * Generiert einen kurzen Titel (max. 5 Wörter) aus dem Text
   * @param text - Der Text für die Titel-Generierung
   * @returns Promise mit dem generierten Titel
   */
  generateTitle(text: string): Promise<string>


  /**
   * Übersetzt einen deutschen Titel in die Originalsprache
   * @param germanTitle - Der deutsche Titel
   * @param originalText - Der ursprüngliche Text zur Spracherkennung
   * @returns Promise mit dem übersetzten Titel in der Originalsprache
   */
  translateTitleToOriginal(germanTitle: string, originalText: string): Promise<string>

  /**
   * Übersetzt deutschen Text in eine bestimmte Zielsprache
   * @param text - Der deutsche Text
   * @param targetLanguage - Die Zielsprache (z.B. 'en', 'tr', 'ar')
   * @returns Promise mit der Übersetzung in die Zielsprache
   */
  translateToLanguage(text: string, targetLanguage: string): Promise<string>

  /**
   * Generiert eine allgemeine Antwort basierend auf einem Prompt
   * @param prompt - Der Prompt für die KI
   * @returns Promise mit der generierten Antwort
   */
  generateResponse(prompt: string): Promise<string>

  /**
   * Chat-Service für Konversationen mit Kontext
   * @param systemPrompt - Der System-Prompt für die KI
   * @param messages - Array von Chat-Nachrichten (User/Assistant)
   * @param temperature - Temperatur für die Antwort-Generierung (optional)
   * @returns Promise mit der generierten Antwort
   */
  chatService(
    systemPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    temperature?: number
  ): Promise<string>

  /**
   * Kategorisiert einen Antragstext und schlägt den passenden ServiceType vor
   * @param description - Der Antragstext zur Analyse
   * @returns Promise mit Kategorisierungs-Ergebnis
   */
  categorizeService(description: string): Promise<{
    suggestedServiceType: string;
    confidence: number;
    reasoning: string;
  }>

  /**
   * Überprüft die Verfügbarkeit des AI-Services
   * @returns Promise mit dem Gesundheitsstatus
   */
  healthCheck(): Promise<boolean>

  /**
   * Gibt den Namen des Providers zurück
   * @returns Provider-Name
   */
  getProviderName(): string

  /**
   * Speech-to-Text: Konvertiert Audio-Datei in Text
   * @param audioFile - Audio-Datei als Buffer oder File
   * @param language - Optionale Sprache (z.B. 'de', 'en')
   * @param filename - Dateiname mit Extension (z.B. 'audio.webm')
   * @returns Promise mit dem transkribierten Text
   */
  speechToText?(audioFile: Buffer | File, language?: string, filename?: string): Promise<string>

  /**
   * Text-to-Speech: Konvertiert Text in Audio
   * @param text - Text der gesprochen werden soll
   * @param language - Optionale Sprache (z.B. 'de', 'en')
   * @param voice - Optionale Stimme (z.B. 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer')
   * @returns Promise mit Audio-Daten als Buffer
   */
  textToSpeech?(text: string, language?: string, voice?: string): Promise<Buffer>
}

/**
 * AI Provider Konfiguration
 */
export interface AIProviderConfig {
  apiKey: string
  model: string
  maxTokens: number
  temperature: number
}

/**
 * AI Provider Fehler
 */
export class AIProviderError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}
