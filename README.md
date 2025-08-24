# Prisoner Services Web Application

Eine moderne Webanwendung für die Verwaltung von Gefängnisdiensten, entwickelt mit React, Node.js und TypeScript. Das System vereint Insassen- und Verwaltungsfunktionen in einer einheitlichen, rollenbasierten Anwendung.

## 🎯 Projektübersicht

Diese Anwendung ist ein Nachbau des ursprünglichen Appian-Systems "Prisoner Services" und bietet:

- **Insassen-Features:** Antragstellung, Status-Abfragen, persönliche Übersicht
- **Mitarbeiter-Features:** Antragsbearbeitung, Workflow-Management, Kommentare, Insassen-Übersicht
- **Admin-Features:** Gruppenverwaltung, System-Überwachung, Audit-Logs, Hausverwaltung
- **Hausverwaltung:** Zellen-Management, Insassen-Zuweisungen, Drag & Drop, Automatische Zuweisung
- **Insassen-Übersicht:** Zentrale Insassen-Verwaltung mit vollständigen Details und Historie

## 🏗️ Projektstruktur

```
prisoner-services-web/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── routes/         # API Routen
│   │   │   ├── auth.ts     # Authentifizierung
│   │   │   ├── services.ts # Service-Management
│   │   │   ├── users.ts    # Benutzerverwaltung
│   │   │   ├── groups.ts   # Gruppen-Management
│   │   │   ├── adminLogs.ts # Admin-Logs
│   │   │   └── houses.ts   # Hausverwaltung & Zellen-Management
│   │   ├── middleware/     # Middleware
│   │   │   ├── auth.ts     # Authentifizierung & Berechtigungen
│   │   │   └── adminLogging.ts # Admin-Logging
│   │   └── app.ts          # Hauptanwendung
│   ├── prisma/             # Datenbankschema
│   │   ├── schema.prisma   # Datenbankschema
│   │   └── seed.ts         # Testdaten
│   └── package.json
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   ├── pages/         # Seitenkomponenten
│   │   ├── contexts/      # React Contexts
│   │   └── services/      # API Services
│   └── package.json
└── README.md
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
   npm run db:seed  # Testdaten erstellen
   npx db:seed      # Alternative für Windows (falls npx prisma db seed nicht funktioniert)
   ```

