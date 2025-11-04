import express, { Request, Response } from 'express'
import { body, validationResult } from 'express-validator'
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth'
import { chatSessionManager } from '../services/chatSession'
import {
  processChatMessage,
  extractServiceData,
  validateCompleteness,
  createInitialGreeting
} from '../services/smartServiceChat'
import { PrismaClient } from '@prisma/client'
import { AIProviderFactory } from '../services/ai/AIProviderFactory'
import multer from 'multer'

const router = express.Router()
const prisma = new PrismaClient()

// Multer-Konfiguration für Audio-Upload
// Speichert Audio-Dateien im Memory (nicht auf Disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB (Whisper API Limit)
  },
  fileFilter: (req, file, cb) => {
    // Erlaube nur Audio-Formate
    const allowedMimes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 
      'audio/webm', 'audio/mp4', 'audio/x-m4a'
    ]
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Ungültiges Audio-Format. Unterstützt: mp3, wav, m4a, webm'))
    }
  }
})

/**
 * POST /api/smart-service/chat/start
 * Startet eine neue Chat-Session
 */
router.post(
  '/chat/start',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Nicht authentifiziert' })
      }

      // Hole Sprache aus Request
      const language = req.body.language || 'de'

      // Erstelle neue Session mit initialer Sprache
      const session = chatSessionManager.createSession(userId, language)

      // Hole User-Informationen für personalisierte Begrüßung
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      })
      
      const userName = user ? `${user.firstName} ${user.lastName}` : undefined
      const currentDate = new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Generiere Begrüßung (im JSON-Format)
      let greetingJson = 'Hallo! Wie kann ich Ihnen heute bei Ihrer Antragstellung helfen?'
      let greetingMessage = greetingJson
      
      try {
        const greetingRaw = await createInitialGreeting(userName, currentDate, language)
        
        // Versuche JSON zu parsen
        try {
          const parsed = JSON.parse(greetingRaw)
          greetingJson = greetingRaw
          greetingMessage = parsed.chatMessage || greetingRaw
        } catch (parseError) {
          // Falls kein JSON, verwende als Fallback
          greetingMessage = greetingRaw
        }
      } catch (error) {
        console.error('Fehler bei Begrüßungsgenerierung:', error)
        // Verwende Standard-Begrüßung als Fallback
        greetingJson = JSON.stringify({
          chatMessage: 'Hallo! Wie kann ich Ihnen heute bei Ihrer Antragstellung helfen?',
          isReady: false,
          extractedData: {
            serviceType: 'FREETEXT',
            title: '',
            description: '',
            fields: {}
          }
        })
        greetingMessage = 'Hallo! Wie kann ich Ihnen heute bei Ihrer Antragstellung helfen?'
      }

      // Begrüßung zur Session hinzufügen (nur die Chat-Nachricht, nicht das gesamte JSON)
      chatSessionManager.updateSession(session.sessionId, {
        role: 'assistant',
        content: greetingMessage
      })

      // Logge Begrüßung in Konsole
      console.log('[SmartService] 🤖 Chatbot-Begrüßung:', {
        sessionId: session.sessionId,
        userName: userName || 'Unbekannt',
        language,
        greeting: greetingMessage,
        greetingLength: greetingMessage.length
      })

      res.json({
        success: true,
        sessionId: session.sessionId,
        greeting: greetingMessage
      })
    } catch (error: any) {
      console.error('Chat-Start Fehler:', error)
      res.status(500).json({ error: 'Fehler beim Starten des Chats' })
    }
  }
)

/**
 * POST /api/smart-service/chat/message
 * Sendet eine Nachricht an den Chatbot
 */
