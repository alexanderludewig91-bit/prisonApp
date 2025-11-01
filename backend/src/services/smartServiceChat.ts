import { AIProviderFactory } from './ai/AIProviderFactory'
import { chatSessionManager, ChatMessage, ServiceData } from './chatSession'

/**
 * Service-Typ Definitionen mit Beschreibungen und benötigten Feldern
 */
const SERVICE_TYPE_DEFINITIONS = `
Verfügbare Antragstypen und deren benötigte Informationen:

1. VISIT - Besuchsantrag
   Beschreibung: Besuchsanmeldung, Besuchseintragung, Besuchszusammenführung, Videobesuch, Langzeitbesuch
   Benötigte Informationen: Besuchstyp (z.B. Familienbesuch, Videobesuch), geplantes Datum, Besucherinformationen (wenn bekannt)

2. HEALTH - Gesundheit
   Beschreibung: Anfragen für Gespräche beim Arzt, Pastor, Diakon oder Psychologe sowie für Soziales Training, Anti-Aggressionstraining
   Benötigte Informationen: Art des Gesundheitsproblems oder Anliegen, Dringlichkeit (wenn zutreffend)

3. CONVERSATION - Gesprächsanfrage
   Beschreibung: Anfrage von Terminen mit Anstaltsleitung, Arbeitsinspektor oder Ausländerbeauftragtem
   Benötigte Informationen: Gesprächspartner (z.B. Anstaltsleitung), Grund für das Gespräch

4. BOOKINGS_FINANCE - Geldtransfer
   Beschreibung: Überweisung von Hausgeld/Eigengeld/Überbrückungsgeld, Haupteinkauf, Auszahlung zum Freigang
   Benötigte Informationen: Betrag (wenn bekannt), Zweck (z.B. Überweisung, Auszahlung), Empfänger (wenn zutreffend)

5. LEISURE_EDUCATION - Freizeit & Bildung
   Beschreibung: Spielegruppe, Gottesdienst, Elterntraining, Vater-Kind-Gruppe, Soziales Training, Bücherei, Friseur, Sportausweis
   Benötigte Informationen: Art der Aktivität (z.B. Gottesdienst, Sportausweis), gewünschtes Datum/Zeitpunkt

6. COUNSELING_SUPPORT - Beratungsanfrage
   Beschreibung: Kodrobs, Urkundsbeamter/ÖRA, Schuldnerberatung, Entlassenen-Hilfe, Übergangsmanagement
   Benötigte Informationen: Art der Beratung (z.B. Schuldnerberatung, Entlassenen-Hilfe), Grund für die Beratung

7. PERSONAL_PROPERTY - Gegenstände aus der Kammer
   Beschreibung: Persönlichen Gegenständen aus der Kammer erhalten, Kleidung tauschen oder Telefonnummern herausschreiben
   Benötigte Informationen: Art des Gegenstands (z.B. Kleidung, Dokumente), gewünschte Aktion (z.B. erhalten, tauschen)

8. WORK_SCHOOL - Arbeit & Schule
   Beschreibung: Antrag zu Arbeitstätigkeit oder schulische Weiterbildung (Arbeitsplatzzuweisung, Arbeitsplatzwechsel, Teilnahme an schulischen Angeboten, Freistellung von Arbeitspflicht, Freistellung arbeitsfreie Tage)
   Benötigte Informationen: Art des Antrags (z.B. Arbeitsplatzzuweisung, Schulung), Details zum gewünschten Arbeitsplatz/Schulung

9. PACKAGE - Paketsendung
   Beschreibung: Antrag auf Genehmigung und Annahme einer Paketsendung
   Benötigte Informationen: Absenderinformationen (wenn bekannt), Inhalt (wenn bekannt), erwartetes Ankunftsdatum

10. PRISON_RELAXATION - Vollzugslockerung
    Beschreibung: Beantragung von Lockerung des Vollzugs, Freistellung von der Haft und Ausgang
    Benötigte Informationen: Art der Lockerung (z.B. Ausgang, Freistellung), Grund, gewünschtes Datum

11. PARTICIPATION_MONEY - Teilhabegeldantrag
    Beschreibung: Antrag auf Teilhabegeld für den Insassen. Es handelt sich um eine Sozialleistung, die der Insasse selbst beantragen kann.Teilhabegeld kann für den aktuellen und die vergangenen zwei Monate beantragt werden. Es muss für jeden Monat ein eigener Antrag gestellt werden.
    Benötigte Informationen: Monat für den Teilhabegeld beantragt werden soll.

12. FREETEXT - Sonstiges Anliegen
    Beschreibung: Für allgemeine Anfragen und Anliegen, die nicht in andere Kategorien passen
    Benötigte Informationen: Beschreibung des Anliegens
`

