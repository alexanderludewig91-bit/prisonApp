import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { AIProviderFactory } from '../services/ai/AIProviderFactory'
import { AIProviderError } from '../services/ai/AIProvider'
import { AI_CONFIG, validateAIConfig } from '../config/ai'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

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
  body('text').notEmpty().withMessage('Text ist erforderlich').isLength({ min: 1, max: 2000 }).withMessage('Text muss zwischen 1 und 2000 Zeichen lang sein'),
  body('language').optional().isString().withMessage('Sprache muss ein String sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { text, language } = req.body

    // AI Provider mit Fallback verwenden
    const aiProvider = AIProviderFactory.getProviderWithFallback()
    
    if (AI_CONFIG.debug) {
      console.log(`Verwende AI Provider: ${aiProvider.getProviderName()}`)
      console.log(`Eingestellte Sprache: ${language}`)
    }

    // Sprachbasierte Logik: Wenn Deutsch, dann nur Titel generieren
    if (language === 'de') {
      // Nur Titel generieren (aus dem deutschen Text)
      const generatedTitle = await aiProvider.generateTitle(text)
      
      res.json({
        success: true,
        originalText: text,
        translatedText: text, // Keine Übersetzung nötig
        generatedTitle: generatedTitle,
        originalTitle: generatedTitle, // Beide Titel identisch auf Deutsch
        provider: aiProvider.getProviderName(),
        languageMode: 'german'
      })
    } else {
      // Vollständige KI-Pipeline: Übersetzung + beide Titel
      const translatedText = await aiProvider.translate(text)
      const generatedTitle = await aiProvider.generateTitle(translatedText)
      const originalTitle = await aiProvider.translateTitleToOriginal(generatedTitle, text)

      res.json({
        success: true,
        originalText: text,
        translatedText: translatedText,
        generatedTitle: generatedTitle,
        originalTitle: originalTitle,
        provider: aiProvider.getProviderName(),
        languageMode: 'translation'
      })
    }

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

// KI-gestützte Antrags-Kategorisierung
router.post('/categorize-service', [
  authenticateToken,
  body('description').notEmpty().withMessage('Beschreibung ist erforderlich').isLength({ min: 1, max: 2000 }).withMessage('Beschreibung muss zwischen 1 und 2000 Zeichen lang sein')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { description } = req.body

    // Nur OpenAI Provider verwenden
    const aiProvider = AIProviderFactory.createProvider('openai')
    if (!aiProvider) {
      return res.status(500).json({ error: 'OpenAI Provider nicht verfügbar' })
    }

    // Kategorisierung über Provider-Methode
    const result = await aiProvider.categorizeService(description)

    res.json({
      success: true,
      suggestedServiceType: result.suggestedServiceType,
      confidence: result.confidence,
      reasoning: result.reasoning,
      provider: 'openai'
    })

  } catch (error: any) {
    console.error('AI Categorization Fehler:', error)
    
    if (error instanceof AIProviderError) {
      return res.status(error.statusCode).json({ 
        error: error.message,
        code: error.code,
        provider: 'openai'
      })
    }

    // Fallback bei Fehlern
    res.json({
      success: true,
      suggestedServiceType: 'FREETEXT',
      confidence: 0.1,
      reasoning: 'Fehler bei der KI-Analyse, als Freitextantrag behandelt',
      provider: 'openai'
    })
  }
})

// Activity-Übersetzung
router.post('/translate-activity', [
  authenticateToken,
  body('activityId').isInt().withMessage('Activity ID ist erforderlich'),
  body('targetLanguage').optional().isString().withMessage('Zielsprache muss ein String sein')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { activityId, targetLanguage } = req.body

    // Activity finden
    const activity = await prisma.activity.findUnique({
      where: { id: Number(activityId) },
      include: {
        service: {
          select: {
            createdBy: true
          }
        }
      }
    })

    if (!activity) {
      return res.status(404).json({ error: 'Aktivität nicht gefunden' })
    }

    // Prüfen, ob der Benutzer berechtigt ist
    if (activity.service?.createdBy !== req.user?.userId) {
      return res.status(403).json({ error: 'Nicht berechtigt, diese Aktivität zu übersetzen' })
    }

    // Übersetzung wird immer neu erstellt (für besseres Testen)

    // AI Provider initialisieren
    const aiProvider = AIProviderFactory.createProvider(AI_CONFIG.provider)
    if (!aiProvider) {
      return res.status(500).json({ error: 'AI Provider nicht verfügbar' })
    }

    // Text übersetzen (nur wenn targetLanguage nicht 'de' ist)
    let translatedText = activity.details || ''
    if (targetLanguage && targetLanguage !== 'de') {
      // Für Rückfragen: Deutsche Rückfrage in die Zielsprache übersetzen
      try {
        translatedText = await aiProvider.translateToLanguage(activity.details || '', targetLanguage)
      } catch (error) {
        console.error('Fehler bei Rückfragen-Übersetzung:', error)
        // Fallback: Originaltext beibehalten
        translatedText = activity.details || ''
      }
    }

    // Übersetzung in der Datenbank speichern
    await prisma.activity.update({
      where: { id: Number(activityId) },
      data: { translatedDetails: translatedText } as any // Temporärer Workaround bis Prisma-Client neu generiert ist
    })

    res.json({
      success: true,
      translatedText: translatedText,
      message: 'Aktivität erfolgreich übersetzt'
    })

  } catch (error: any) {
    console.error('Activity translation error:', error)
    
    if (error instanceof AIProviderError) {
      return res.status(500).json({ 
        error: 'AI-Übersetzungsfehler', 
        details: error.message 
      })
    }
    
    res.status(500).json({ error: 'Fehler beim Übersetzen der Aktivität' })
  }
})

export default router
