# 🤖 KI-Integration Setup - Prisoner Services

## 📋 Übersicht

Die KI-Integration ermöglicht es Insassen, Texte in beliebigen Sprachen einzugeben und diese automatisch ins Deutsche übersetzen zu lassen. Zusätzlich wird automatisch ein kurzer, prägnanter Titel (max. 5 Wörter) generiert. Beide Ergebnisse werden direkt in das Antragsformular übernommen.

**🆕 NEU: Anbieterunabhängige Architektur!** Das System unterstützt jetzt mehrere KI-Anbieter mit automatischem Fallback.

## 🔧 Installation & Setup

### 1. Backend Dependencies installieren

```bash
cd backend
npm install
```

Die folgenden Dependencies wurden zur `package.json` hinzugefügt:
- `openai` - OpenAI GPT Models
- `@google/generative-ai` - Google Gemini
- `@anthropic-ai/sdk` - Anthropic Claude

### 2. API Keys einrichten

Erstellen Sie eine `.env` Datei im `backend/` Verzeichnis:

```bash
# backend/.env
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development

# AI Provider Konfiguration
AI_PROVIDER=openai  # openai, gemini, claude
AI_FALLBACK_PROVIDER=openai
AI_DEBUG=false

# OpenAI (falls AI_PROVIDER=openai)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Google Gemini (falls AI_PROVIDER=gemini)
GEMINI_API_KEY=your-gemini-api-key-here
GEMINI_MODEL=gemini-pro

# Anthropic Claude (falls AI_PROVIDER=claude)
ANTHROPIC_API_KEY=your-claude-api-key-here
CLAUDE_MODEL=claude-3-sonnet-20240229

# Allgemeine AI-Einstellungen
AI_MAX_TOKENS=1000
AI_TEMPERATURE=0.3
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
   - Übersetzten Text und generierten Titel werden automatisch in die Formularfelder übernommen
3. **Antrag einreichen** mit dem übersetzten Text und generierten Titel

### Features:
- ✅ **Mehrsprachige Eingabe:** Unterstützt alle von OpenAI unterstützten Sprachen
- ✅ **Professionelle Formatierung:** Text wird für offizielle Anträge optimiert
- ✅ **Automatische Titel-Generierung:** Kurze, prägnante Titel (max. 5 Wörter) aus übersetztem Text
- ✅ **Direkte Übernahme:** Übersetzung und Titel werden automatisch in die Formularfelder übernommen
- ✅ **Kopier-Funktion:** Übersetzten Text und Titel in die Zwischenablage kopieren
- ✅ **Fehlerbehandlung:** Benutzerfreundliche Fehlermeldungen
- ✅ **Loading States:** Visuelle Rückmeldung während der Verarbeitung

## 🔌 API-Endpunkte

### POST `/api/ai/translate`
Übersetzt Text ins Deutsche und generiert automatisch einen kurzen Titel.

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
  "translatedText": "Ich benötige Hilfe bei meinem Arzttermin.",
  "generatedTitle": "Arzttermin Hilfe",
  "provider": "OpenAI"
}
```

### GET `/api/ai/health`
Überprüft den Status aller konfigurierten AI-Provider.

**Response:**
```json
{
  "status": "healthy",
  "currentProvider": "OpenAI",
  "providerStatus": {
    "openai": true,
    "gemini": false,
    "claude": true
  },
  "availableProviders": ["openai", "claude"],
  "config": {
    "provider": "openai",
    "fallbackProvider": "openai",
    "debug": false
  },
  "timestamp": "2025-01-27T10:30:00.000Z"
}
```

### GET `/api/ai/providers`
Zeigt detaillierte Informationen über alle verfügbaren Provider (für Debugging).

**Response:**
```json
{
  "availableProviders": ["openai", "gemini", "claude"],
  "providerStatus": {
    "openai": true,
    "gemini": false,
    "claude": true
  },
  "currentProvider": "openai",
  "fallbackProvider": "openai",
  "config": {
    "provider": "openai",
    "models": {
      "openai": "gpt-3.5-turbo",
      "gemini": "gemini-pro",
      "claude": "claude-3-sonnet-20240229"
    },
    "maxTokens": 1000,
    "temperature": 0.3
  }
}
```

## 💰 Kosten

### OpenAI:
- **GPT-3.5-turbo:** ~$0.001-0.002 pro 1000 Tokens
- **Beispiel:** Ein typischer Antrag kostet etwa $0.0001-0.0002

### Google Gemini:
- **Gemini Pro:** ~$0.0005-0.001 pro 1000 Tokens
- **Kostengünstiger** als OpenAI für einfache Übersetzungen

### Anthropic Claude:
- **Claude 3 Sonnet:** ~$0.003-0.015 pro 1000 Tokens
- **Höhere Qualität** für komplexere Texte

### Monatliche Kosten (bei 1000 Anträgen/Monat):
- **OpenAI:** ~$0.10-0.20
- **Gemini:** ~$0.05-0.10
- **Claude:** ~$0.30-1.50

## 🛠️ Technische Details

### Backend:
- **Anbieterunabhängige Architektur** mit Provider-Pattern
- **Automatischer Fallback** bei Provider-Ausfällen
- **Zentrale Konfiguration** über Umgebungsvariablen
- **Einheitliche Fehlerbehandlung** für alle Provider

### Provider-Implementierungen:
- **OpenAI SDK:** Version 4.20.1
- **Google Generative AI:** Version 0.2.1
- **Anthropic SDK:** Version 0.24.3

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

## 🆕 Neue Features (Version 2.0)

### ✅ **Anbieterunabhängige Architektur:**
- **Multi-Provider Support:** OpenAI, Google Gemini, Anthropic Claude
- **Automatischer Fallback:** Wechsel zu Backup-Provider bei Ausfällen
- **Zentrale Konfiguration:** Einfacher Provider-Wechsel über Umgebungsvariablen
- **Provider-Status-Monitoring:** Überwachung aller konfigurierten Provider

### ✅ **Erweiterte API-Endpunkte:**
- **`/api/ai/health`:** Detaillierter Gesundheitscheck aller Provider
- **`/api/ai/providers`:** Provider-Informationen und Status
- **Verbesserte Fehlerbehandlung:** Spezifische Fehlermeldungen pro Provider

### ✅ **Kosteneinsparungen:**
- **Provider-Vergleich:** Automatischer Wechsel zu kostengünstigeren Optionen
- **Flexible Modelle:** Verschiedene Modelle je nach Anforderung
- **Fallback-Strategien:** Redundanz ohne Mehrkosten

## 🚀 Erweiterungsmöglichkeiten

### Kurzfristig:
- **Spracherkennung:** Automatische Erkennung der Eingabesprache
- **Mehrere Zielsprachen:** Übersetzung in verschiedene Sprachen
- **Template-Vorschläge:** Vordefinierte Antragstexte
- **Titel-Anpassung:** Benutzer können generierte Titel bearbeiten
- **Provider-Load-Balancing:** Intelligente Verteilung auf mehrere Provider

### Langfristig:
- **Intelligente Kategorisierung:** Automatische Zuordnung zu Antragskategorien
- **Prioritätsvorhersage:** KI-basierte Prioritätsbewertung
- **Antwortvorschläge:** Für Staff-Mitglieder
- **A/B Testing:** Automatischer Vergleich verschiedener Provider

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