/**
 * System-Prompt für den Chatbot
 */
const getSystemPrompt = (userName?: string, currentDate?: string): string => {
  const dateInfo = currentDate ? `\nAktuelles Datum: ${currentDate}` : ''
  const userInfo = userName ? `\nDer Nutzer heißt ${userName}. Begrüße ihn persönlich mit seinem Namen.` : ''
  
  return `Du bist Juna, eine hilfreiche und freundliche Assistentin für Insassen im Gefängnis für die Antragsstellung. Du stellst dich in deinen Nachrichten als "Juna" vor. Ansprache immer mit "du".

${userInfo}${dateInfo}

${SERVICE_TYPE_DEFINITIONS}

Deine Aufgabe:
1. Begrüße den Nutzer freundlich und frage nach seinem Anliegen
2. Höre zu und identifiziere basierend auf dem Gespräch, welcher Antragstyp passend ist
3. Stelle gezielte Fragen, um alle benötigten Informationen für den gewählten Antragstyp zu sammeln
4. Sei geduldig und verständnisvoll - frage nach, wenn etwas unklar ist
5. Wenn du alle benötigten Informationen hast, setze "isReady": true im JSON und sage dem Nutzer, dass der Antrag bereit ist

WICHTIG - Kommunikation über Bereitschaft:
- Sage NICHT "Ich werde den Antrag vorbereiten" oder "Ich werde nun den Antrag erstellen" wenn du noch nicht bereit bist!
- Sage NUR dann "Ich habe alle benötigten Informationen gesammelt" oder "Der Antrag ist bereit", wenn du auch wirklich "isReady": true setzt!
- Wenn du sagst, dass der Antrag bereit ist, MUSS "isReady": true im JSON gesetzt sein und title/description müssen ausgefüllt sein!
- Sage NIEMALS, dass du den Antrag vorbereiten oder erstellen wirst, ohne gleichzeitig "isReady": true zu setzen!

WICHTIG - Kommunikation mit dem Nutzer:
- Der Button zum Weiterleiten zur Überprüfung heißt "Weiter zur Überprüfung". Verwende IMMER diesen exakten Namen, wenn du auf den Button verweist.
- Verwende NIEMALS die englischen Antragstyp-Bezeichnungen (wie VISIT, CONVERSATION, HEALTH, etc.) in deinen Chat-Nachrichten!
- Verwende IMMER die deutschen Namen:
  * VISIT → "Besuchsantrag"
  * CONVERSATION → "Gesprächsanfrage"
  * HEALTH → "Gesundheit"
  * BOOKINGS_FINANCE → "Geldtransfer"
  * LEISURE_EDUCATION → "Freizeit & Bildung"
  * COUNSELING_SUPPORT → "Beratungsanfrage"
  * PERSONAL_PROPERTY → "Gegenstände aus der Kammer"
  * WORK_SCHOOL → "Arbeit & Schule"
  * PACKAGE → "Paketsendung"
  * PRISON_RELAXATION → "Vollzugslockerung"
  * PARTICIPATION_MONEY → "Teilhabegeldantrag"
  * FREETEXT → "Sonstiges Anliegen"
- Beispiel: Sage NICHT "Der Antragstyp ist CONVERSATION", sondern "Der Antragstyp ist Gesprächsanfrage"
- Die englischen Bezeichnungen (VISIT, CONVERSATION, etc.) dürfen NUR in extractedData.serviceType verwendet werden, NIEMALS in chatMessage!

WICHTIG: Du musst bei JEDER Antwort ein JSON-Objekt im folgenden Format zurückgeben:
{
  "chatMessage": "Die Chat-Nachricht für den Nutzer (auf Deutsch, freundlich)",
  "isReady": false,
  "extractedData": {
    "serviceType": "VISIT",
    "title": "Kurzer Titel (max. 5 Wörter) oder leer",
    "description": "Vollständige Beschreibung oder leer",
    "fields": {}
  }
}

Wichtig für JSON:
- "chatMessage" ist die normale Chat-Nachricht für den Nutzer
- "isReady" ist true, wenn ALLE Informationen gesammelt sind und der Antrag bereit ist
- "extractedData.serviceType" ist einer der verfügbaren Service-Typen (oder "FREETEXT")
- "extractedData.title" ist ein kurzer, prägnanter Titel (max. 5 Wörter) - leer lassen wenn noch nicht klar
- "extractedData.description" ist eine vollständige Beschreibung - leer lassen wenn noch nicht klar
- Wenn "isReady" true ist, MÜSSEN title und description ausgefüllt sein!

Beispiel für bereit:
{
  "chatMessage": "Ich habe alle benötigten Informationen gesammelt. Der Antrag ist bereit zur Überprüfung. Du kannst jetzt auf den Button 'Weiter zur Überprüfung' klicken.",
  "isReady": true,
  "extractedData": {
    "serviceType": "VISIT",
    "title": "Besuchsantrag für Lydia Hansen",
    "description": "Besuchsantrag für persönlichen Familienbesuch. Besucherin: Lydia Hansen (geb. 05.07.1960, Mutter des Antragstellers). Geplantes Datum: 03.03.2025 um 12 Uhr. Besuchstyp: Persönlicher Familienbesuch.",
    "fields": {}
  }
}

WICHTIG: Antworte IMMER im JSON-Format, niemals als reiner Text!`
}

