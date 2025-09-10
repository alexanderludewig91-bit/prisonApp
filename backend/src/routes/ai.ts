import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken } from '../middleware/auth'
import { AIProviderFactory } from '../services/ai/AIProviderFactory'
import { AIProviderError } from '../services/ai/AIProvider'
import { AI_CONFIG, validateAIConfig } from '../config/ai'

const router = Router()

// AI-Konfiguration beim Start validieren
console.log('=== AI Configuration ===')
const configValidation = validateAIConfig()
console.log('Aktueller Provider:', AI_CONFIG.provider)
console.log('Verfügbare Provider:', AIProviderFactory.getAvailableProviders())
console.log('Konfiguration gültig:', configValidation.isValid)
if (!configValidation.isValid) {
  console.error('Konfigurationsfehler:', configValidation.errors)
}
console.log('========================')

// KI-Textverarbeitung Route
router.post('/translate', [
  authenticateToken,
  body('text').notEmpty().withMessage('Text ist erforderlich').isLength({ min: 1, max: 2000 }).withMessage('Text muss zwischen 1 und 2000 Zeichen lang sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { text } = req.body

    // AI Provider mit Fallback verwenden
    const aiProvider = AIProviderFactory.getProviderWithFallback()
    
    if (AI_CONFIG.debug) {
      console.log(`Verwende AI Provider: ${aiProvider.getProviderName()}`)
    }

    // Schritt 1: Übersetzung und deutscher Titel
    const translatedText = await aiProvider.translate(text)
    const generatedTitle = await aiProvider.generateTitle(translatedText)
    
    // Schritt 2: Original-Titel als Übersetzung des deutschen Titels
    const originalTitle = await aiProvider.translateTitleToOriginal(generatedTitle, text)

    res.json({
      success: true,
      originalText: text,
      translatedText: translatedText,
      generatedTitle: generatedTitle,
      originalTitle: originalTitle,
      provider: aiProvider.getProviderName()
    })

  } catch (error: any) {
    console.error('AI API Fehler:', error)
    
    // AIProviderError behandeln
    if (error instanceof AIProviderError) {
      return res.status(error.statusCode).json({ 
        error: error.message,
        code: error.code,
        provider: AI_CONFIG.provider
      })
    }

    // Allgemeine Fehlerbehandlung
    res.status(500).json({ 
      error: 'Fehler bei der Textverarbeitung. Bitte versuchen Sie es erneut.',
      provider: AI_CONFIG.provider
    })
  }
})

// Gesundheitscheck für KI-Service
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Alle Provider überprüfen
    const providerStatus = await AIProviderFactory.checkAllProviders()
    const currentProvider = AIProviderFactory.getProvider()
    const isHealthy = await currentProvider.healthCheck()

    res.json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      currentProvider: currentProvider.getProviderName(),
      providerStatus,
      availableProviders: AIProviderFactory.getAvailableProviders(),
      config: {
        provider: AI_CONFIG.provider,
        fallbackProvider: AI_CONFIG.fallbackProvider,
        debug: AI_CONFIG.debug
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('AI Health Check Fehler:', error)
    res.status(503).json({
      status: 'unhealthy',
      error: 'AI Service nicht verfügbar',
      availableProviders: AIProviderFactory.getAvailableProviders(),
      timestamp: new Date().toISOString()
    })
  }
})

// Provider-Status Route (für Debugging)
router.get('/providers', async (req: Request, res: Response) => {
  try {
    const availableProviders = AIProviderFactory.getAvailableProviders()
    const providerStatus = await AIProviderFactory.checkAllProviders()
    
    res.json({
      availableProviders,
      providerStatus,
      currentProvider: AI_CONFIG.provider,
      fallbackProvider: AI_CONFIG.fallbackProvider,
      config: AI_CONFIG
    })
  } catch (error) {
    console.error('Provider Status Fehler:', error)
    res.status(500).json({
      error: 'Fehler beim Abrufen der Provider-Informationen'
    })
  }
})

export default router
