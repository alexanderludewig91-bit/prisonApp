/**
 * AI Provider Konfiguration
 */
export const AI_CONFIG = {
  // Aktueller Provider (openai, gemini, claude)
  provider: process.env.AI_PROVIDER || 'openai',
  
  // Model-Konfigurationen für verschiedene Provider
  models: {
    openai: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    gemini: process.env.GEMINI_MODEL || 'gemini-pro',
    claude: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229'
  },
  
  // Allgemeine Einstellungen
  maxTokens: parseInt(process.env.AI_MAX_TOKENS || '1000'),
  temperature: parseFloat(process.env.AI_TEMPERATURE || '0.3'),
  
  // API Keys
  apiKeys: {
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GEMINI_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY
  },
  
  // Fallback-Konfiguration
  fallbackProvider: process.env.AI_FALLBACK_PROVIDER || 'openai',
  
  // Debug-Modus
  debug: process.env.AI_DEBUG === 'true'
}

/**
 * Validiert die AI-Konfiguration
 */
export function validateAIConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Provider validieren
  const validProviders = ['openai', 'gemini', 'claude']
  if (!validProviders.includes(AI_CONFIG.provider)) {
    errors.push(`Ungültiger AI Provider: ${AI_CONFIG.provider}. Erlaubt: ${validProviders.join(', ')}`)
  }
  
  // API Key für aktuellen Provider validieren
  const currentApiKey = AI_CONFIG.apiKeys[AI_CONFIG.provider as keyof typeof AI_CONFIG.apiKeys]
  if (!currentApiKey) {
    errors.push(`API Key für Provider ${AI_CONFIG.provider} nicht gefunden`)
  }
  
  // Fallback Provider validieren
  if (AI_CONFIG.fallbackProvider && !validProviders.includes(AI_CONFIG.fallbackProvider)) {
    errors.push(`Ungültiger Fallback Provider: ${AI_CONFIG.fallbackProvider}`)
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Gibt die Konfiguration für einen spezifischen Provider zurück
 */
export function getProviderConfig(provider: string) {
  const apiKey = AI_CONFIG.apiKeys[provider as keyof typeof AI_CONFIG.apiKeys]
  const model = AI_CONFIG.models[provider as keyof typeof AI_CONFIG.models]
  
  if (!apiKey) {
    throw new Error(`API Key für Provider ${provider} nicht gefunden`)
  }
  
  return {
    apiKey,
    model,
    maxTokens: AI_CONFIG.maxTokens,
    temperature: AI_CONFIG.temperature
  }
}
