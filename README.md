# Prisoner Services Web Application

Eine moderne Webanwendung für die Verwaltung von Gefängnisdiensten, entwickelt mit React, Node.js und TypeScript. Das System vereint Insassen- und Verwaltungsfunktionen in einer einheitlichen, rollenbasierten Anwendung.

## 🎯 Projektübersicht

Diese Anwendung ist ein Nachbau des ursprünglichen Appian-Systems "Prisoner Services" und bietet:

- **Insassen-Features:** Antragstellung, Status-Abfragen, persönliche Übersicht, Rückfragen beantworten, KI-Textübersetzung
- **Mitarbeiter-Features:** Antragsbearbeitung, Workflow-Management, Kommentare, Insassen-Übersicht, neue Bearbeiter-Aktionen
- **Admin-Features:** Gruppenverwaltung, System-Überwachung, Audit-Logs, Hausverwaltung, Benutzerübersicht
- **Hausverwaltung:** Zellen-Management, Insassen-Zuweisungen, Drag & Drop, Automatische Zuweisung
- **Insassen-Übersicht:** Zentrale Insassen-Verwaltung mit vollständigen Details und Historie
- **KI-Integration:** Mehrsprachige Textübersetzung mit automatischer Titel-Generierung (OpenAI, Gemini, Claude)
- **Multi-Language Support:** Vollständige Internationalisierung (i18n) mit 10 Sprachen
- **Information-Modal:** Anklickbare Informationsliste mit KI-Übersetzung und Ausblenden-Funktion

## 🆕 **Neue Features (Version 2.0)**

### 🔄 **Neue Architektur: Status und Entscheidung getrennt**
- **Status:** Workflow-Phase (Ausstehend, In Bearbeitung, Abgeschlossen)
- **Entscheidung:** Ergebnis (Genehmigt, Abgelehnt, Zurückgewiesen)
- **Unabhängige Verwaltung:** Status und Entscheidung können unabhängig voneinander gesetzt werden

### 🎯 **Vereinfachte Prioritäten**
- **Nur noch 2 Prioritäten:** "Hohe Priorität" (HIGH) und "Höchste Priorität" (URGENT)
- **Keine Priorität:** Standardwert `null` - wird nicht angezeigt
- **Prioritätsänderung:** Staff kann Prioritäten über "Antrag priorisieren" Button ändern

### 🚫 **Entfernte Features**
- **Automatische Zuweisung:** Workflow-Regeln für automatische Service-Zuweisung entfernt
- **Process Management:** Komplette Entfernung von Prozess-Management-Features
- **ApplicationProcessing.tsx:** Ungenutzte Komponente entfernt

### ✅ **Neue Bearbeiter-Aktionen**
- **Insassen kontaktieren:** Rückfragen und Informationen an Insassen senden
- **Weiterleiten:** Anträge an andere Staff-Gruppen weiterleiten
- **Kommentar erstellen:** Kommentare zum Antrag hinzufügen
- **Entscheiden:** Anträge genehmigen, ablehnen oder zurückweisen
- **Persönliche Eröffnung:** Dokumentation persönlicher Entscheidungsmitteilung

### 🔄 **Entscheidungs-Workflow**
- **Ergebnis an Insassen senden:** Direkte Entscheidungsmitteilung
- **AVD-Eröffnung:** Zuweisung an AVD für persönliche Eröffnung
- **Weiterführende Bearbeitung:** Option für komplexere Anträge

### 🛠️ **Manuelle Änderungen**
- **Status oder Entscheidung ändern:** Flexibles Ändern beider Felder
- **Antrag priorisieren:** Prioritätsänderung über Modal
- **Status zu "In Bearbeitung":** Schnelle Statusänderung für ausstehende Anträge

### 🤖 **KI-Integration (Multi-Provider)**
- **Anbieterunabhängige Architektur:** OpenAI, Google Gemini, Anthropic Claude
- **Automatischer Fallback:** Wechsel zu Backup-Provider bei Ausfällen
- **Mehrsprachige Übersetzung:** Textübersetzung in beliebige Sprachen
- **Automatische Titel-Generierung:** Kurze, prägnante Titel (max. 5 Wörter) aus übersetztem Text
- **Live-Übersetzung:** Echtzeit-Übersetzung in Rückfragen-Modals
- **Rückfragen-Übersetzung:** Automatische Übersetzung von Staff-Rückfragen
- **Antwort-Übersetzung:** Live-Übersetzung von Insassen-Antworten
- **Information-Übersetzung:** Automatische Übersetzung von Staff-Informationen im Modal
- **Zentrale Konfiguration:** Einfacher Provider-Wechsel über Umgebungsvariablen
- **Provider-Monitoring:** Überwachung aller konfigurierten Provider

### 🌍 **Multi-Language Support (i18n)**
- **10 unterstützte Sprachen:** Deutsch, Englisch, Spanisch, Französisch, Arabisch, Persisch, Türkisch, Russisch, Polnisch, Italienisch
- **RTL-Unterstützung:** Vollständige Unterstützung für rechts-nach-links Sprachen (Arabisch, Persisch)
- **Sprache-abhängige KI:** Intelligente KI-Funktionen basierend auf UI-Sprache
- **Statische Übersetzungen:** JSON-basierte Übersetzungsdateien
- **Dynamische Inhalte:** KI-Übersetzung für dynamische Inhalte

## 🏗️ Projektstruktur