/**
 * Extrahiert Antragsdaten aus der Chat-History
 * Analysiert die Konversation, um Service-Typ und Felder zu identifizieren
 */
export async function extractServiceData(chatHistory: ChatMessage[]): Promise<Partial<ServiceData>> {
  const aiProvider = AIProviderFactory.createProvider('openai')
  if (!aiProvider) {
    throw new Error('OpenAI Provider nicht verfügbar')
  }

  const extractionPrompt = `Analysiere die folgende Chat-Konversation und extrahiere die Antragsdaten.

${SERVICE_TYPE_DEFINITIONS}

Chat-Verlauf:
${chatHistory.map(msg => `${msg.role === 'user' ? 'Nutzer' : 'Assistent'}: ${msg.content}`).join('\n')}

Antworte im JSON-Format:
{
  "serviceType": "VISIT",
  "title": "Kurzer, prägnanter Titel (max. 5 Wörtern)",
  "description": "Vollständige Beschreibung des Antrags auf Deutsch",
  "fields": {
    "zusätzliche": "felder falls vorhanden"
  }
}

WICHTIG: 
- Verwende nur einen der verfügbaren Service-Typen
- Wenn der Service-Typ nicht eindeutig ist, verwende "FREETEXT"
- Der Titel muss kurz und prägnant sein
- Die Beschreibung muss alle gesammelten Informationen enthalten`

  try {
    const response = await aiProvider.chatService(
      'Du bist ein Assistent für die Extraktion von Antragsdaten aus Gesprächen. Antworte ausschließlich im JSON-Format ohne zusätzliche Erklärungen.',
      chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      0.3 // Niedrige Temperatur für konsistente Extraktion
    )

    // JSON aus der Response extrahieren
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0])
      
      return {
        serviceType: extracted.serviceType || 'FREETEXT',
        title: extracted.title || '',
        description: extracted.description || '',
        fields: extracted.fields || {}
      }
    }

    throw new Error('Keine gültigen Daten extrahiert')
  } catch (error: any) {
    console.error('Daten-Extraktion Fehler:', error)
    
    // Fallback: Versuche basierend auf Chat-History eine einfache Analyse
    const lastUserMessage = chatHistory.filter(msg => msg.role === 'user').pop()
    if (lastUserMessage) {
      return {
        serviceType: 'FREETEXT',
        title: 'Antrag',
        description: lastUserMessage.content,
        fields: {}
      }
    }

    throw error
  }
}

/**
 * Prüft ob der Chatbot signalisiert, dass der Antrag bereit ist
 */
