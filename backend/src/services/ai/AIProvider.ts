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
   * Überprüft die Verfügbarkeit des AI-Services
   * @returns Promise mit dem Gesundheitsstatus
   */
  healthCheck(): Promise<boolean>

  /**
   * Gibt den Namen des Providers zurück
   * @returns Provider-Name
   */
  getProviderName(): string
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