router.post(
  '/chat/message',
  authenticateToken,
  [
    body('sessionId').notEmpty().withMessage('Session-ID ist erforderlich'),
    body('message').notEmpty().withMessage('Nachricht ist erforderlich')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Nicht authentifiziert' })
      }

      const { sessionId, message, language } = req.body

      // Prüfe ob Session existiert und dem User gehört
      const session = chatSessionManager.getSession(sessionId)
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: 'Session nicht gefunden' })
      }

      // Hole User-Informationen für personalisierten Chat
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true }
      })
      
      const userName = user ? `${user.firstName} ${user.lastName}` : undefined
      const userLanguage = language || 'de'
      const currentDate = new Date().toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      // Verarbeite Nachricht
      const result = await processChatMessage(sessionId, message, userName, currentDate, userLanguage)

      res.json({
        success: true,
        response: result.response,
        isComplete: result.isComplete,
        extractedData: result.extractedData,
        missingFields: result.missingFields
      })
    } catch (error: any) {
      console.error('Chat-Nachricht Fehler:', error)
      res.status(500).json({ 
        error: 'Fehler bei der Chat-Verarbeitung',
        message: error.message 
      })
    }
  }
)

/**
 * GET /api/smart-service/chat/:sessionId/status
 * Prüft den Status einer Chat-Session
 */
router.get(
  '/chat/:sessionId/status',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Nicht authentifiziert' })
      }

      const { sessionId } = req.params

      const session = chatSessionManager.getSession(sessionId)
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: 'Session nicht gefunden' })
      }

      // Versuche Daten zu extrahieren
      let extractedData = session.extractedData
      let isReady = false
      let missingFields: string[] = []

      if (session.messages.length > 0) {
        try {
          extractedData = await extractServiceData(session.messages)
          const serviceType = extractedData.serviceType || 'FREETEXT'
          
          // Hole letzte Assistant-Nachricht für Signal-Erkennung
          const lastAssistantMessage = session.messages
            .filter(msg => msg.role === 'assistant')
            .pop()?.content || ''
          
          const validation = await validateCompleteness(serviceType, extractedData, lastAssistantMessage)
          isReady = validation.isComplete
          missingFields = validation.missingFields
          extractedData = validation.finalData // Verwende finalData (mit generiertem Titel)
        } catch (error) {
          console.error('Status-Check Fehler:', error)
        }
      }

      res.json({
        success: true,
        isReady,
        extractedData,
        missingFields,
        messageCount: session.messages.length
      })
    } catch (error: any) {
      console.error('Status-Check Fehler:', error)
      res.status(500).json({ error: 'Fehler beim Status-Check' })
    }
  }
)

/**
 * POST /api/smart-service/finalize
 * Finalisiert den Antrag und erstellt den Service
 * Nutzt exakt die gleiche Logik wie /services/my/services
 */