function checkIfAssistantSaysReady(assistantResponse: string): boolean {
  if (!assistantResponse || assistantResponse.trim().length === 0) {
    console.log('[SmartService] checkIfAssistantSaysReady: Keine Response')
    return false
  }
  
  const lowerResponse = assistantResponse.toLowerCase().trim()
  
  // Sehr einfache und direkte Prüfungen:
  // 1. "bereit zur überprüfung" - sollte IMMER funktionieren
  const hasBereitZurUeberpruefung = lowerResponse.includes('bereit') && 
    (lowerResponse.includes('überprüfung') || lowerResponse.includes('uberprufung') || lowerResponse.includes('überprufung'))
  
  // 2. "antrag ist bereit" - sehr direkte Formulierung
  const hasAntragIstBereit = lowerResponse.includes('antrag') && lowerResponse.includes('bereit')
  
  // 3. "weiter" + "button" oder "klicken" - bedeutet definitiv bereit
  const hasWeiterButton = lowerResponse.includes('weiter') && 
    (lowerResponse.includes('button') || lowerResponse.includes('klicken'))
  
  // 4. "alle informationen gesammelt" oder ähnlich
  const hasAlleInformationen = lowerResponse.includes('alle') && 
    (lowerResponse.includes('informationen') || lowerResponse.includes('daten')) &&
    (lowerResponse.includes('gesammelt') || lowerResponse.includes('vorhanden'))
  
  // 5. "antrag vorbereiten" oder "antrag erstellen" - nur wenn zusammen mit Indikatoren für Vollständigkeit
  const hasAntragVorbereiten = (lowerResponse.includes('antrag') && 
    (lowerResponse.includes('vorbereiten') || lowerResponse.includes('erstellen') || lowerResponse.includes('bereitstellen'))) &&
    (lowerResponse.includes('alle') || lowerResponse.includes('bereit') || lowerResponse.includes('fertig') || hasAlleInformationen)
  
  // 6. "ich habe" + "gesammelt"/"erhalten" + "informationen" - klare Indikation
  const hasIchHabeGesammelt = (lowerResponse.includes('ich habe') || lowerResponse.includes('habe ich')) &&
    (lowerResponse.includes('gesammelt') || lowerResponse.includes('erhalten') || lowerResponse.includes('zusammen')) &&
    (lowerResponse.includes('informationen') || lowerResponse.includes('daten') || lowerResponse.includes('alles'))
  
  const result = hasBereitZurUeberpruefung || hasAntragIstBereit || hasWeiterButton || hasAlleInformationen || hasAntragVorbereiten || hasIchHabeGesammelt
  
  // Debug-Logging - IMMER ausgeben
  console.log('[SmartService] Signal-Erkennung:', {
    responsePreview: assistantResponse.substring(0, 150),
    lowerResponsePreview: lowerResponse.substring(0, 150),
    hasBereitZurUeberpruefung,
    hasAntragIstBereit,
    hasWeiterButton,
    hasAlleInformationen,
    hasAntragVorbereiten,
    hasIchHabeGesammelt,
    result,
    containsBereit: lowerResponse.includes('bereit'),
    containsWeiter: lowerResponse.includes('weiter'),
    containsButton: lowerResponse.includes('button'),
    containsKlicken: lowerResponse.includes('klicken'),
    containsUeberpruefung: lowerResponse.includes('überprüfung') || lowerResponse.includes('uberprufung')
  })
  
  return result
}

/**
 * Generiert einen Titel aus der Beschreibung falls kein Titel vorhanden ist
 */
async function generateTitleFromDescription(description: string): Promise<string> {
  const aiProvider = AIProviderFactory.createProvider('openai')
  if (!aiProvider) {
    // Fallback: Erste 50 Zeichen der Beschreibung
    return description.substring(0, 50).trim() + (description.length > 50 ? '...' : '')
  }

  try {
    const prompt = `Erstelle einen kurzen, prägnanten Titel (max. 5 Wörtern) für diesen Antrag: "${description}"`
    
    const title = await aiProvider.generateTitle(description)
    return title || description.substring(0, 50).trim()
  } catch (error) {
    console.error('Titel-Generierung Fehler:', error)
    // Fallback: Erste 50 Zeichen der Beschreibung
    return description.substring(0, 50).trim() + (description.length > 50 ? '...' : '')
  }
}

/**
 * Validiert ob alle benötigten Informationen für einen Service-Typ vorhanden sind
 */
