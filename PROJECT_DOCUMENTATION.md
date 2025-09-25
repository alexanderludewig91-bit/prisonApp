# Prisoner Services - Projekt-Dokumentation

## 🎯 Projektübersicht

Dieses Projekt ist eine moderne Webanwendung, die das ursprüngliche Appian-System "Prisoner Services" nachbaut. Das System besteht aus zwei Hauptapplikationen, die in einer einheitlichen Webanwendung vereint werden:

1. **SharedTerminal** - Für Insassen (Antragstellung, Status-Abfragen)
2. **Prisoner Services** - Für Verwaltungsmitarbeiter (Antragsbearbeitung, Workflow)

## 🚀 Aktueller Status

### ✅ Implementiert
- **Backend:** Node.js + Express + TypeScript + Prisma + SQLite
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Authentifizierung:** JWT-Token basiert mit flexibler Gruppen-basierter Rollenverwaltung
- **Basis-Features:** Login, Dashboard, Service-Management, Benutzerverwaltung
- **Datenbank:** SQLite mit Prisma ORM
- **Rollenbasierte Navigation:** Automatische Menü-Anpassung je nach Benutzergruppen

### 🔄 **Neue Architektur: Status und Entscheidung getrennt**
- **Status:** Workflow-Phase (Ausstehend, In Bearbeitung, Abgeschlossen)
- **Entscheidung:** Ergebnis (Genehmigt, Abgelehnt, Zurückgewiesen)
- **Unabhängige Verwaltung:** Status und Entscheidung können unabhängig voneinander gesetzt werden

### 🎯 **Neue Prioritätsstruktur**
- **Vereinfachte Prioritäten:** Nur noch "Hohe Priorität" (HIGH) und "Höchste Priorität" (URGENT)
- **Keine Priorität:** Standardwert `null` - wird nicht angezeigt
- **Prioritätsänderung:** Staff kann Prioritäten über "Antrag priorisieren" Button ändern

### 🚫 **Entfernte Features**
- **Automatische Zuweisung:** Workflow-Regeln für automatische Service-Zuweisung entfernt
- **Process Management:** Komplette Entfernung von Prozess-Management-Features
- **ApplicationProcessing.tsx:** Ungenutzte Komponente entfernt

### ✅ **Insassen-Features**
  - ✅ Antragstellung (Neuer Antrag)
  - ✅ Antragsübersicht (Meine Anträge)
  - ✅ Echte API-Verbindung zwischen Frontend und Backend
- ✅ **Rückfragen beantworten:** Insassen können auf Staff-Rückfragen antworten
- ✅ **Informationen erhalten:** Anzeige von Staff-Informationen zu Anträgen
- ✅ **KI-Textübersetzung:** Mehrsprachige Eingabe mit automatischer Übersetzung ins Deutsche
- ✅ **KI-Titel-Generierung:** Automatische Generierung kurzer, prägnanter Titel (max. 5 Wörter)
- ✅ **Live-Übersetzung:** Echtzeit-Übersetzung in Rückfragen-Modals
- ✅ **Rückfragen-Übersetzung:** Automatische Übersetzung von Staff-Rückfragen
- ✅ **Antwort-Übersetzung:** Live-Übersetzung von Insassen-Antworten
- ✅ **Information-Übersetzung:** Automatische Übersetzung von Staff-Informationen im Modal
- ✅ **Information-Modal:** Anklickbare Informationsliste mit KI-Übersetzung und Ausblenden-Funktion
- ✅ **Multi-Language Support:** Vollständige Internationalisierung (i18n) mit 10 Sprachen

### ✅ **Mitarbeiter-Features**
  - ✅ Mitarbeiter-Dashboard mit Service-Übersicht
  - ✅ Erweiterte Service-Details mit Kommentaren
  - ✅ Status-Änderungen mit Begründungen
  - ✅ Aktivitätsverlauf für jeden Service
  - ✅ **Insassen-Übersicht** - Zentrale Insassen-Verwaltung mit vollständigen Details
- ✅ **Neue Bearbeiter-Aktionen:**
  - ✅ **Insassen kontaktieren:** Rückfragen und Informationen an Insassen senden
  - ✅ **Weiterleiten:** Anträge an andere Staff-Gruppen weiterleiten
  - ✅ **Kommentar erstellen:** Kommentare zum Antrag hinzufügen
  - ✅ **Entscheiden:** Anträge genehmigen, ablehnen oder zurückweisen
  - ✅ **Persönliche Eröffnung:** Dokumentation persönlicher Entscheidungsmitteilung
