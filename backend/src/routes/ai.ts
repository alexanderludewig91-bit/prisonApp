import { Router, Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import OpenAI from 'openai'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// OpenAI Client initialisieren
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key-here'
})

// Debug: API Key beim Start prüfen
console.log('=== OpenAI Configuration ===')
console.log('API Key vorhanden:', !!process.env.OPENAI_API_KEY)
console.log('API Key beginnt mit sk-:', process.env.OPENAI_API_KEY?.startsWith('sk-'))
console.log('API Key Länge:', process.env.OPENAI_API_KEY?.length)
console.log('============================')

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

    // OpenAI API aufrufen
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Du bist ein Übersetzungsassistent. Übersetze den gegebenen Text direkt ins Deutsche. Antworte nur mit der deutschen Übersetzung, ohne zusätzliche Erklärungen oder Formatierung."
        },
        {
          role: "user",
          content: `Übersetze ins Deutsche: "${text}"`
        }
      ],
      max_tokens: 1000,
      temperature: 0.3
    })

    const translatedText = completion.choices[0]?.message?.content || 'Übersetzung fehlgeschlagen'

    res.json({
      success: true,
      originalText: text,
      translatedText: translatedText.trim()
    })

  } catch (error: any) {
    console.error('OpenAI API Fehler:', error)
    
    // Spezifische Fehlerbehandlung
    if (error.code === 'insufficient_quota') {
      return res.status(402).json({ 
        error: 'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.' 
      })
    }
    
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ 
        error: 'OpenAI API Konfigurationsfehler. Bitte kontaktieren Sie den Administrator.' 
      })
    }

    res.status(500).json({ 
      error: 'Fehler bei der Textverarbeitung. Bitte versuchen Sie es erneut.' 
    })
  }
})

// Gesundheitscheck für KI-Service
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Debug: API Key Status prüfen
    const apiKey = process.env.OPENAI_API_KEY
    console.log('OpenAI API Key vorhanden:', !!apiKey)
    console.log('API Key beginnt mit sk-:', apiKey?.startsWith('sk-'))
    
    // Einfacher Test-Aufruf an OpenAI
    await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Test" }],
      max_tokens: 1
    })

    res.json({
      status: 'healthy',
      service: 'OpenAI API',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'OpenAI API',
      error: 'Service nicht verfügbar',
      timestamp: new Date().toISOString()
    })
  }
})

export default router