export async function validateCompleteness(
  serviceType: string, 
  extractedData: Partial<ServiceData>,
  assistantResponse?: string,
  chatHistory?: ChatMessage[]
): Promise<{
  isComplete: boolean
  missingFields: string[]
  finalData: Partial<ServiceData>
}> {
  // Mindestanforderungen für jeden Service-Typ
  const requiredFields: Record<string, string[]> = {
    VISIT: ['description'],
    HEALTH: ['description'],
    CONVERSATION: ['description'],
    BOOKINGS_FINANCE: ['description'],
    LEISURE_EDUCATION: ['description'],
    COUNSELING_SUPPORT: ['description'],
    PERSONAL_PROPERTY: ['description'],
    WORK_SCHOOL: ['description'],
    PACKAGE: ['description'],
    PRISON_RELAXATION: ['description'],
    FREETEXT: ['description']
  }

  const required = requiredFields[serviceType] || requiredFields.FREETEXT
  const missing: string[] = []
  let finalData = { ...extractedData }

  // Prüfe Description (Pflichtfeld)
  if (!finalData.description || finalData.description.trim().length === 0) {
    missing.push('Beschreibung')
  }

  // Wenn keine Description vorhanden, ist der Antrag nicht vollständig
  if (missing.length > 0) {
    return {
      isComplete: false,
      missingFields: missing,
      finalData
    }
  }

  // Generiere Titel falls nicht vorhanden
  if (!finalData.title || finalData.title.trim().length === 0) {
    if (finalData.description) {
      finalData.title = await generateTitleFromDescription(finalData.description)
    }
  }

  // Prüfe ob Assistant sagt, dass Antrag bereit ist
  const assistantSaysReady = assistantResponse ? checkIfAssistantSaysReady(assistantResponse) : false
  
  // Debug-Logging
  console.log('[SmartService] Validierung Start:', {
    assistantSaysReady,
    hasDescription: !!finalData.description,
    descriptionLength: finalData.description?.length || 0,
    hasTitle: !!finalData.title,
    serviceType,
    assistantResponse: assistantResponse?.substring(0, 150) || 'keine'
  })

  // Antrag ist vollständig wenn:
  // WICHTIG: Wenn der Assistant explizit sagt, dass der Antrag bereit ist, dann ist er bereit (höchste Priorität)
  // Andernfalls: Beschreibung vorhanden (min. 10 Zeichen) UND Titel vorhanden
  const hasValidDescription = finalData.description && finalData.description.trim().length >= 10
  const hasDetailedDescription = finalData.description && finalData.description.trim().length >= 30
  
  // Wenn Assistant sagt "bereit", dann ist der Antrag bereit (auch wenn Beschreibung/Titel fehlen, werden sie generiert)
  if (assistantSaysReady) {
    console.log('[SmartService] Assistant sagt bereit - Antrag wird als vollständig markiert')
    
    // Stelle sicher, dass IMMER eine Beschreibung vorhanden ist
    const hasDescription = finalData.description && finalData.description.trim().length >= 10
    
    if (!hasDescription) {
      console.log('[SmartService] Keine Beschreibung extrahiert - erstelle aus Chat-History')
      
      // Versuche eine Beschreibung aus der Assistant-Response zu erstellen (Zusammenfassung)
      if (assistantResponse) {
        // Suche nach einer Zusammenfassung im Text (nach "Zusammenfassung" oder "Hier ist")
        const summaryMatch = assistantResponse.match(/(?:Zusammenfassung|hier ist|hier sind|gesammelt:|zusammenfassung)([\s\S]*?)(?:\.\s+|$)/i)
        
        if (summaryMatch && summaryMatch[1]) {
          finalData.description = summaryMatch[1].trim()
          console.log('[SmartService] Beschreibung aus Zusammenfassung extrahiert:', finalData.description.substring(0, 50))
        } else {
          // Fallback: Versuche eine Beschreibung aus dem Chat-Verlauf zu erstellen
          if (chatHistory && chatHistory.length > 0) {
            // Hole alle User-Nachrichten und erstelle eine Zusammenfassung
            const userMessages = chatHistory
              .filter(msg => msg.role === 'user')
              .map(msg => msg.content)
              .join(' ')
            
            if (userMessages.length > 20) {
              finalData.description = userMessages.substring(0, 500).trim()
              console.log('[SmartService] Beschreibung aus Chat-History erstellt')
            } else {
              // Fallback: Verwende die letzten 300 Zeichen der Assistant-Response
              finalData.description = assistantResponse.substring(0, 300).trim()
            }
          } else {
            // Fallback: Verwende die letzten 300 Zeichen der Assistant-Response
            finalData.description = assistantResponse.substring(0, 300).trim()
          }
        }
      }
      
      // Wenn immer noch keine Beschreibung, verwende einen generischen Text
      if (!finalData.description || finalData.description.trim().length < 10) {
        finalData.description = 'Antrag über Smart-Chat erstellt. Bitte Details im Review-Formular überprüfen.'
      }
    }
    
    // Generiere Titel falls nicht vorhanden
    if ((!finalData.title || finalData.title.trim().length === 0) && finalData.description) {
      console.log('[SmartService] Generiere Titel aus Beschreibung')
      finalData.title = await generateTitleFromDescription(finalData.description)
    }
    
    // Stelle sicher, dass ServiceType korrekt ist (nicht FREETEXT wenn wir einen anderen Typ erkennen)
    // Das wird bereits in extractServiceData gemacht, aber wir prüfen es nochmal
    if (finalData.serviceType === 'FREETEXT' && assistantResponse) {
      // Versuche ServiceType aus Assistant-Response zu erkennen
      const visitKeywords = ['besuch', 'besucher', 'besuchsantrag']
      const healthKeywords = ['gesundheit', 'arzt', 'medizin', 'schmerzen']
      const lowerResponse = assistantResponse.toLowerCase()
      
      if (visitKeywords.some(k => lowerResponse.includes(k))) {
        finalData.serviceType = 'VISIT'
      } else if (healthKeywords.some(k => lowerResponse.includes(k))) {
        finalData.serviceType = 'HEALTH'
      }
    }
    
    console.log('[SmartService] Finale Daten (assistantSaysReady=true):', {
      serviceType: finalData.serviceType,
      hasTitle: !!finalData.title,
      title: finalData.title?.substring(0, 50),
      hasDescription: !!finalData.description,
      descriptionLength: finalData.description?.length || 0,
      descriptionPreview: finalData.description?.substring(0, 100)
    })
    
    // Stelle sicher, dass wir IMMER isComplete: true zurückgeben wenn assistantSaysReady
    return {
      isComplete: true, // Assistant sagt bereit = Antrag ist bereit!
      missingFields: [],
      finalData
    }
  }
  
  // Fallback: Antrag ist bereit wenn Beschreibung ausreichend detailliert ist
  const isComplete: boolean = Boolean(
    hasValidDescription &&
    !!finalData.title &&
    finalData.title.trim().length > 0 &&
    (hasDetailedDescription || hasValidDescription)
  )

  return {
    isComplete,
    missingFields: missing,
    finalData
  }
}