router.post(
  '/finalize',
  authenticateToken,
  [
    body('sessionId').notEmpty().withMessage('Session-ID ist erforderlich'),
    body('title').notEmpty().withMessage('Titel ist erforderlich'),
    body('description').notEmpty().withMessage('Beschreibung ist erforderlich'),
    body('serviceType').notEmpty().withMessage('Service-Typ ist erforderlich')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
      }

      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Nicht authentifiziert' })
      }

      const { sessionId, title, description, titleInmate, descriptionInmate, serviceType } = req.body

      // Prüfe Session
      const session = chatSessionManager.getSession(sessionId)
      if (!session || session.userId !== userId) {
        return res.status(404).json({ error: 'Session nicht gefunden' })
      }

      // Benutzerdaten aus der Datenbank abrufen (wie in /services/my/services)
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })

      if (!user) {
        return res.status(404).json({ error: 'Benutzer nicht gefunden' })
      }

      // Default-Priorität für Insassen-Anträge (null = keine besondere Priorität)
      const priority = null

      // Übersetze Titel und Beschreibung ins Deutsche für Mitarbeiter
      // Verwende die bestehende translate-Methode wie in /services/my/services
      const aiProvider = AIProviderFactory.createProvider('openai')
      let finalTitle = titleInmate || title
      let finalDescription = descriptionInmate || description

      try {
        if (aiProvider) {
          // Übersetze Titel ins Deutsche (nur wenn titleInmate vorhanden)
          if (titleInmate && titleInmate.trim() !== '') {
            finalTitle = await aiProvider.translate(titleInmate)
          }
          
          // Übersetze Beschreibung ins Deutsche (nur wenn descriptionInmate vorhanden)
          if (descriptionInmate && descriptionInmate.trim() !== '') {
            finalDescription = await aiProvider.translate(descriptionInmate)
          }
        }
      } catch (error) {
        console.error('Fehler bei Übersetzung:', error)
        // Bei Fehler: Verwende Original-Text als Fallback
        finalTitle = titleInmate || title
        finalDescription = descriptionInmate || description
      }

      // Workflow-Regel: Anträge von Insassen automatisch entsprechenden Gruppen zuweisen
      // EXAKT die gleiche Logik wie in /services/my/services
      let assignedToGroup = null
      try {
        // Prüfen ob der Benutzer ein Insasse ist (PS Inmates Gruppe)
        const userGroups = await prisma.userGroup.findMany({
          where: { userId: userId },
          include: {
            group: true
          }
        } as any)
        
        const isInmate = userGroups.some((ug: any) => ug.group.name === 'PS Inmates')
        
        if (isInmate) {
          const finalServiceType = serviceType || 'FREETEXT'
          
          if (finalServiceType === 'PARTICIPATION_MONEY') {
            // Taschengeldanträge an Vollzugsabteilungsleitung (VAL)
            const valGroup = await prisma.group.findFirst({
              where: { name: 'PS Vollzugsabteilungsleitung' }
            })
            
            if (valGroup) {
              assignedToGroup = valGroup.id
            }
          } else {
            // Freitextanträge und andere an General Enforcement Service (AVDs)
            const enforcementGroup = await prisma.group.findFirst({
              where: { name: 'PS General Enforcement Service' }
            })
            
            if (enforcementGroup) {
              assignedToGroup = enforcementGroup.id
            }
          }
        }
      } catch (error) {
        console.log('Fehler bei Workflow-Regel:', error)
      }

      // Erstelle Service (exakt wie in /services/my/services)
      const service = await prisma.service.create({
        data: {
          title: finalTitle, // Deutsche Übersetzung für Mitarbeiter
          titleInmate: titleInmate || null, // Original für Insassen
          description: finalDescription, // Deutsche Übersetzung für Mitarbeiter
          descriptionInmate: descriptionInmate || null, // Original für Insassen
          priority,
          serviceType: serviceType || 'FREETEXT',
          createdBy: userId,
          assignedToGroup: assignedToGroup as any
        },
        include: {
          createdByUser: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true
            }
          }
        }
      } as any)

      // Aktivität erstellen (exakt wie in /services/my/services)
      await prisma.activity.create({
        data: {
          recordId: service.id,
          who: `${user.firstName} ${user.lastName} (${user.username})`,
          action: 'created',
          details: 'Antrag über Smart-Chat erstellt',
          userId: userId
        }
      })

      // Aktivität für automatische Gruppenzuweisung loggen (falls vorhanden)
      if (assignedToGroup) {
        // Die tatsächlich zugewiesene Gruppe abrufen
        const assignedGroup = await prisma.group.findFirst({
          where: { id: assignedToGroup }
        })
        
        await prisma.activity.create({
          data: {
            recordId: service.id,
            who: 'System',
            action: 'forward',
            details: `Automatisch zugewiesen an ${assignedGroup?.description}`,
            userId: userId,
            groupId: assignedToGroup as any
          } as any
        })
      }

      // Session löschen
      chatSessionManager.deleteSession(sessionId)

      // Gleiche Response-Struktur wie /services/my/services
      res.status(201).json({
        message: 'Antrag erfolgreich erstellt',
        service
      })
    } catch (error: any) {
      console.error('Finalisierung Fehler:', error)
      res.status(500).json({ 
        error: 'Fehler bei der Antragserstellung',
        message: error.message 
      })
    }
  }
)

