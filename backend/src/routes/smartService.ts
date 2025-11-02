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

const router = express.Router()
const prisma = new PrismaClient()

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

export default router

