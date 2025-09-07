import { AIProvider } from './AIProvider'
import { OpenAIProvider } from './OpenAIProvider'
import { GeminiProvider } from './GeminiProvider'
import { ClaudeProvider } from './ClaudeProvider'
import { AI_CONFIG, getProviderConfig } from '../../config/ai'

/**
 * AI Provider Factory
 * Erstellt Provider-Instanzen basierend auf der Konfiguration
 */
export class AIProviderFactory {
  private static instance: AIProvider | null = null

  /**
   * Erstellt oder gibt die aktuelle Provider-Instanz zurück
   */
  static getProvider(): AIProvider {
    if (!this.instance) {
      this.instance = this.createProvider(AI_CONFIG.provider)
    }
    return this.instance
  }

  /**
   * Erstellt eine neue Provider-Instanz für den angegebenen Provider
   */
  static createProvider(provider: string): AIProvider {
    try {
      const config = getProviderConfig(provider)
      
      switch (provider) {
        case 'openai':
          return new OpenAIProvider(config)
        
        case 'gemini':
          return new GeminiProvider(config)
        
        case 'claude':
          return new ClaudeProvider(config)
        
        default:
          throw new Error(`Unbekannter AI Provider: ${provider}`)
      }
    } catch (error) {
      console.error(`Fehler beim Erstellen des ${provider} Providers:`, error)
      
      // Fallback auf Standard-Provider
      if (provider !== AI_CONFIG.fallbackProvider) {
        console.log(`Fallback auf ${AI_CONFIG.fallbackProvider} Provider`)
        return this.createProvider(AI_CONFIG.fallbackProvider)
      }
      
      throw error
    }
  }

  /**
   * Erstellt eine Provider-Instanz mit Fallback-Mechanismus
   */
  static getProviderWithFallback(): AIProvider {
    try {
      return this.getProvider()
    } catch (error) {
      console.error('Hauptprovider fehlgeschlagen, versuche Fallback:', error)
      
      if (AI_CONFIG.fallbackProvider && AI_CONFIG.fallbackProvider !== AI_CONFIG.provider) {
        try {
          return this.createProvider(AI_CONFIG.fallbackProvider)
        } catch (fallbackError) {
          console.error('Fallback Provider fehlgeschlagen:', fallbackError)
        }
      }
      
      throw new Error('Alle AI Provider sind nicht verfügbar')
    }
  }

  /**
   * Setzt die Provider-Instanz zurück (für Tests oder Provider-Wechsel)
   */
  static resetProvider(): void {
    this.instance = null
  }

  /**
   * Gibt alle verfügbaren Provider zurück
   */
  static getAvailableProviders(): string[] {
    const providers: string[] = []
    
    if (AI_CONFIG.apiKeys.openai) providers.push('openai')
    if (AI_CONFIG.apiKeys.gemini) providers.push('gemini')
    if (AI_CONFIG.apiKeys.claude) providers.push('claude')
    
    return providers
  }

  /**
   * Überprüft die Verfügbarkeit aller konfigurierten Provider
   */
  static async checkAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}
    const providers = this.getAvailableProviders()
    
    for (const provider of providers) {
      try {
        const providerInstance = this.createProvider(provider)
        results[provider] = await providerInstance.healthCheck()
      } catch (error) {
        console.error(`Provider ${provider} Health Check fehlgeschlagen:`, error)
        results[provider] = false
      }
    }
    
    return results
  }
}