- ✅ **Entscheidungs-Workflow:**
  - ✅ **Ergebnis an Insassen senden:** Direkte Entscheidungsmitteilung
  - ✅ **AVD-Eröffnung:** Zuweisung an AVD für persönliche Eröffnung
  - ✅ **Weiterführende Bearbeitung:** Option für komplexere Anträge
- ✅ **Manuelle Änderungen:**
  - ✅ **Status oder Entscheidung ändern:** Flexibles Ändern beider Felder
  - ✅ **Antrag priorisieren:** Prioritätsänderung über Modal
  - ✅ **Status zu "In Bearbeitung":** Schnelle Statusänderung für ausstehende Anträge

### ✅ **Admin-Features**
  - ✅ Admin-Dashboard mit KPIs und System-Status
  - ✅ Gruppen-Management (Benutzer zu Gruppen hinzufügen/entfernen)
  - ✅ Admin-Logs für Audit-Zwecke
  - ✅ Service-Übersicht mit Lösch-Funktion
  - ✅ Benutzerfreundliche Gruppennamen (Beschreibungen statt technische Namen)
  - ✅ Klickbare Gruppenzeilen (Ausklappbare Mitgliederlisten)
  - ✅ Kategoriebasierte Sortierung (ADMIN → STAFF → INMATE → SYSTEM)
  - ✅ In-App Modals statt Browser-Dialoge
  - ✅ **Hausverwaltung** - Vollständiges Zellen-Management-System
  - ✅ **Benutzerübersicht** - Zentrale Verwaltung aller Mitarbeitenden

### ✅ **Workflow-Engine (Vereinfacht)**
- ✅ **Automatische Gruppenzuweisung:** Freitextanträge werden automatisch "PS General Enforcement Service" zugewiesen
- ✅ **Status-Übergänge:** Manuelle und automatische Status-Änderungen
- ✅ **Workflow-Statistiken:** Dashboard-Statistiken für Antragsverwaltung

### ✅ **Backend API**
  - ✅ Insassen-spezifische Endpunkte (`/api/services/my/services`)
  - ✅ Mitarbeiter-spezifische Endpunkte (`/api/services/staff/*`)
  - ✅ Admin-spezifische Endpunkte (`/api/groups`, `/api/admin-logs`)
  - ✅ JWT-Middleware für User-Informationen
  - ✅ Gruppen-basierte Berechtigungsprüfung
  - ✅ Admin-Berechtigungsprüfung (`checkAdmin` Middleware)
  - ✅ Aktivitätsprotokollierung bei Service-Erstellung
  - ✅ Admin-Aktions-Logging für Audit-Zwecke
  - ✅ **Hausverwaltung API** - Vollständige API für Zellen-Management
  - ✅ **KI-Integration API** - Multi-Provider-Support für Textübersetzung und Titel-Generierung
- ✅ **Multi-Language API** - Vollständige Internationalisierung (i18n) mit 10 Sprachen
- ✅ **Neue Service-Endpunkte:**
  - ✅ `PATCH /services/:id/priority` - Prioritätsänderung
  - ✅ `POST /services/:id/inquiries` - Rückfragen an Insassen
  - ✅ `POST /services/:id/answers` - Insassen-Antworten
  - ✅ `POST /services/:id/information` - Informationen an Insassen
  - ✅ `POST /services/:id/forward` - Weiterleitung an Gruppen
  - ✅ `POST /services/:id/complete-with-decision` - Entscheidung finalisieren
  - ✅ `POST /services/:id/complete-with-avd-notification` - AVD-Zuweisung
  - ✅ `POST /services/:id/personal-notification-completed` - Persönliche Eröffnung dokumentieren
- ✅ **KI-Integration Endpunkte:**
  - ✅ `POST /api/ai/translate` - Textübersetzung und Titel-Generierung (Multi-Provider)
  - ✅ `POST /api/ai/translate-activity` - Rückfragen-Übersetzung
  - ✅ `GET /api/ai/health` - Provider-Status-Überprüfung
  - ✅ `GET /api/ai/providers` - Provider-Informationen


## 🚀 Installation & Setup

### Voraussetzungen
- Node.js (Version 18 oder höher)
- npm oder yarn
- SQLite (wird automatisch installiert)

### Vollständige Installation