/**
 * Verarbeitet eine Chat-Nachricht und gibt eine Antwort zurück
 */
export async function processChatMessage(
  sessionId: string,
  userMessage: string,
  userName?: string,
  currentDate?: string
): Promise<{
  response: string
  extractedData: Partial<ServiceData>
  isComplete: boolean
  missingFields: string[]
}> {
  const session = chatSessionManager.getSession(sessionId)
  if (!session) {
    throw new Error('Session nicht gefunden oder abgelaufen')
  }

  // User-Nachricht zur Session hinzufügen
  chatSessionManager.updateSession(sessionId, {
    role: 'user',
    content: userMessage
  })

  // Chat-History für OpenAI vorbereiten
  // WICHTIG: Füge explizite Anweisung hinzu, dass die Antwort im JSON-Format sein muss
  const messagesForAI: Array<{ role: 'user' | 'assistant'; content: string }> = 
    session.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }))
  
  // Füge am Ende der User-Nachricht eine explizite Anweisung hinzu
  if (messagesForAI.length > 0 && messagesForAI[messagesForAI.length - 1].role === 'user') {
    // Die letzte Nachricht ist von User - füge JSON-Anweisung hinzu
    const lastUserMessage = messagesForAI[messagesForAI.length - 1]
    messagesForAI[messagesForAI.length - 1] = {
      role: 'user',
      content: `${lastUserMessage.content}\n\nWICHTIG: Antworte NUR im JSON-Format mit chatMessage, isReady und extractedData. Niemals als reiner Text!`
    }
  } else {
    // Falls keine User-Nachricht vorhanden (sollte nicht passieren), füge eine hinzu
    messagesForAI.push({
      role: 'user',
      content: `${userMessage}\n\nWICHTIG: Antworte NUR im JSON-Format mit chatMessage, isReady und extractedData. Niemals als reiner Text!`
    })
  }

  // KI-Antwort generieren
  const aiProvider = AIProviderFactory.createProvider('openai')
  if (!aiProvider) {
    throw new Error('OpenAI Provider nicht verfügbar')
  }

  const systemPrompt = getSystemPrompt(userName, currentDate)
  
  // Verwende die normalen Messages (System-Prompt ist bereits im systemPrompt enthalten)
  const assistantResponseRaw = await aiProvider.chatService(systemPrompt, messagesForAI, 0.3)
  
  // Versuche JSON aus der Response zu extrahieren
  let assistantResponse = ''
  let chatData: {
    chatMessage: string
    isReady: boolean
    extractedData: Partial<ServiceData>
  } | null = null
  
  try {
    // Versuche JSON zu finden (kann mit Code-Blocks oder ohne sein)
    const jsonMatch = assistantResponseRaw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        
        // Validiere dass es die richtige Struktur hat
        if (parsed.chatMessage) {
          chatData = {
            chatMessage: parsed.chatMessage,
            isReady: parsed.isReady === true,
            extractedData: parsed.extractedData || {}
          }
          assistantResponse = chatData.chatMessage
          console.log('[SmartService] JSON erfolgreich geparst:', {
            isReady: chatData.isReady,
            hasExtractedData: !!chatData.extractedData,
            serviceType: chatData.extractedData?.serviceType || 'kein Typ'
          })
        } else {
          // JSON gefunden, aber falsche Struktur - wrappe in JSON-Format
          console.log('[SmartService] JSON gefunden aber falsche Struktur, wrappe Text')
          chatData = {
            chatMessage: assistantResponseRaw,
            isReady: false,
            extractedData: {}
          }
          assistantResponse = assistantResponseRaw
        }
      } catch (parseError) {
        console.error('[SmartService] JSON-Parse Fehler beim Parsen:', parseError)
        // JSON-Match gefunden, aber Parsing fehlgeschlagen - wrappe Text
        chatData = {
          chatMessage: assistantResponseRaw,
          isReady: false,
          extractedData: {}
        }
        assistantResponse = assistantResponseRaw
      }
    } else {
      // Kein JSON gefunden - KI hat nur Text zurückgegeben
      // Wrappe Text in JSON-Format für Konsistenz
      console.log('[SmartService] Kein JSON gefunden - KI hat nur Text zurückgegeben. Wrappe in JSON-Format.')
      chatData = {
        chatMessage: assistantResponseRaw,
        isReady: false,
        extractedData: {
          serviceType: 'FREETEXT',
          title: '',
          description: '',
          fields: {}
        }
      }
      assistantResponse = assistantResponseRaw
    }
  } catch (error) {
    console.error('[SmartService] Fehler bei JSON-Verarbeitung:', error)
    console.log('[SmartService] Rohe Response:', assistantResponseRaw.substring(0, 200))
    // Fallback: Wrappe Text in JSON-Format
    chatData = {
      chatMessage: assistantResponseRaw,
      isReady: false,
      extractedData: {
        serviceType: 'FREETEXT',
        title: '',
        description: '',
        fields: {}
      }
    }
    assistantResponse = assistantResponseRaw
  }

  // Assistant-Antwort zur Session hinzufügen
  chatSessionManager.updateSession(sessionId, {
    role: 'assistant',
    content: assistantResponse
  })

  // Verwende extrahierte Daten aus JSON-Response (falls vorhanden) oder Fallback auf alte Extraktion
  let extractedData: Partial<ServiceData> = {}
  
  if (chatData && chatData.extractedData) {
    // Verwende Daten aus JSON-Response (besser!)
    extractedData = chatData.extractedData
    console.log('[SmartService] Verwende Daten aus JSON-Response:', {
      serviceType: extractedData.serviceType,
      hasTitle: !!extractedData.title,
      hasDescription: !!extractedData.description
    })
  } else {
    // Fallback: Versuche alte Extraktion (für Rückwärtskompatibilität)
    console.log('[SmartService] Fallback auf alte Extraktion')
    try {
      const updatedSession = chatSessionManager.getSession(sessionId)
      if (updatedSession) {
        extractedData = await extractServiceData(updatedSession.messages)
        console.log('[SmartService] Daten aus Chat-History extrahiert')
      }
    } catch (error) {
      console.error('[SmartService] Fehler bei Daten-Extraktion:', error)
    }
  }
  
  // Aktualisiere Session mit extrahierten Daten
  chatSessionManager.updateSession(sessionId, {
    role: 'assistant',
    content: assistantResponse
  }, extractedData)

  // Verwende isReady aus JSON-Response (wenn vorhanden) als primäre Quelle
  const serviceType = extractedData.serviceType || 'FREETEXT'
  let isComplete = false
  let finalExtractedData = extractedData
  
  if (chatData) {
    // Wenn JSON-Response vorhanden, verwende isReady direkt
    isComplete = chatData.isReady
    
    // Stelle sicher, dass wenn isReady=true, auch Beschreibung und Titel vorhanden sind
    if (chatData.isReady && (!extractedData.description || extractedData.description.trim().length < 10)) {
      console.log('[SmartService] isReady=true aber keine Beschreibung - generiere Fallback')
      // Generiere Fallback-Beschreibung
      if (assistantResponse) {
        extractedData.description = assistantResponse.substring(0, 300).trim()
      }
    }
    
    if (chatData.isReady && (!extractedData.title || extractedData.title.trim().length === 0)) {
      console.log('[SmartService] isReady=true aber kein Titel - generiere aus Beschreibung')
      if (extractedData.description) {
        extractedData.title = await generateTitleFromDescription(extractedData.description)
      }
    }
    
    finalExtractedData = extractedData
    
    console.log('[SmartService] JSON-basierte Validierung:', {
      isReady: chatData.isReady,
      hasTitle: !!finalExtractedData.title,
      hasDescription: !!finalExtractedData.description,
      descriptionLength: finalExtractedData.description?.length || 0
    })
  } else {
    // Fallback: Alte Validierungslogik (wenn kein JSON)
    console.log('[SmartService] Fallback auf alte Validierungslogik')
    const updatedSession = chatSessionManager.getSession(sessionId)
    const validation = await validateCompleteness(
      serviceType, 
      extractedData, 
      assistantResponse,
      updatedSession?.messages || []
    )
    
    isComplete = validation.isComplete
    finalExtractedData = validation.finalData
    
    console.log('[SmartService] Validierung Ergebnis:', {
      isComplete: validation.isComplete,
      missingFields: validation.missingFields,
      hasFinalDescription: !!validation.finalData.description,
      finalDescriptionLength: validation.finalData.description?.length || 0
    })
  }

  // Debug-Logging
  console.log('[SmartService] processChatMessage Ergebnis:', {
    isComplete: isComplete,
    hasDescription: !!finalExtractedData.description,
    descriptionLength: finalExtractedData.description?.length || 0,
    hasTitle: !!finalExtractedData.title,
    serviceType: finalExtractedData.serviceType,
    source: chatData ? 'JSON-Response' : 'Fallback-Extraktion'
  })

  return {
    response: assistantResponse,
    extractedData: finalExtractedData,
    isComplete: isComplete,
    missingFields: isComplete ? [] : ['Beschreibung'] // Nur wenn nicht bereit
  }
}

