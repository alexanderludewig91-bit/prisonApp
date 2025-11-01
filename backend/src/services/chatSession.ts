/**
 * Chat Session Manager
 * Verwaltet Chat-Sessions für die Smart-Antragsstellung
 */

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ServiceData {
  serviceType?: string
  title?: string
  description?: string
  titleInmate?: string
  descriptionInmate?: string
  fields?: Record<string, any>
}

export interface ChatSession {
  sessionId: string
  userId: number
  messages: ChatMessage[]
  extractedData: Partial<ServiceData>
  createdAt: Date
  expiresAt: Date
}

class ChatSessionManager {
  private sessions: Map<string, ChatSession> = new Map()
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000 // 30 Minuten

  /**
   * Erstellt eine neue Chat-Session
   */
  createSession(userId: number): ChatSession {
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.SESSION_TIMEOUT)

    const session: ChatSession = {
      sessionId,
      userId,
      messages: [],
      extractedData: {},
      createdAt: now,
      expiresAt
    }

    this.sessions.set(sessionId, session)
    return session
  }

  /**
   * Holt eine Session anhand der Session-ID
   */
  getSession(sessionId: string): ChatSession | null {
    const session = this.sessions.get(sessionId)
    
    if (!session) {
      return null
    }

    // Prüfe ob Session abgelaufen ist
    if (new Date() > session.expiresAt) {
      this.sessions.delete(sessionId)
      return null
    }

    return session
  }

  /**
   * Aktualisiert eine Session mit neuen Nachrichten
   */
  updateSession(sessionId: string, message: ChatMessage, extractedData?: Partial<ServiceData>): boolean {
    const session = this.getSession(sessionId)
    
    if (!session) {
      return false
    }

    // Nachricht hinzufügen
    session.messages.push(message)

    // Extrahierte Daten aktualisieren falls vorhanden
    if (extractedData) {
      session.extractedData = {
        ...session.extractedData,
        ...extractedData
      }
    }

    // Expiry-Zeit verlängern
    session.expiresAt = new Date(new Date().getTime() + this.SESSION_TIMEOUT)

    return true
  }

  /**
   * Löscht eine Session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId)
  }

  /**
   * Räumt abgelaufene Sessions auf
   */
  cleanupExpiredSessions(): void {
    const now = new Date()
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now > session.expiresAt) {
        this.sessions.delete(sessionId)
      }
    }
  }

  /**
   * Holt alle Sessions eines Users (für Debugging)
   */
  getUserSessions(userId: number): ChatSession[] {
    return Array.from(this.sessions.values()).filter(session => session.userId === userId)
  }
}

// Singleton-Instanz
export const chatSessionManager = new ChatSessionManager()

// Periodisches Cleanup (alle 10 Minuten)
setInterval(() => {
  chatSessionManager.cleanupExpiredSessions()
}, 10 * 60 * 1000)