/**
 * POST /api/smart-service/chat/audio
 * Empfängt Audio-Datei, transkribiert sie mit Whisper und gibt Text zurück
 */
router.post(
  '/chat/audio',
  authenticateToken,
  upload.single('audio'), // Multer-Middleware für Audio-Upload
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Nicht authentifiziert' })
      }

      const { sessionId, language } = req.body

      // Prüfe ob Session existiert und dem User gehört
      if (sessionId) {
        const session = chatSessionManager.getSession(sessionId)
        if (!session || session.userId !== userId) {
          return res.status(404).json({ error: 'Session nicht gefunden' })
        }
      }

      // Prüfe ob Audio-Datei vorhanden ist
      if (!req.file) {
        return res.status(400).json({ error: 'Keine Audio-Datei hochgeladen' })
      }

      // Prüfe Dateigröße
      if (req.file.size > 25 * 1024 * 1024) {
        return res.status(400).json({ error: 'Audio-Datei ist zu groß. Maximale Größe: 25 MB' })
      }

      // Hole OpenAI Provider
      const aiProvider = AIProviderFactory.createProvider('openai')
      if (!aiProvider || !aiProvider.speechToText) {
        return res.status(500).json({ error: 'Audio-Transkription nicht verfügbar' })
      }

      // Konvertiere Buffer zu FileBuffer für OpenAI
      const audioBuffer = req.file.buffer
      const filename = req.file.originalname || 'audio.webm'

      // Logge Audio-Upload
      console.log('[SmartService] Audio-Upload erhalten:', {
        sessionId: sessionId || 'keine',
        userId,
        filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        language: language || 'auto'
      })

      // Transkribiere Audio mit Whisper
      const transcript = await aiProvider.speechToText(
        audioBuffer,
        language || undefined,
        filename
      )

      // Logge Transkription
      console.log('[SmartService] Audio-Transkription erfolgreich:', {
        sessionId: sessionId || 'keine',
        transcriptLength: transcript.length,
        preview: transcript.substring(0, 100)
      })

      // Gibt Transkript zurück
      res.json({
        success: true,
        transcript,
        language: language || 'auto'
      })
    } catch (error: any) {
      console.error('[SmartService] Audio-Upload Fehler:', error)
      console.error('[SmartService] Fehler-Details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        statusCode: error.statusCode,
        response: error.response?.data,
        stack: error.stack
      })
      
      // Prüfe ob es ein AIProviderError ist
      if (error.code === 'QUOTA_EXCEEDED' || error.code === 'QUOTA_EXCEEDED') {
        return res.status(402).json({ 
          error: 'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.'
        })
      } else if (error.code === 'INVALID_API_KEY') {
        return res.status(401).json({ 
          error: 'Ungültiger OpenAI API-Schlüssel.'
        })
      } else if (error.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({ 
          error: 'Audio-Datei ist zu groß. Maximale Größe: 25 MB'
        })
      } else if (error.code === 'INVALID_FORMAT') {
        return res.status(400).json({ 
          error: 'Ungültiges Audio-Format. Unterstützt: mp3, wav, m4a, webm'
        })
      } else {
        // Detaillierte Fehlermeldung für Debugging
        return res.status(500).json({ 
          error: 'Fehler bei der Audio-Transkription',
          message: error.message || error.response?.data?.message || 'Unbekannter Fehler',
          details: process.env.NODE_ENV === 'development' ? {
            code: error.code,
            status: error.status,
            response: error.response?.data
          } : undefined
        })
      }
    }
  }
)