1. **Backend einrichten:**
   ```bash
   cd backend
   npm install
   npx prisma generate
   npx prisma db push
   npm run db:seed  # Testdaten erstellen (Benutzer, Gruppen, Services)
   npx db:seed      # Alternative für Windows (falls npx prisma db seed nicht funktioniert)
   npx ts-node prisma/seed-houses.ts  # Hausverwaltung-Testdaten erstellen
   ```

2. **Frontend einrichten:**
   ```bash
   cd frontend
   npm install
   # Für Multi-Language Support (i18n):
   npm install i18next react-i18next i18next-browser-languagedetector
   ```

3. **Anwendung starten:**
   ```bash
   # Backend (Terminal 1)
   cd backend
   npm run dev
   
   # Frontend (Terminal 2)
   cd frontend
   npm run dev
   ```

### Testdaten

Das System wird mit folgenden Testdaten initialisiert:

#### Benutzer
- **Insassen:** 10 Test-Insassen (PS Inmates Gruppe)
- **Mitarbeiter:** 5 Test-Mitarbeiter (verschiedene Staff-Gruppen)
- **Admins:** 2 Test-Admins (PS Designers Gruppe)

#### Gruppen
- **PS Inmates** - Insassen-Gruppe
- **PS General Enforcement Service** - Allgemeine Vollzugsdienste
- **PS Vollzugsabteilungsleitung** - Vollzugsleitung
- **PS Vollzugsleitung** - Höhere Vollzugsleitung
- **PS Anstaltsleitung** - Anstaltsleitung
- **PS Payments Office** - Zahlungsabteilung
- **PS Medical Staff** - Medizinisches Personal
- **PS Designers** - Administratoren

#### Services
- 20 Test-Services mit verschiedenen Status und Prioritäten
- Automatische Gruppenzuweisung für Insassen-Anträge

#### Hausverwaltung
- 3 Häuser mit je 3 Stationen
- 54 Zellen (6 Zellen pro Station)
- Test-Zellenbelegungen

## 🏗️ Technische Architektur

### Frontend (React + TypeScript)
- **Framework:** React 18 mit TypeScript
- **Styling:** Tailwind CSS
- **Build Tool:** Vite
- **Routing:** React Router DOM
- **State Management:** React Context (AuthContext, DarkModeContext, LanguageContext)
- **HTTP Client:** Axios
- **Icons:** Lucide React
- **UI Features:** Dark Mode Support, Multi-Language Support (i18n)
- **Internationalisierung:** react-i18next mit 10 Sprachen

### Backend (Node.js + Express)
- **Framework:** Express.js mit TypeScript
- **Datenbank:** SQLite mit Prisma ORM
- **Authentifizierung:** JWT-Token
- **Validierung:** Express-validator
- **Middleware:** Custom Auth- und Admin-Middleware
- **KI-Integration:** Multi-Provider-Support (OpenAI, Gemini, Claude)

### Datenbank (SQLite)
- **ORM:** Prisma
- **Schema:** Vollständig typisiert mit TypeScript
- **Migrationen:** Automatische Schema-Updates
- **Seeding:** Testdaten-Skripte
- **Erweiterte Felder:** `titleInmate`, `descriptionInmate`, `translatedDetails` für Multi-Language Support

### KI-Integration (Multi-Provider)
- **Architektur:** Anbieterunabhängige Provider-Pattern
- **Provider:** OpenAI GPT, Google Gemini, Anthropic Claude
- **Funktionen:** Textübersetzung, automatische Titel-Generierung, Live-Übersetzung
- **Rückfragen-Übersetzung:** Automatische Übersetzung von Staff-Rückfragen
- **Antwort-Übersetzung:** Live-Übersetzung von Insassen-Antworten
- **Fallback:** Automatischer Provider-Wechsel bei Ausfällen
- **Konfiguration:** Zentrale Umgebungsvariablen
- **Monitoring:** Provider-Status-Überwachung

### Multi-Language Support (i18n)
- **Unterstützte Sprachen:** 10 Sprachen (Deutsch, Englisch, Spanisch, Französisch, Arabisch, Persisch, Türkisch, Russisch, Polnisch, Italienisch)
- **RTL-Unterstützung:** Vollständige Unterstützung für rechts-nach-links Sprachen
- **Sprache-abhängige KI:** Intelligente KI-Funktionen basierend auf UI-Sprache
- **Statische Übersetzungen:** JSON-basierte Übersetzungsdateien
- **Dynamische Inhalte:** KI-Übersetzung für dynamische Inhalte
- **Context-Management:** LanguageContext für zentrale Sprachverwaltung

## 🔐 Authentifizierung & Berechtigungen