```
prisonApp/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── routes/         # API Routen
│   │   │   ├── auth.ts     # Authentifizierung
│   │   │   ├── services.ts # Service-Management (erweitert)
│   │   │   ├── users.ts    # Benutzerverwaltung
│   │   │   ├── groups.ts   # Gruppen-Management
│   │   │   ├── adminLogs.ts # Admin-Logs
│   │   │   ├── houses.ts   # Hausverwaltung & Zellen-Management
│   │   │   ├── inmates.ts  # Insassen-Management
│   │   │   └── ai.ts       # KI-Integration (Multi-Provider)
│   │   ├── services/       # Service-Layer
│   │   │   └── ai/         # KI-Provider-Implementierungen
│   │   │       ├── AIProvider.ts # Provider-Interface
│   │   │       ├── AIProviderFactory.ts # Provider-Factory
│   │   │       ├── OpenAIProvider.ts # OpenAI Implementation
│   │   │       ├── GeminiProvider.ts # Google Gemini Implementation
│   │   │       └── ClaudeProvider.ts # Anthropic Claude Implementation
│   │   ├── config/         # Konfiguration
│   │   │   └── ai.ts       # KI-Konfiguration
│   │   ├── middleware/     # Middleware
│   │   │   ├── auth.ts     # Authentifizierung & Berechtigungen
│   │   │   └── adminLogging.ts # Admin-Logging
│   │   └── app.ts          # Hauptanwendung
│   ├── prisma/             # Datenbankschema
│   │   ├── schema.prisma   # Datenbankschema (aktualisiert)
│   │   ├── seed.ts         # Testdaten (Benutzer, Gruppen, Services)
│   │   ├── seed-houses.ts  # Testdaten (Häuser, Stationen, Zellen)
│   │   └── migrations/     # Datenbank-Migrationen
│   └── package.json
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   │   ├── Navbar.tsx  # Navigation
│   │   │   ├── AITextTranslator.tsx # KI-Textübersetzung
│   │   │   ├── DraggableInmate.tsx # Drag & Drop Insassen-Karten
│   │   │   ├── TransferModal.tsx # Insassen-Verlegung
│   │   │   ├── CellAssignmentModal.tsx # Zellen-Zuweisung
│   │   │   ├── SearchFilters.tsx # Suchfilter
│   │   │   └── ...         # Weitere Komponenten
│   │   ├── pages/         # Seitenkomponenten
│   │   │   ├── HouseManagement.tsx # Hausverwaltung
│   │   │   ├── InmatesOverview.tsx # Insassen-Übersicht
│   │   │   ├── UserOverview.tsx # Benutzerübersicht
│   │   │   ├── AdminDashboard.tsx # Admin-Dashboard
│   │   │   ├── AdminLogs.tsx # Admin-Logs
│   │   │   ├── ServiceDetail.tsx # Service-Details (erweitert)
│   │   │   ├── StaffDashboard.tsx # Staff-Dashboard (erweitert)
│   │   │   ├── MyServices.tsx # Insassen-Anträge
│   │   │   ├── AllMyServices.tsx # Alle Insassen-Anträge
│   │   │   ├── NewService.tsx # Neuer Antrag
│   │   │   └── Login.tsx # Login-Seite
│   │   ├── contexts/      # React Contexts
│   │   │   ├── AuthContext.tsx # Authentifizierung
│   │   │   ├── DarkModeContext.tsx # Dark Mode
│   │   │   └── LanguageContext.tsx # Multi-Language Support
│   │   ├── locales/       # Übersetzungsdateien
│   │   │   ├── de.json    # Deutsche Übersetzungen
│   │   │   ├── en.json    # Englische Übersetzungen
│   │   │   ├── ar.json    # Arabische Übersetzungen
│   │   │   ├── fa.json    # Persische Übersetzungen
│   │   │   └── ...        # Weitere Sprachen
│   │   └── services/      # API Services
│   │       └── api.ts     # API-Client
│   └── package.json
├── README.md               # Hauptdokumentation
├── PROJECT_DOCUMENTATION.md # Detaillierte Projektdokumentation
├── KI_INTEGRATION_SETUP.md # KI-Integration Setup
└── .gitignore
```

## 🚀 Schnellstart

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn

### Installation

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

   **Backend (Terminal 1):**
   ```bash
   cd backend
   npm run dev
   ```
   Backend läuft auf: http://localhost:3001

   **Frontend (Terminal 2):**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend läuft auf: http://localhost:3000

## 🔐 Authentifizierung

### Testdaten

Das System wird mit folgenden Testdaten initialisiert:

#### Benutzer (Passwort: "test")
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

## 🔧 Technologie-Stack

### Backend
- **Node.js** mit **Express**
- **TypeScript** für Typsicherheit
- **Prisma ORM** für Datenbankzugriff
- **SQLite** als Datenbank
- **JWT** für Authentifizierung
- **bcryptjs** für Passwort-Hashing
- **express-validator** für Input-Validierung
- **KI-Integration:** OpenAI, Google Gemini, Anthropic Claude SDKs

### Frontend
- **React 18** mit **TypeScript**
- **Vite** als Build-Tool
- **React Router** für Navigation
- **Tailwind CSS** für Styling
- **Axios** für API-Kommunikation
- **Lucide React** für Icons
- **React Hook Form** für Formulare
- **Dark Mode** Support

## 📝 Changelog

### Version 2.0
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

## 🔒 Sicherheit

### Implementiert
- JWT-Token Authentifizierung
- Passwort-Hashing mit bcryptjs
- CORS-Konfiguration
- Helmet.js für HTTP-Header
- Input-Validierung mit express-validator
- Gruppen-basierte Zugriffskontrolle (RBAC)
- Admin-Berechtigungsprüfung (Frontend und Backend)
- Admin-Aktions-Logging für Audit-Zwecke


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

## 📄 Lizenz

Dieses Projekt ist für interne Zwecke entwickelt und nicht zur öffentlichen Verwendung bestimmt.

---

**Entwickelt für:** Prisoner Services System  
**Version:** 2.0