// TTS Route: Text-to-Speech für Assistant-Antworten
router.post(
  '/chat/tts',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.userId
      if (!userId) {
        return res.status(401).json({ error: 'Nicht authentifiziert' })
      }

      const { text, language, voice } = req.body

      // Validierung
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ 
          error: 'Text ist erforderlich' 
        })
      }

      // Maximal 5000 Zeichen für TTS (OpenAI Limit)
      if (text.length > 5000) {
        return res.status(400).json({ 
          error: 'Text ist zu lang. Maximum: 5000 Zeichen' 
        })
      }

      // AI Provider initialisieren
      const aiProvider = AIProviderFactory.createProvider('openai')

      if (!aiProvider.textToSpeech) {
        return res.status(501).json({ 
          error: 'Text-to-Speech wird von diesem Provider nicht unterstützt' 
        })
      }

      // Logge TTS-Anfrage mit Timing
      const ttsStartTime = Date.now()
      console.log('[SmartService] TTS-Anfrage erhalten:', {
        userId,
        textLength: text.length,
        language: language || 'auto',
        voice: voice || 'nova'
      })

      // Generiere Audio mit TTS
      const audioBuffer = await aiProvider.textToSpeech(
        text,
        language || undefined,
        voice || 'nova'
      )

      // Berechne Metriken
      const ttsDuration = Date.now() - ttsStartTime
      const audioSizeKB = Math.round((audioBuffer.length / 1024) * 100) / 100
      const audioSizeMB = Math.round((audioBuffer.length / (1024 * 1024)) * 100) / 100
      
      // Geschätzte Audio-Dauer (ca. 1 Sekunde = ~16 KB für MP3/TTS, kann variieren)
      // OpenAI TTS gibt MP3 zurück, typischerweise ~16-20 KB pro Sekunde
      const estimatedAudioDuration = Math.round((audioBuffer.length / 16000) * 10) / 10

      // Logge TTS-Erfolg mit Metriken
      console.log('[SmartService] TTS erfolgreich:', {
        userId,
        textLength: text.length,
        audioSizeBytes: audioBuffer.length,
        audioSizeKB: `${audioSizeKB} KB`,
        audioSizeMB: audioSizeMB > 0.1 ? `${audioSizeMB} MB` : undefined,
        estimatedDuration: `${estimatedAudioDuration}s`,
        generationTime: `${ttsDuration}ms`,
        voice: voice || 'nova',
        bytesPerSecond: Math.round(audioBuffer.length / (estimatedAudioDuration || 1))
      })

      // Setze Content-Type Header für Audio
      res.setHeader('Content-Type', 'audio/mpeg')
      res.setHeader('Content-Length', audioBuffer.length.toString())
      
      // Sende Audio-Buffer als Response
      res.send(audioBuffer)
    } catch (error: any) {
      console.error('[SmartService] TTS Fehler:', error)
      console.error('[SmartService] TTS Fehler-Details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        statusCode: error.statusCode,
        response: error.response?.data,
        stack: error.stack
      })
      
      // Spezifische Fehlerbehandlung
      if (error.code === 'QUOTA_EXCEEDED') {
        return res.status(402).json({ 
          error: 'OpenAI API Limit erreicht. Bitte versuchen Sie es später erneut.'
        })
      } else if (error.code === 'INVALID_API_KEY') {
        return res.status(401).json({ 
          error: 'Ungültiger OpenAI API-Schlüssel.'
        })
      } else if (error.code === 'TTS_ERROR') {
        return res.status(500).json({ 
          error: 'Fehler bei der Text-to-Speech Konvertierung',
          message: error.message || 'Unbekannter Fehler'
        })
      } else {
        return res.status(500).json({ 
          error: 'Fehler bei der Text-to-Speech Konvertierung',
          message: error.message || error.response?.data?.message || 'Unbekannter Fehler',
          details: process.env.NODE_ENV === 'development' ? {
            code: error.code,
            status: error.status,
            response: error.response?.data
          } : undefined
        })
      }
    }
  }
)

export default router

