/**
 * Intelligente Extraktion von Titeln aus Eingabetext
 * Berücksichtigt Satzgrenzen, Mindestlänge und Wortgrenzen
 */
export const extractTitle = (text: string): string => {
  if (!text || text.trim().length === 0) {
    return ''
  }

  const words = text.trim().split(/\s+/)
  
  // Fallback 1: Zu kurz - ganzer Text
  if (words.length < 3) {
    return text.trim()
  }
  
  // Fallback 2: Erster Satz - wenn ≤ 5 Wörter
  const firstSentence = text.split(/[.!?]+/)[0].trim()
  if (firstSentence.split(/\s+/).length <= 5) {
    return firstSentence
  }
  
  // Standard: 5 Wörter mit intelligenter Kürzung
  let title = words.slice(0, 5).join(' ')
  
  // Entferne unvollständige Wörter bei zu kurzen Titeln
  if (title.length < 15 && words.length > 4) {
    title = words.slice(0, 4).join(' ')
  }
  
  return title
}

/**
 * Test-Funktion für die Titel-Extraktion
 * Kann in der Entwicklung verwendet werden
 */
export const testTitleExtraction = () => {
  const testCases = [
    "Ich brauche Hilfe beim Arzttermin nächste Woche",
    "Hilfe",
    "Ich möchte einen Antrag auf Freigang stellen",
    "Kann ich bitte einen Termin beim Arzt bekommen?",
    "Ich habe ein Problem mit meinem Zimmer",
    "Antrag auf Besuch",
    "Ich brauche",
    "Ich möchte einen Antrag auf Freigang stellen, weil ich meine Familie besuchen möchte",
    "Hilfe beim Arzttermin",
    "Ich brauche Hilfe beim Arzttermin nächste Woche, weil ich krank bin"
  ]

  console.log('🧪 Test der Titel-Extraktion:')
  testCases.forEach((test, index) => {
    const extracted = extractTitle(test)
    console.log(`${index + 1}. "${test}" → "${extracted}"`)
  })
}