2. **Frontend einrichten:**
   ```bash
   cd frontend
   npm install
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

## 🗄️ Datenbank

Die Anwendung verwendet SQLite für die lokale Entwicklung:

- **Datenbankdatei:** `backend/prisma/dev.db`
- **Schema:** `backend/prisma/schema.prisma`

### Datenbank-Setup

```bash
cd backend
npx prisma studio  # Öffnet Prisma Studio für Datenbankverwaltung
```

### Testdaten

Das System wird mit vordefinierten Testdaten initialisiert:

```bash
cd backend
npm run db:seed
```

**Verfügbare Test-Benutzer (Passwort: "test"):**
- `admin` - System-Administrator
- `inmate001` - Insasse
- `avd001` - Allgemeiner Vollzugsdienst
- `val001` - Vollzugsabteilungsleitung
- `vl001` - Vollzugsleitung
- `al001` - Anstaltsleitung
- `zahlstelle001` - Zahlstelle
- `arzt001` - Ärztliches Personal

## 🔐 Authentifizierung & Berechtigungen

Die Anwendung verwendet ein flexibles Gruppen-basiertes Berechtigungssystem:

### Gruppen-System
- **Alle Benutzer** (SYSTEM) - Basis-Berechtigungen
- **Insassen** (INMATE) - Antragstellung und -verfolgung
- **Allgemeiner Vollzugsdienst (AVD)** (STAFF) - Erste Bearbeitung
- **Vollzugsabteilungsleitung (VAL)** (STAFF) - Erweiterte Genehmigungen
- **Vollzugsleitung (VL)** (STAFF) - Höhere Genehmigungen
- **Anstaltsleitung (AL)** (STAFF) - Höchste Genehmigungen
- **Zahlstelle** (STAFF) - Zahlungsanträge
- **Ärztliches Personal** (STAFF) - Gesundheitsanträge
- **Administratoren** (ADMIN) - Vollzugriff

### Authentifizierung
- **JWT-Token** basierte Authentifizierung
- **Token-Speicherung:** LocalStorage
- **Token-Gültigkeit:** 24 Stunden
- **Passwort-Hashing:** bcryptjs mit Salt 12

## 📋 Features

### ✅ Vollständig implementiert

#### 🔐 Authentifizierung & Sicherheit
- [x] JWT-Token-basierte Authentifizierung
- [x] Gruppen-basierte Zugriffskontrolle (RBAC)
- [x] Admin-Berechtigungsprüfung
- [x] Passwort-Hashing mit bcryptjs
- [x] Automatische Token-Erneuerung

#### 👥 Insassen-Features
- [x] Antragstellung (Neuer Antrag)
- [x] Antragsübersicht (Meine Anträge)
- [x] Status-Abfragen
- [x] Rollenbasierte Navigation

#### 👨‍💼 Mitarbeiter-Features
- [x] Mitarbeiter-Dashboard mit Service-Übersicht
- [x] Erweiterte Service-Details mit Kommentaren
- [x] Status-Änderungen mit Begründungen
- [x] Aktivitätsverlauf für jeden Service
- [x] Workflow-Engine mit automatischen Status-Übergängen
- [x] Task-Zuweisung für Mitarbeiter
- [x] **Insassen-Übersicht** - Zentrale Insassen-Verwaltung mit vollständigen Details

#### 🛡️ Admin-Features
- [x] Admin-Dashboard mit KPIs und System-Status
- [x] Gruppen-Management (Benutzer hinzufügen/entfernen)
- [x] Admin-Logs für Audit-Zwecke
- [x] Service-Übersicht mit Lösch-Funktion
- [x] Benutzerfreundliche Gruppennamen
- [x] Klickbare Gruppenzeilen (ausklappbare Mitgliederlisten)
- [x] Kategoriebasierte Sortierung
- [x] In-App Modals statt Browser-Dialoge
- [x] **Hausverwaltung** - Vollständiges Zellen-Management-System

#### 🏠 Hausverwaltung (Admin)
- [x] **Haus-Übersicht** - Alle Häuser mit Belegungsstatistiken
- [x] **Station-Management** - Stationen pro Haus verwalten
- [x] **Zellen-Management** - Zellen pro Station mit Kapazitäten
- [x] **Drag & Drop Zuweisungen** - Intuitive Insassen-Zuweisung
- [x] **Automatische Zuweisung** - Intelligente Zuweisung unzugewiesener Insassen
- [x] **Zuweisungshistorie** - Vollständige Historie aller Zellen-Zuweisungen
- [x] **Insassen-Verlegung** - Insassen zwischen Zellen verlegen
- [x] **Farbkodierung** - Visuelle Belegungsanzeige (frei/teilweise belegt/voll)
- [x] **Suchfunktionen** - Erweiterte Filter für Häuser, Stationen, Zellen
- [x] **Ausstehende Zuweisungen** - Übersicht unzugewiesener Insassen

#### 👥 Insassen-Übersicht (Mitarbeiter)
- [x] **Zentrale Insassen-Liste** - Alle Insassen mit Suchfunktion
- [x] **Detail-Ansicht** - Vollständige Insassen-Informationen in Tabs
- [x] **Persönliche Daten** - Name, E-Mail, Registrierungsdatum
- [x] **Anträge-Übersicht** - Alle Services des Insassen mit Status
- [x] **Aktuelle Zuweisung** - Aktuelle Zelle, Station, Haus
- [x] **Zuweisungshistorie** - Vollständige Historie mit Datum/Uhrzeit
- [x] **Responsive Design** - Optimiert für alle Geräte

#### 🔄 Workflow & Automatisierung
- [x] Automatische Status-Übergänge
- [x] Task-Zuweisung für Mitarbeiter
- [x] Workflow-Statistiken
- [x] Aktivitätsprotokollierung
- [x] **Automatische Zellen-Zuweisung** - Intelligente Platzierung

#### 🎨 UI/UX
- [x] Responsive Benutzeroberfläche
- [x] Moderne Tailwind CSS Gestaltung
- [x] Intuitive Navigation
- [x] Sofortige UI-Aktualisierung
- [x] System-Gruppen-Schutz
- [x] **Drag & Drop Interface** - Intuitive Zuweisungen
- [x] **Farbkodierte Belegung** - Visuelle Status-Anzeige
- [x] **Tab-basierte Detail-Ansicht** - Übersichtliche Informationsdarstellung

### 🚧 Geplant
- [ ] E-Mail-Benachrichtigungen
- [ ] Dokumenten-Upload für Anträge
- [ ] Erweiterte Berichte und Statistiken
- [ ] Session-Management für Admin-Sessions
- [ ] Erweiterte Insassen-Features (Kontoinformationen)
- [ ] Erweiterte Hausverwaltung (Mehrere Gefängnisse)
- [ ] Zellen-Wartung und -Instandhaltung
- [ ] Insassen-Statistiken und -Berichte

## 🛠️ Technologie-Stack

### Backend
- **Node.js** mit **Express**
- **TypeScript** für Typsicherheit
- **Prisma ORM** für Datenbankzugriff
- **SQLite** als Datenbank
- **JWT** für Authentifizierung
- **bcryptjs** für Passwort-Hashing
- **express-validator** für Input-Validierung

### Frontend
- **React 18** mit **TypeScript**
- **Vite** als Build-Tool
- **React Router** für Navigation
- **Tailwind CSS** für Styling
- **Axios** für API-Kommunikation
- **Lucide React** für Icons
- **React Hook Form** für Formulare

## 📁 API-Endpunkte

### Authentifizierung
- `POST /api/auth/login` - Benutzeranmeldung
- `POST /api/auth/register` - Benutzerregistrierung
- `GET /api/auth/verify` - Token-Verifizierung
- `GET /api/auth/hash-password/:password` - Passwort hashen (DEV)

### Services
- `GET /api/services` - Alle Services abrufen
- `GET /api/services/:id` - Service nach ID abrufen
- `POST /api/services` - Neuen Service erstellen
- `PUT /api/services/:id` - Service aktualisieren
- `DELETE /api/services/:id` - Service löschen
- `PATCH /api/services/:id/status` - Status ändern
- `DELETE /api/services/all` - Alle Services löschen (nur Admin)

### Insassen-spezifische Services
- `GET /api/services/my/services` - Eigene Services abrufen (nur INMATE)
- `POST /api/services/my/services` - Neuen Antrag erstellen (nur INMATE)

### Mitarbeiter-spezifische Services
- `GET /api/services/staff/all` - Alle Services für Mitarbeiter
- `GET /api/services/staff/statistics` - Service-Statistiken
- `GET /api/services/staff/workflow-stats` - Workflow-Statistiken
- `POST /api/services/staff/assign-pending` - Ausstehende Anträge zuweisen

### Gruppen-Management (Admin)
- `GET /api/groups` - Alle Gruppen abrufen
- `GET /api/groups/:id` - Gruppe nach ID abrufen
- `POST /api/groups/:id/users` - Benutzer zu Gruppe hinzufügen
- `DELETE /api/groups/:id/users/:userId` - Benutzer aus Gruppe entfernen

### Admin-Logs (Admin)
- `GET /api/admin-logs` - Admin-Logs abrufen (mit Pagination und Filtern)
- `GET /api/admin-logs/statistics` - Admin-Log Statistiken
- `GET /api/admin-logs/:id` - Spezifischen Admin-Log abrufen

### Benutzer
- `GET /api/users` - Alle Benutzer abrufen
- `GET /api/users/:id` - Benutzer nach ID abrufen
- `PUT /api/users/:id` - Benutzer aktualisieren

### Hausverwaltung
- `GET /api/houses` - Alle Häuser abrufen
- `GET /api/houses/:id` - Haus nach ID abrufen
- `POST /api/houses` - Neues Haus erstellen
- `PUT /api/houses/:id` - Haus aktualisieren
- `DELETE /api/houses/:id` - Haus deaktivieren
- `GET /api/houses/:houseId/stations` - Stationen eines Hauses abrufen
- `POST /api/houses/:houseId/stations` - Neue Station erstellen
- `PUT /api/houses/stations/:id` - Station aktualisieren
- `DELETE /api/houses/stations/:id` - Station deaktivieren
- `GET /api/houses/stations/:stationId/cells` - Zellen einer Station abrufen
- `POST /api/houses/stations/:stationId/cells` - Neue Zelle erstellen
- `PUT /api/houses/cells/:id` - Zelle aktualisieren
- `DELETE /api/houses/cells/:id` - Zelle deaktivieren
- `GET /api/houses/cells/:cellId/assignments` - Zellen-Zuweisungen abrufen
- `POST /api/houses/cells/:cellId/assignments` - Insasse zu Zelle zuweisen
- `DELETE /api/houses/assignments/:id` - Zellen-Zuweisung entfernen
- `GET /api/houses/assignments/current/:userId` - Aktuelle Zuweisung eines Insassen
- `GET /api/houses/assignments/history/:userId` - Zuweisungshistorie eines Insassen

## 🔧 Entwicklung

### Backend-Entwicklung
```bash
cd backend
npm run dev          # Entwicklungsserver starten
npm run build        # TypeScript kompilieren
npm run start        # Produktionsserver starten
```

### Frontend-Entwicklung
```bash
cd frontend
npm run dev          # Entwicklungsserver starten
npm run build        # Produktionsbuild erstellen
npm run preview      # Produktionsbuild testen
```

### Datenbank-Entwicklung
```bash
cd backend
npx prisma studio    # Datenbank-GUI öffnen
npx prisma generate  # Prisma Client generieren
npx prisma db push   # Schema zur Datenbank pushen
npm run db:seed      # Testdaten erstellen
npx db:seed          # Alternative für Windows
```

## 🧪 Testing

### Backend-Tests
```bash
cd backend
npm test
```

### Frontend-Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Backend-Deployment
```bash
cd backend
npm run build
npm start
```

### Frontend-Deployment
```bash
cd frontend
npm run build
# dist/ Ordner auf Webserver deployen
```

## 🎨 UI/UX Features

### Moderne Benutzeroberfläche
- **Responsive Design:** Optimiert für Desktop und Mobile
- **Tailwind CSS:** Konsistente Gestaltung
- **Lucide Icons:** Moderne Icon-Bibliothek
- **Intuitive Navigation:** Rollenbasierte Menüs

### Admin-Dashboard
- **KPIs:** Übersichtliche Kennzahlen
- **Gruppen-Management:** Intuitive Benutzerverwaltung
- **Klickbare Gruppenzeilen:** Ausklappbare Mitgliederlisten
- **Kategoriebasierte Sortierung:** Logische Hierarchie
- **In-App Modals:** Konsistente Benutzerführung

### Hausverwaltung
- **Haus-Übersicht:** Alle Häuser mit Belegungsstatistiken
- **Drag & Drop:** Intuitive Insassen-Zuweisung per Drag & Drop
- **Farbkodierung:** Visuelle Belegungsanzeige (grau=leer, blau=teilweise, türkis=voll)
- **Automatische Zuweisung:** Intelligente Zuweisung unzugewiesener Insassen
- **Zuweisungshistorie:** Vollständige Historie aller Zellen-Zuweisungen
- **Suchfunktionen:** Erweiterte Filter für Häuser, Stationen, Zellen, Insassen
- **Ausstehende Zuweisungen:** Übersicht und Verwaltung unzugewiesener Insassen

### Insassen-Übersicht
- **Zentrale Liste:** Alle Insassen mit Suchfunktion
- **Detail-Ansicht:** Vollständige Informationen in übersichtlichen Tabs
- **Persönliche Daten:** Name, E-Mail, Registrierungsdatum
- **Anträge:** Alle Services des Insassen mit Status und Priorität
- **Aktuelle Zuweisung:** Zelle, Station, Haus
- **Zuweisungshistorie:** Vollständige Historie mit Datum und Uhrzeit

### Workflow-Engine
- **Automatische Status-Übergänge:** Intelligente Prozesssteuerung
- **Task-Zuweisung:** Automatische Mitarbeiter-Zuweisung
- **Aktivitätsverlauf:** Vollständige Historie
- **Kommentar-System:** Kommunikation zwischen Beteiligten

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

### Geplant
- API-Rate-Limiting
- Session-Management für Admin-Sessions
- Erweiterte Audit-Logs

## 🤝 Beitragen

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/AmazingFeature`)
3. Committe deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:

1. Überprüfe die [Issues](../../issues) auf GitHub
2. Erstelle ein neues Issue mit detaillierter Beschreibung
3. Kontaktiere das Entwicklungsteam

## 🔄 Updates

### Version 3.0.0 (Dezember 2024)
- ✅ **Hausverwaltung** - Vollständiges Zellen-Management-System
- ✅ **Drag & Drop Zuweisungen** - Intuitive Insassen-Zuweisung
- ✅ **Automatische Zuweisung** - Intelligente Zuweisung unzugewiesener Insassen
- ✅ **Zuweisungshistorie** - Vollständige Historie aller Zellen-Zuweisungen
- ✅ **Insassen-Übersicht** - Zentrale Insassen-Verwaltung mit vollständigen Details
- ✅ **Farbkodierte Belegung** - Visuelle Status-Anzeige (grau/blau/türkis)
- ✅ **Erweiterte Suchfunktionen** - Filter für Häuser, Stationen, Zellen, Insassen
- ✅ **Ausstehende Zuweisungen** - Übersicht und Verwaltung unzugewiesener Insassen
- ✅ **Insassen-Verlegung** - Insassen zwischen Zellen verlegen
- ✅ **Tab-basierte Detail-Ansicht** - Übersichtliche Informationsdarstellung

### Version 2.0.0 (Dezember 2024)
- ✅ Vollständige Insassen-Features
- ✅ Vollständige Mitarbeiter-Features
- ✅ Vollständige Admin-Features
- ✅ Workflow-Engine
- ✅ UI/UX Verbesserungen
- ✅ Benutzerfreundliche Gruppennamen
- ✅ Klickbare Gruppenzeilen
- ✅ Kategoriebasierte Sortierung
- ✅ In-App Modals

### Version 1.0.0
- Grundlegende CRUD-Funktionalitäten
- Benutzerauthentifizierung
- Responsive UI
- SQLite-Datenbank

---

**Entwickelt mit ❤️ für die Gefängnisverwaltung**

**Status:** ✅ Vollständig funktionsfähige Anwendung mit Insassen-, Mitarbeiter-, Admin-Features, Hausverwaltung und Insassen-Übersicht