### JWT-Token System
- **Token-basiert:** Sichere Authentifizierung
- **Automatische Erneuerung:** Token-Refresh-Mechanismus
- **Gruppen-basierte Rollen:** Flexible Berechtigungsverwaltung

### Rollen-System
- **Insassen (PS Inmates):** Antragstellung, eigene Anträge einsehen
- **Staff:** Antragsbearbeitung, Kommentare, Entscheidungen
- **Admin (PS Designers):** Vollzugriff auf alle Features

### Berechtigungsprüfung
- **Middleware-basiert:** Automatische Prüfung in allen Routen
- **Gruppen-Validierung:** Dynamische Berechtigungsprüfung
- **Admin-Checks:** Spezielle Admin-Berechtigungen

## 📊 Service-Management

### Service-Lebenszyklus
1. **Erstellung:** Insasse erstellt Antrag
2. **Automatische Zuweisung:** PS General Enforcement Service
3. **Bearbeitung:** Staff bearbeitet und kommentiert
4. **Entscheidung:** Genehmigung, Ablehnung oder Zurückweisung
5. **Abschluss:** Status auf "Abgeschlossen" setzen

### Status-System
- **Ausstehend (PENDING):** Neuer Antrag
- **In Bearbeitung (IN_PROGRESS):** Wird bearbeitet
- **Abgeschlossen (COMPLETED):** Finaler Status

### Entscheidungs-System
- **Genehmigt (APPROVED):** Antrag genehmigt
- **Abgelehnt (REJECTED):** Antrag abgelehnt
- **Zurückgewiesen (RETURNED):** Antrag zurückgewiesen (fehlerhafte Angaben)

### Prioritäts-System
- **Keine Priorität (null):** Standard, wird nicht angezeigt
- **Hohe Priorität (HIGH):** Orange markiert
- **Höchste Priorität (URGENT):** Rot markiert

## 🔄 Workflow-Features

### Bearbeiter-Aktionen
- **Insassen kontaktieren:** Rückfragen und Informationen senden
- **Weiterleiten:** Anträge an andere Gruppen weiterleiten
- **Kommentar erstellen:** Kommentare zum Antrag hinzufügen
- **Entscheiden:** Anträge genehmigen, ablehnen oder zurückweisen
- **Persönliche Eröffnung:** Dokumentation persönlicher Entscheidungsmitteilung

### Entscheidungs-Workflow
- **Ergebnis an Insassen senden:** Direkte Entscheidungsmitteilung
- **AVD-Eröffnung:** Zuweisung an AVD für persönliche Eröffnung
- **Weiterführende Bearbeitung:** Option für komplexere Anträge

### Automatische Features
- **Gruppenzuweisung:** Freitextanträge automatisch zugewiesen
- **Aktivitätsprotokollierung:** Alle Aktionen werden geloggt
- **Status-Übergänge:** Workflow-basierte Status-Änderungen

## 🏠 Hausverwaltung

### Zellen-Management
- **Häuser:** Organisatorische Einheiten
- **Stationen:** Untereinheiten innerhalb der Häuser
- **Zellen:** Einzelne Zellen mit Kapazität
- **Insassen-Zuweisungen:** Drag & Drop Zuweisung

### Features
- **Drag & Drop:** Visuelle Insassen-Zuweisung
- **Automatische Zuweisung:** Intelligente Zellen-Zuweisung
- **Zellen-Übersicht:** Vollständige Belegungsübersicht
- **Transfer-Funktion:** Insassen zwischen Zellen verlegen

## 📈 Dashboard & Statistiken

### Staff-Dashboard
- **Antrags-Statistiken:** Status, Entscheidungen, Prioritäten
- **Service-Übersicht:** Filterbare Antragsliste
- **Schnellaktionen:** Direkte Status- und Entscheidungsänderungen

### Admin-Dashboard
- **System-KPIs:** Benutzer, Services, Gruppen
- **Admin-Logs:** Audit-Trail für alle Admin-Aktionen
- **Gruppen-Management:** Benutzer zu Gruppen zuweisen

## 🔧 Entwicklung & Wartung

### Code-Qualität
- **TypeScript:** Vollständige Typisierung
- **ESLint:** Code-Qualitätsprüfung
- **Prettier:** Code-Formatierung
- **Git Hooks:** Automatische Qualitätsprüfungen

### Testing
- **Unit Tests:** Backend-API Tests
- **Integration Tests:** Frontend-Backend Integration
- **E2E Tests:** Vollständige Workflow-Tests

