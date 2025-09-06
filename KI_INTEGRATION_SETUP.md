# 🤖 KI-Integration Setup - Prisoner Services

## 📋 Übersicht

Die KI-Integration ermöglicht es Insassen, Texte in beliebigen Sprachen einzugeben und diese automatisch ins Deutsche übersetzen zu lassen. Die Übersetzung wird dann direkt in das Antragsformular übernommen.

## 🔧 Installation & Setup

### 1. Backend Dependencies installieren

```bash
cd backend
npm install
```

Die neue Dependency `openai` wurde bereits zur `package.json` hinzugefügt.

### 2. OpenAI API Key einrichten

1. **OpenAI Account erstellen:** Gehen Sie zu [OpenAI Platform](https://platform.openai.com/)
2. **API Key generieren:** Erstellen Sie einen neuen API Key
3. **Umgebungsvariable setzen:** Erstellen Sie eine `.env` Datei im `backend/` Verzeichnis:

```bash
# backend/.env
JWT_SECRET=your-secret-key-here
OPENAI_API_KEY=sk-your-openai-api-key-here
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
```

### 3. Backend starten

```bash
cd backend
npm run dev
```

Das Backend läuft auf: http://localhost:3001

### 4. Frontend starten

```bash
cd frontend
npm run dev
```

Das Frontend läuft auf: http://localhost:3000

## 🎯 Funktionalität

### Für Insassen:
1. **Zur "Neuer Antrag" Seite navigieren**
2. **KI-Textübersetzung nutzen:**
   - Text in beliebiger Sprache eingeben
   - "Übersetzen" Button klicken
   - Übersetzten Text kopieren oder direkt übernehmen
3. **Antrag einreichen** mit dem übersetzten Text

### Features:
- ✅ **Mehrsprachige Eingabe:** Unterstützt alle von OpenAI unterstützten Sprachen
- ✅ **Professionelle Formatierung:** Text wird für offizielle Anträge optimiert
- ✅ **Direkte Übernahme:** Übersetzung kann direkt in das Antragsformular übernommen werden
- ✅ **Kopier-Funktion:** Übersetzten Text in die Zwischenablage kopieren
- ✅ **Fehlerbehandlung:** Benutzerfreundliche Fehlermeldungen
- ✅ **Loading States:** Visuelle Rückmeldung während der Verarbeitung

## 🔌 API-Endpunkte

### POST `/api/ai/translate`
Übersetzt Text ins Deutsche und formatiert ihn professionell.

**Request:**
```json
{
  "text": "I need help with my medical appointment"
}
```

**Response:**
```json
{
  "success": true,
  "originalText": "I need help with my medical appointment",
  "translatedText": "Ich benötige Hilfe bei meinem Arzttermin."
}
```

### GET `/api/ai/health`
Überprüft den Status der OpenAI API-Verbindung.

## 💰 Kosten

- **OpenAI API:** ~$0.001-0.002 pro 1000 Tokens
- **Beispiel:** Ein typischer Antrag kostet etwa $0.0001-0.0002
- **Monatliche Kosten:** Bei 1000 Anträgen/Monat: ~$0.10-0.20

## 🛠️ Technische Details

### Backend:
- **OpenAI SDK:** Version 4.20.1
- **Model:** GPT-3.5-turbo (kostengünstig und schnell)
- **Rate Limiting:** Eingebaut in OpenAI SDK
- **Error Handling:** Spezifische Behandlung für API-Limits und Fehler

### Frontend:
- **React Component:** `AITextTranslator.tsx`
- **Integration:** Nahtlos in `NewService.tsx` eingebettet
- **Styling:** Konsistent mit bestehender Tailwind-Design
- **UX:** Loading States, Fehlerbehandlung, Copy-to-Clipboard

## 🔒 Sicherheit

- ✅ **Authentifizierung:** Alle API-Aufrufe erfordern gültigen JWT-Token
- ✅ **Input Validation:** Textlänge begrenzt (1-2000 Zeichen)
- ✅ **Error Handling:** Keine sensiblen Informationen in Fehlermeldungen
- ✅ **Rate Limiting:** OpenAI-eigene Rate Limits

## 🧪 Testing

### 1. Backend testen:
```bash
# Health Check
curl http://localhost:3001/api/ai/health

# Übersetzung testen (mit gültigem JWT-Token)
curl -X POST http://localhost:3001/api/ai/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"text": "Hello, I need help"}'
```

### 2. Frontend testen:
1. Als Insasse einloggen
2. Zur "Neuer Antrag" Seite navigieren
3. KI-Textübersetzung verwenden
4. Verschiedene Sprachen testen

## 🚀 Erweiterungsmöglichkeiten

### Kurzfristig:
- **Spracherkennung:** Automatische Erkennung der Eingabesprache
- **Mehrere Zielsprachen:** Übersetzung in verschiedene Sprachen
- **Template-Vorschläge:** Vordefinierte Antragstexte

### Langfristig:
- **Intelligente Kategorisierung:** Automatische Zuordnung zu Antragskategorien
- **Prioritätsvorhersage:** KI-basierte Prioritätsbewertung
- **Antwortvorschläge:** Für Staff-Mitglieder

## 🐛 Bekannte Probleme

- **API-Limits:** Bei hoher Nutzung können OpenAI-Limits erreicht werden
- **Offline-Modus:** Funktioniert nur mit Internetverbindung
- **Latenz:** Abhängig von OpenAI-Server-Response-Zeit

## 📞 Support

Bei Problemen:
1. **Backend-Logs prüfen:** `npm run dev` im Backend-Verzeichnis
2. **Browser-Konsole prüfen:** F12 → Console
3. **API-Key überprüfen:** OpenAI Dashboard
4. **Netzwerk-Verbindung testen:** Health Check Endpoint

---

**Entwickelt für:** Prisoner Services System  
**Version:** 1.0  
**Letzte Aktualisierung:** Januar 2025