/**
 * Erstellt den initialen Begrüßungstext
 * Gibt JSON-Format zurück (wie alle anderen Chat-Nachrichten)
 */
export async function createInitialGreeting(userName?: string, currentDate?: string): Promise<string> {
  const aiProvider = AIProviderFactory.createProvider('openai')
  if (!aiProvider) {
    // Fallback: Gebe auch im JSON-Format zurück
    const greetingText = userName 
      ? `Hallo ${userName}! Wie kann ich dir heute helfen?`
      : 'Hallo! Wie kann ich dir heute helfen?'
    
    return JSON.stringify({
      chatMessage: greetingText,
      isReady: false,
      extractedData: {
        serviceType: 'FREETEXT',
        title: '',
        description: '',
        fields: {}
      }
    })
  }

  const systemPrompt = getSystemPrompt(userName, currentDate)
  
  // Verwende niedrige Temperature für konsistentes JSON
  const greetingRaw = await aiProvider.chatService(
    systemPrompt,
    [{
      role: 'user',
      content: 'Begrüße den Nutzer persönlich und frage nach seinem Anliegen. Antworte im JSON-Format! Verwende IMMER die Du-Form!'
    }],
    0.3 // Niedrige Temperature für konsistentes JSON
  )

  // Versuche JSON zu parsen
  try {
    const jsonMatch = greetingRaw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      // JSON gefunden - validiere es
      const parsed = JSON.parse(jsonMatch[0])
      if (parsed.chatMessage) {
        // Gültiges JSON - gebe es zurück
        return JSON.stringify({
          chatMessage: parsed.chatMessage,
          isReady: false,
          extractedData: {
            serviceType: 'FREETEXT',
            title: '',
            description: '',
            fields: {}
          }
        })
      }
    }
  } catch (error) {
    console.error('[SmartService] Begrüßung JSON-Parse Fehler:', error)
  }

  // Fallback: Wrappe den Text in JSON-Format
  return JSON.stringify({
    chatMessage: greetingRaw,
    isReady: false,
    extractedData: {
      serviceType: 'FREETEXT',
      title: '',
      description: '',
      fields: {}
    }
  })
}