### Deployment

#### Lokale Entwicklung
- **Backend:** Node.js + Express auf Port 3001
- **Frontend:** Vite Development Server auf Port 3000
- **Datenbank:** SQLite (lokal)
- **API-Proxy:** Vite Proxy für Frontend-Backend-Kommunikation

#### Railway Production Deployment
- **Platform:** Railway.app (Hobby Plan - 5€/Monat)
- **Services:** 3 separate Services (Frontend, Backend, PostgreSQL)
- **Domain:** Automatische Railway-Subdomains + Custom Domain Support
- **SSL:** Automatisches HTTPS-Zertifikat
- **Database:** PostgreSQL (Railway-managed)
- **Environment:** Production-ready mit Environment Variables

#### Railway-Konfiguration
**Frontend Service:**
- **Root Directory:** `/frontend`
- **Build Command:** `npm run build`
- **Start Command:** Caddy (automatisch)
- **Port:** 8080 (Railway-managed)
- **Environment Variables:**
  - `VITE_API_URL` (optional, Fallback auf Backend-URL)

**Backend Service:**
- **Root Directory:** `/backend`
- **Build Command:** `npm run build`
- **Start Command:** `npm run start` (mit automatischem Database Seeding)
- **Port:** 8080 (Railway-managed)
- **Environment Variables:**
  - `DATABASE_URL` (Railway PostgreSQL)
  - `JWT_SECRET`
  - `OPENAI_API_KEY`
  - `NODE_ENV=production`
  - `FRONTEND_URL` (Railway Frontend URL)

**PostgreSQL Database:**
- **Managed Service:** Railway PostgreSQL
- **Automatisches Seeding:** Startup-Script lädt Testdaten
- **Backup:** Automatische Railway-Backups

#### Database Migration (SQLite → PostgreSQL)
- **Lokale Entwicklung:** PostgreSQL (konsistent mit Production)
- **Prisma Schema:** `provider = "postgresql"`
- **Migration:** `npx prisma db push`
- **Seeding:** `npm run db:seed` + `npm run db:seed-houses`

#### Environment Setup
**Lokal (.env):**
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/prisoner_services"
JWT_SECRET=mein-geheimer-schluessel-123
OPENAI_API_KEY=sk-proj-...
FRONTEND_URL=http://localhost:3000
PORT=3001
NODE_ENV=development
```

**Production (Railway):**
```bash
DATABASE_URL=postgresql://... (Railway-managed)
JWT_SECRET=production-secret-key
OPENAI_API_KEY=sk-proj-...
NODE_ENV=production
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
```

#### Deployment-Prozess
1. **Code Changes:** Git commit + push
2. **Automatisches Deployment:** Railway erkennt GitHub-Push
3. **Build Process:** 
   - Frontend: Vite Build → Caddy Static Files
   - Backend: TypeScript Compile → Node.js Start
4. **Database Setup:** Automatisches Schema + Seeding
5. **Health Check:** Automatische Verfügbarkeitsprüfung

#### CORS-Konfiguration
**Backend CORS-Settings:**
```typescript
origin: [
  'http://localhost:3000',                    // Lokale Entwicklung
  'https://frontend-production-xxxx.up.railway.app', // Railway Frontend
  'frontend.railway.internal'                 // Interne Railway-Kommunikation
]
```

#### API-Konfiguration
**Frontend API-Setup:**
```typescript
// Lokal: Vite Proxy zu /api → http://localhost:3001/api
// Production: Direkte API-Calls zu Railway Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-production-xxxx.up.railway.app/api'
```

#### Monitoring & Logs
- **Railway Dashboard:** Real-time Logs und Metrics
- **Health Endpoints:** `/health` für Service-Status
- **Error Tracking:** Console-Logs in Railway Dashboard
- **Performance:** Railway Metrics für CPU/Memory

#### Custom Domain (Optional)
1. **Domain kaufen** (z.B. bei Strato)
2. **Railway Custom Domain** konfigurieren
3. **DNS-Records** bei Domain-Provider eintragen
4. **Automatisches SSL** von Railway

## 📝 Changelog

### Version 2.1 (September 2025) - Production Deployment
- ✅ **Railway Deployment:** Vollständige Production-Bereitstellung auf Railway.app
- ✅ **PostgreSQL Migration:** Migration von SQLite zu PostgreSQL für Production
- ✅ **Automatisches Database Seeding:** Startup-Script für automatisches Laden der Testdaten
- ✅ **Environment Configuration:** Vollständige Environment-Variable-Konfiguration
- ✅ **CORS-Konfiguration:** Korrekte CORS-Einstellungen für lokale und Production-Umgebungen
- ✅ **API-Konfiguration:** Einheitliche API-URL-Konfiguration für alle Umgebungen
- ✅ **Frontend-Backend Integration:** Korrektur aller fetch() Calls zu api.get() für konsistente API-Kommunikation
- ✅ **Passwort-Update-Endpoint:** Implementierung des fehlenden PUT /users/:id/password Endpoints
- ✅ **Copyright-Schutz:** Hinzufügung von Copyright-Vermerk für geistiges Eigentum
- ✅ **Production-Ready:** Vollständig deploybare Anwendung mit automatischem Deployment

### Version 2.0 (Januar 2025)
- ✅ **Neue Status/Entscheidungs-Architektur:** Trennung von Workflow-Phase und Ergebnis
- ✅ **Vereinfachte Prioritäten:** Nur noch HIGH und URGENT, null als Standard
- ✅ **Neue Bearbeiter-Aktionen:** Insassen kontaktieren, weiterleiten, entscheiden, persönliche Eröffnung
- ✅ **Entscheidungs-Workflow:** Ergebnis an Insassen senden, AVD-Eröffnung, weiterführende Bearbeitung
- ✅ **Manuelle Änderungen:** Status/Entscheidung ändern, Priorität ändern
- ✅ **Rückfragen-System:** Staff kann Insassen Rückfragen stellen, Insassen können antworten
- ✅ **Informations-System:** Staff kann Informationen an Insassen senden
- ✅ **Weiterleitung:** Anträge an andere Staff-Gruppen weiterleiten
- ✅ **Persönliche Eröffnung:** Dokumentation persönlicher Entscheidungsmitteilung
- ✅ **Aktivitätslog erweitert:** Neue Aktivitätstypen für alle neuen Features
- ✅ **UI-Verbesserungen:** Kompakte Statistiken, bessere Anzeige, blaue Buttons
- ✅ **Code-Bereinigung:** Entfernung ungenutzter Features (ProcessManagement, ApplicationProcessing)
- ✅ **KI-Integration:** Multi-Provider-Support für Textübersetzung und Titel-Generierung (OpenAI, Gemini, Claude)
- ✅ **Automatische Titel-Generierung:** Kurze, prägnante Titel aus übersetztem Text
- ✅ **Live-Übersetzung:** Echtzeit-Übersetzung in Rückfragen-Modals
- ✅ **Rückfragen-Übersetzung:** Automatische Übersetzung von Staff-Rückfragen
- ✅ **Antwort-Übersetzung:** Live-Übersetzung von Insassen-Antworten
- ✅ **Anbieterunabhängige Architektur:** Einfacher Provider-Wechsel mit automatischem Fallback
- ✅ **Multi-Language Support:** Vollständige Internationalisierung (i18n) mit 10 Sprachen
- ✅ **RTL-Unterstützung:** Vollständige Unterstützung für rechts-nach-links Sprachen
- ✅ **Sprache-abhängige KI:** Intelligente KI-Funktionen basierend auf UI-Sprache
- ✅ **Information-Modal:** Anklickbare Informationsliste mit KI-Übersetzung und Ausblenden-Funktion
- ✅ **Benutzerübersicht:** Zentrale Verwaltung aller Mitarbeitenden
- ✅ **Dark Mode:** Unterstützung für dunkles Design

### Version 1.0
- ✅ Basis-System mit Authentifizierung
- ✅ Insassen- und Mitarbeiter-Features
- ✅ Admin-Dashboard und Gruppen-Management
- ✅ Hausverwaltung mit Zellen-Management
- ✅ Workflow-Engine mit automatischer Zuweisung

## 🤝 Beitragen

### Entwicklungsumgebung
1. Repository klonen
2. Dependencies installieren
3. Datenbank einrichten
4. Entwicklungsserver starten

### Coding Standards
- TypeScript für alle neuen Features
- Tailwind CSS für Styling
- ESLint und Prettier für Code-Qualität
- Dokumentation für neue Features

### Testing
- Unit Tests für Backend-APIs
- Integration Tests für Frontend-Backend
- E2E Tests für kritische Workflows

## 📄 Lizenz

Dieses Projekt ist für interne Zwecke entwickelt und nicht zur öffentlichen Verwendung bestimmt.

---

**Entwickelt für:** Prisoner Services System  
**Version:** 2.0
