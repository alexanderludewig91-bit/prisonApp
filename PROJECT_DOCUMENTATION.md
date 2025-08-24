# Prisoner Services - Projekt-Dokumentation

## 🎯 Projektübersicht

Dieses Projekt ist eine moderne Webanwendung, die das ursprüngliche Appian-System "Prisoner Services" nachbaut. Das System besteht aus zwei Hauptapplikationen, die in einer einheitlichen Webanwendung vereint werden:

1. **SharedTerminal** - Für Insassen (Antragstellung, Status-Abfragen)
2. **Prisoner Services** - Für Verwaltungsmitarbeiter (Antragsbearbeitung, Workflow)

## 🚀 Aktueller Status

### ✅ Implementiert (Stand: Dezember 2024)
- **Backend:** Node.js + Express + TypeScript + Prisma + SQLite
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Authentifizierung:** JWT-Token basiert mit flexibler Gruppen-basierter Rollenverwaltung
- **Basis-Features:** Login, Dashboard, Service-Management, Benutzerverwaltung
- **Datenbank:** SQLite mit Prisma ORM
- **Rollenbasierte Navigation:** Automatische Menü-Anpassung je nach Benutzergruppen
- **Insassen-Features:** 
  - ✅ Antragstellung (Neuer Antrag)
  - ✅ Antragsübersicht (Meine Anträge)
  - ✅ Echte API-Verbindung zwischen Frontend und Backend
- **Mitarbeiter-Features:**
  - ✅ Mitarbeiter-Dashboard mit Service-Übersicht
  - ✅ Erweiterte Service-Details mit Kommentaren
  - ✅ Status-Änderungen mit Begründungen
  - ✅ Aktivitätsverlauf für jeden Service
  - ✅ **Insassen-Übersicht** - Zentrale Insassen-Verwaltung mit vollständigen Details
- **Admin-Features:**
  - ✅ Admin-Dashboard mit KPIs und System-Status
  - ✅ Gruppen-Management (Benutzer zu Gruppen hinzufügen/entfernen)
  - ✅ Admin-Logs für Audit-Zwecke
  - ✅ Service-Übersicht mit Lösch-Funktion
  - ✅ Benutzerfreundliche Gruppennamen (Beschreibungen statt technische Namen)
  - ✅ Klickbare Gruppenzeilen (Ausklappbare Mitgliederlisten)
  - ✅ Kategoriebasierte Sortierung (ADMIN → STAFF → INMATE → SYSTEM)
  - ✅ In-App Modals statt Browser-Dialoge
  - ✅ **Hausverwaltung** - Vollständiges Zellen-Management-System
- **Workflow-Engine:**
  - ✅ Automatische Status-Übergänge
  - ✅ Task-Zuweisung für Mitarbeiter
  - ✅ Workflow-Statistiken
- **Backend API:** 
  - ✅ Insassen-spezifische Endpunkte (`/api/services/my/services`)
  - ✅ Mitarbeiter-spezifische Endpunkte (`/api/services/staff/*`)
  - ✅ Admin-spezifische Endpunkte (`/api/groups`, `/api/admin-logs`)
  - ✅ JWT-Middleware für User-Informationen
  - ✅ Gruppen-basierte Berechtigungsprüfung
  - ✅ Admin-Berechtigungsprüfung (`checkAdmin` Middleware)
  - ✅ Aktivitätsprotokollierung bei Service-Erstellung
  - ✅ Admin-Aktions-Logging für Audit-Zwecke
  - ✅ **Hausverwaltung API** - Vollständige API für Zellen-Management

### 🎯 Nächste Schritte
- **E-Mail-Benachrichtigungen** (Workflow-Engine erweitern)
- **Dokumenten-Upload** für Anträge
- **Erweiterte Berichte** und Statistiken
- **Mehrere Gefängnisse** (Hausverwaltung erweitern)
- **Zellen-Wartung** (Wartungs- und Instandhaltungs-Features)

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

**Benutzer (Passwort: "test"):**
- `admin` - System-Administrator
- `inmate001` - Insasse
- `avd001` - Allgemeiner Vollzugsdienst
- `val001` - Vollzugsabteilungsleitung
- `vl001` - Vollzugsleitung
- `al001` - Anstaltsleitung
- `zahlstelle001` - Zahlstelle
- `arzt001` - Ärztliches Personal

**Hausverwaltung-Testdaten:**
- **Häuser:** Haus A, Haus B, Haus C
- **Stationen:** Verschiedene Stationen pro Haus
- **Zellen:** Zellen mit unterschiedlichen Kapazitäten (1-4 Insassen)
- **Keine Zuweisungen:** Insassen werden nicht automatisch zugewiesen

### Datenbank-Setup

```bash
cd backend
npx prisma studio  # Öffnet Prisma Studio für Datenbankverwaltung
```

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

## 📁 Projektstruktur

```
/
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
│   │   ├── seed.ts         # Testdaten (Benutzer, Gruppen, Services)
│   │   ├── seed-houses.ts  # Testdaten (Häuser, Stationen, Zellen)
│   │   └── migrations/     # Datenbank-Migrationen
│   └── package.json
├── frontend/               # React + TypeScript
│   ├── src/
│   │   ├── components/     # React Komponenten
│   │   │   ├── Navbar.tsx  # Navigation
│   │   │   ├── DraggableInmate.tsx # Drag & Drop Insassen-Karten
│   │   │   ├── TransferModal.tsx # Insassen-Verlegung
│   │   │   └── ...         # Weitere Komponenten
│   │   ├── pages/         # Seitenkomponenten
│   │   │   ├── HouseManagement.tsx # Hausverwaltung
│   │   │   ├── InmatesOverview.tsx # Insassen-Übersicht
│   │   │   ├── AdminDashboard.tsx # Admin-Dashboard
│   │   │   └── ...         # Weitere Seiten
│   │   ├── contexts/      # React Contexts
│   │   │   └── AuthContext.tsx # Authentifizierung
│   │   └── services/      # API Services
│   └── package.json
├── README.md               # Hauptdokumentation
├── PROJECT_DOCUMENTATION.md # Detaillierte Projektdokumentation
└── .gitignore
```
│   │   ├── contexts/      # React Contexts
│   │   └── services/      # API Services
│   └── package.json
├── prisonerServices/       # Originales Appian-Projekt
└── README.md
```

## 🗄️ Datenbankschema

### Aktuelle Tabellen (Prisma Schema)

```prisma
// Benutzer und Gruppen
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  role      String   @default("STAFF") // INMATE, STAFF, ADMIN
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Beziehungen
  groups    UserGroup[]
  services  Service[] @relation("CreatedBy")
  assignedServices Service[] @relation("AssignedTo")
  activities Activity[] @relation("ActivityUser")
  adminLogs AdminLog[] @relation("AdminLogs")

  @@map("users")
}

model Group {
  id          Int    @id @default(autoincrement())
  name        String @unique
  description String?
  category    String @default("STAFF") // SYSTEM, STAFF, INMATE, ADMIN
  permissions Json?  // Flexible Berechtigungen als JSON
  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Beziehungen
  users       UserGroup[]

  @@map("groups")
}

model UserGroup {
  id      Int @id @default(autoincrement())
  userId  Int
  groupId Int
  role    String @default("MEMBER") // ADMIN, MEMBER, VIEWER

  // Beziehungen
  user    User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  group   Group @relation(fields: [groupId], references: [id], onDelete: Cascade)

  @@unique([userId, groupId])
  @@map("user_groups")
}

// Service Management
model Service {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      String   @default("PENDING") // PENDING, IN_PROGRESS, COMPLETED, REJECTED
  priority    String   @default("MEDIUM")  // LOW, MEDIUM, HIGH, URGENT
  number      Float?
  folderId    Int?
  assignedTo  Int?     // Zugewiesener Mitarbeiter
  
  // Beziehungen
  createdBy   Int
  createdByUser User @relation("CreatedBy", fields: [createdBy], references: [id])
  assignedToUser User? @relation("AssignedTo", fields: [assignedTo], references: [id])
  activities  Activity[] @relation("ServiceActivities")
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("services")
}

// Aktivitätsverlauf
model Activity {
  id        Int      @id @default(autoincrement())
  recordId  Int?     // Referenz auf Service ID
  who       String?  // Benutzername
  action    String?  // Aktion (z.B. "created", "updated", "status_changed")
  details   String?  // Details der Aktion
  when      DateTime @default(now())
  
  // Beziehungen
  userId    Int?
  user      User?    @relation("ActivityUser", fields: [userId], references: [id])
  service   Service? @relation("ServiceActivities", fields: [recordId], references: [id])

  @@map("activities")
}

// Admin Audit Log
model AdminLog {
  id          Int      @id @default(autoincrement())
  adminUserId Int
  adminUsername String
  action      String   // z.B. "DELETE_ALL_SERVICES", "ADD_USER_TO_GROUP"
  target      String?  // Betroffenes Objekt (z.B. "services", "groups")
  details     String?  // Detaillierte Beschreibung
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  // Beziehungen
  admin       User     @relation("AdminLogs", fields: [adminUserId], references: [id], onDelete: Cascade)

  @@map("admin_logs")
}

// Status und Prioritäten (Lookup-Tabellen)
model Status {
  id          Int    @id @default(autoincrement())
  name        String @unique
  description String?
  color       String? // Für UI-Darstellung
  isActive    Boolean @default(true)
  
  @@map("statuses")
}

model Priority {
  id          Int    @id @default(autoincrement())
  name        String @unique
  description String?
  color       String? // Für UI-Darstellung
  isActive    Boolean @default(true)
  
  @@map("priorities")
}
```

## 🔐 Authentifizierung & Berechtigungen

### Aktuelle Implementierung
- **JWT-Token** basierte Authentifizierung
- **Token-Speicherung:** LocalStorage
- **Token-Gültigkeit:** 24 Stunden
- **Passwort-Hashing:** bcryptjs mit Salt 12
- **Flexible Gruppen-basierte Berechtigungen**

### Gruppen-System
Das System verwendet ein flexibles Gruppen-basiertes Berechtigungssystem:

#### Verfügbare Gruppen (mit benutzerfreundlichen Namen):
- **Alle Benutzer** (technisch: PS All Users) - Basis-Berechtigungen für alle Benutzer
- **Insassen** (technisch: PS Inmates) - Insassen-spezifische Berechtigungen
- **Allgemeiner Vollzugsdienst (AVD)** (technisch: PS General Enforcement Service) - Allgemeine Vollzugsdienst-Mitarbeiter
- **Vollzugsabteilungsleitung (VAL)** (technisch: PS Vollzugsabteilungsleitung) - Abteilungsleitung
- **Vollzugsleitung (VL)** (technisch: PS Vollzugsleitung) - Vollzugsleitung
- **Anstaltsleitung (AL)** (technisch: PS Anstaltsleitung) - Anstaltsleitung
- **Zahlstelle** (technisch: PS Payments Office) - Zahlstellen-Mitarbeiter
- **Ärztliches Personal** (technisch: PS Medical Staff) - Medizinisches Personal
- **Administratoren** (technisch: PS Designers) - Administratoren mit vollen Rechten

#### Gruppen-Kategorien:
- **SYSTEM:** Technische Gruppen (automatisch zugewiesen)
- **INMATE:** Insassen-spezifische Gruppen
- **STAFF:** Mitarbeiter-Gruppen
- **ADMIN:** Administrator-Gruppen

#### Sortierung im Admin-Dashboard:
Die Gruppen werden nach Kategorie sortiert angezeigt:
1. **ADMIN** (höchste Priorität)
2. **STAFF** (zweite Priorität)
3. **INMATE** (dritte Priorität)
4. **SYSTEM** (niedrigste Priorität)

Bei gleicher Kategorie erfolgt alphabetische Sortierung nach Beschreibung.

### Benutzer-Erstellung
```bash
# Passwort hashen (temporärer Endpunkt)
GET /api/auth/hash-password/:password

# Benutzer in Prisma Studio erstellen
npx prisma studio

# Oder Seed-Script verwenden
npm run db:seed
```

## 📡 API-Endpunkte

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

### Service-spezifische Endpunkte
- `GET /api/services/:id/comments` - Kommentare zu Service abrufen
- `POST /api/services/:id/comments` - Kommentar zu Service hinzufügen

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

## 🚀 Entwicklung

### Schnellstart
```bash
# Backend
cd backend
npm install
npx prisma generate
npx prisma db push
npm run db:seed  # Testdaten erstellen
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Datenbank
```bash
cd backend
npx prisma studio    # Datenbank-GUI öffnen
npx prisma generate  # Prisma Client generieren
npx prisma db push   # Schema zur Datenbank pushen
npm run db:seed      # Testdaten erstellen
```

**⚠️ Wichtige Hinweise:**
- **Prisma-Befehle müssen manuell ausgeführt werden** (Assistant hat keine Berechtigung)
- **Bei Schema-Änderungen:** Prisma Studio beenden und neu starten
- **Bei Windows EPERM Error:** Backend stoppen → Prisma-Befehl → Backend neu starten

## 🏛️ Ursprüngliches Appian-System

### Gefundene Applikationen

#### 1. PS SharedTerminal (für Insassen)
**Datei:** `prisonerServices/site/7675e544-1988-4096-b03d-b4a5dd735773.xml`
- **URL-Stub:** `shared-terminal`
- **Zweck:** Insassen über Shared Terminals
- **Seiten:**
  - Home (`terminal-landing`) - Landing Page
  - Meine Einreichungen (`mysubmissions`) - Anträge
  - Kontoinformationen (`kontoinformationen`) - Persönliche Daten

#### 2. Prisoner Services (für Verwaltung)
**Datei:** `prisonerServices/site/19532b86-05c7-4091-b977-aba513bf1e34_SITE.xml`
- **URL-Stub:** `prisoner-services`
- **Zweck:** Gefängnisverwaltung
- **Seiten:**
  - Services (`records`) - Antragsverwaltung
  - Trends (`trends`) - Berichte
  - My Tasks (`tasks`) - Aufgaben

#### 3. PS Backoffice (erweiterte Verwaltung)
**Datei:** `prisonerServices/site/88c8e282-a30d-434a-b747-5cde10d2b785.xml`
- **URL-Stub:** `gefaengisverwaltung`
- **Seiten:**
  - Startseite (`startseite`)
  - Alle Anfragen (`all-requests`)

### Appian-Konzepte Mapping

| Appian-Konzept | Web-Entwicklung |
|----------------|-----------------|
| Record Types | Datenbank-Tabellen |
| Process Models | Workflow-Engine |
| Data Stores | API-Endpunkte |
| Sites | Frontend-Routen |
| Groups | Benutzerrollen |
| Content | React-Komponenten |

## 🔄 Entwicklungsschritte

### ✅ Phase 1: Rollenbasierte Anwendung (ABGESCHLOSSEN)
1. ✅ **Datenbank erweitert:** User-Rolle hinzugefügt (`INMATE`, `STAFF`, `ADMIN`)
2. ✅ **Backend API erweitert:** Rollen-basierte Endpunkte implementiert
3. ✅ **Frontend Navigation angepasst:** Rollen-basierte Menüs funktionieren
4. ✅ **Insassen-Dashboard erstellt:** Dashboard mit Rollen-Anzeige
5. ✅ **Antragstellung für Insassen implementiert:** Vollständig funktionsfähig

### ✅ Phase 2: Mitarbeiter-Features (ABGESCHLOSSEN)
1. ✅ **Mitarbeiter-Dashboard** implementiert
2. ✅ **Antragsbearbeitung** für Mitarbeiter implementiert
3. ✅ **Status-Änderungen** für Services ermöglicht
4. ✅ **Erweiterte Service-Übersicht** mit Filtern
5. ✅ **Workflow-Engine** für Antragsbearbeitung implementiert
6. ✅ **Task-Zuweisung** für Mitarbeiter
7. ✅ **Kommentar-System** für Services
8. ✅ **Aktivitätsverlauf** für jeden Service

### ✅ Phase 3: Admin-Features (ABGESCHLOSSEN)
1. ✅ **Admin-Dashboard** mit KPIs und System-Status
2. ✅ **Gruppen-Management** (Benutzer zu Gruppen hinzufügen/entfernen)
3. ✅ **Admin-Logs** für Audit-Zwecke
4. ✅ **Service-Übersicht** mit Lösch-Funktion
5. ✅ **Flexibles Gruppen-System** implementiert
6. ✅ **Admin-Berechtigungsprüfung** (Frontend und Backend)
7. ✅ **Dashboard-Konsolidierung** (Allgemeines Dashboard entfernt)

### ✅ Phase 4: UI/UX Verbesserungen (ABGESCHLOSSEN)
1. ✅ **Benutzerfreundliche Gruppennamen** implementiert (Beschreibungen statt technische Namen)
2. ✅ **Klickbare Gruppenzeilen** implementiert (Ausklappbare Mitgliederlisten)
3. ✅ **Kategoriebasierte Sortierung** implementiert (ADMIN → STAFF → INMATE → SYSTEM)
4. ✅ **In-App Modals** statt Browser-Dialoge implementiert
5. ✅ **Sofortige UI-Aktualisierung** nach Benutzer-Änderungen
6. ✅ **System-Gruppen-Schutz** implementiert (keine Bearbeitung von System-Gruppen)

### 🎯 Phase 5: Erweiterte Features (AKTUELL)
1. **E-Mail-Benachrichtigungen** für Workflow-Events
2. **Dokumenten-Upload** für Anträge
3. **Erweiterte Berichte** und Statistiken
4. **Session-Management** für Admin-Sessions
5. **Erweiterte Insassen-Features** (Kontoinformationen, Benachrichtigungen)

## 🐛 Bekannte Probleme & Lösungen

### 1. Prisma Schema Validation Error
**Problem:** `Error validating field 'activities' in model 'Service'`
**Lösung:** Gegenseitige Relation zwischen Service und Activity hinzufügen

### 2. Login mit Klartext-Passwort
**Problem:** Benutzer kann sich nicht einloggen
**Lösung:** Passwort über `/api/auth/hash-password/:password` hashen

### 3. Module not found Errors
**Problem:** Viele Fehlermeldungen in Backend-Routes
**Lösung:** `npm install` und `npx prisma generate` ausführen

### 4. Prisma Studio zeigt keine Schema-Änderungen
**Problem:** Nach `npx prisma db push` sind neue Spalten nicht sichtbar
**Lösung:** Prisma Studio komplett beenden und neu starten
**Wichtig:** Der Assistant kann keine Prisma-Befehle ausführen - diese müssen manuell vom User gemacht werden

### 5. Windows EPERM Error bei Prisma
**Problem:** `EPERM: operation not permitted` bei `npx prisma generate`
**Lösung:** Backend stoppen (Ctrl+C), dann Prisma-Befehl ausführen, dann Backend neu starten

### 6. TypeScript-Fehler in Backend-Routes
**Problem:** `Parameter 'req' implicitly has an 'any' type`, `Property 'user' does not exist on type 'Request'`
**Lösung:** 
- `Request` und `Response` Types von `express` importieren
- `AuthenticatedRequest` Interface definieren für erweiterte Request-Typen
- Alle Route-Handler explizit typisieren: `async (req: Request, res: Response) => {}`
- `catch (error)` zu `catch (error: any)` ändern
- `ug` Parameter in `.map()` Funktionen typisieren: `(ug: any) => {}`

**Beispiel-Fix:**
```typescript
// Vorher
router.get('/', async (req, res) => {
  // ...
});

// Nachher  
router.get('/', async (req: Request, res: Response) => {
  // ...
});

// Für erweiterte Request-Typen
interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
    role: string;
    groups: string[];
  };
}
```

### 7. Admin-Logs Filter funktioniert nicht
**Problem:** SQLite unterstützt `mode: 'insensitive'` nicht
**Lösung:** `mode: 'insensitive'` aus Prisma-Queries entfernen

### 8. UserGroup-Tabelle leer nach Seed
**Problem:** Foreign Key Constraint Error beim Löschen
**Lösung:** Reihenfolge der Löschoperationen anpassen (Activities → Services → UserGroups → Users)

### 9. Seed-Script Abhängigkeiten von Gruppennamen
**Problem:** Umbenennung von Gruppen würde Seed-Script brechen
**Lösung:** Benutzerfreundliche Gruppennamen über `description` Feld, technische Namen bleiben unverändert

## 📄 Wichtige Dateien

### Backend
- `backend/src/app.ts` - Hauptanwendung
- `backend/src/routes/auth.ts` - Authentifizierung
- `backend/src/routes/services.ts` - Service-Management
- `backend/src/routes/users.ts` - Benutzerverwaltung
- `backend/src/routes/groups.ts` - Gruppen-Management
- `backend/src/routes/adminLogs.ts` - Admin-Logs
- `backend/src/middleware/auth.ts` - Authentifizierung & Berechtigungen
- `backend/src/middleware/adminLogging.ts` - Admin-Logging
- `backend/prisma/schema.prisma` - Datenbankschema
- `backend/prisma/seed.ts` - Datenbank-Seeding

### Frontend
- `frontend/src/App.tsx` - Hauptkomponente
- `frontend/src/contexts/AuthContext.tsx` - Authentifizierung
- `frontend/src/services/api.ts` - API-Services
- `frontend/src/components/Navbar.tsx` - Navigation
- `frontend/src/pages/` - Seitenkomponenten
  - `AdminDashboard.tsx` - Admin-Dashboard
  - `AdminLogs.tsx` - Admin-Logs
  - `StaffDashboard.tsx` - Mitarbeiter-Dashboard
  - `MyServices.tsx` - Insassen-Services
  - `NewService.tsx` - Neuer Antrag

## 🏠 Hausverwaltung

### 🎯 Zweck
Die Hausverwaltung ermöglicht es Administratoren, das komplette Zellen-Management-System zu verwalten, einschließlich Häuser, Stationen, Zellen und Insassen-Zuweisungen.

### 🔧 Technische Implementierung

#### Datenbankschema
```prisma
// Neue Tabellen für Hausverwaltung
model House {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  isActive    Boolean   @default(true)
  stations    Station[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Station {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  isActive    Boolean   @default(true)
  houseId     Int
  house       House     @relation(fields: [houseId], references: [id])
  cells       Cell[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Cell {
  id          Int       @id @default(autoincrement())
  number      String
  description String?
  capacity    Int       @default(1)
  isActive    Boolean   @default(true)
  stationId   Int
  station     Station   @relation(fields: [stationId], references: [id])
  assignments CellAssignment[]
  assignmentHistory CellAssignmentHistory[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model CellAssignment {
  id            Int       @id @default(autoincrement())
  cellId        Int
  cell          Cell      @relation(fields: [cellId], references: [id])
  userId        Int
  user          User      @relation(fields: [userId], references: [id])
  assignedBy    Int?
  assignedByUser User?    @relation("AssignedBy", fields: [assignedBy], references: [id])
  notes         String?
  isActive      Boolean   @default(true)
  assignedAt    DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@unique([cellId, userId])
}

// Zuweisungshistorie (Option 2: Separate Tabelle)
model CellAssignmentHistory {
  id          Int      @id @default(autoincrement())
  action      String   // "ASSIGNED", "TRANSFERRED", "REMOVED"
  notes       String?  // Notizen zur Aktion
  createdAt   DateTime @default(now())

  // Beziehungen
  cellId      Int
  cell        Cell     @relation("CellAssignmentHistory", fields: [cellId], references: [id], onDelete: Cascade)
  userId      Int
  user        User     @relation("CellAssignmentHistory", fields: [userId], references: [id], onDelete: Cascade)
  assignedBy  Int?     // Admin-ID der die Aktion vorgenommen hat (optional)
  assignedByUser User? @relation("HistoryCreatedBy", fields: [assignedBy], references: [id])

  @@map("cell_assignment_history")
}
```

#### Frontend-Komponenten

##### HouseManagement.tsx
- **Hauptkomponente** für die Hausverwaltung
- **Tabs:** Übersicht, Häuser, Ausstehende Zuweisungen
- **Drag & Drop:** Implementiert mit HTML5 Drag & Drop API
- **Farbkodierung:** Grau (leer), Blau (teilweise), Türkis (voll)
- **Suchfunktionen:** Erweiterte Filter für alle Ebenen

##### DraggableInmate.tsx
- **Draggable Komponente** für Insassen-Karten
- **Action Buttons:** Verlegen und Entfernen
- **Visueller Feedback:** Hover-Effekte und Drag-States

##### TransferModal.tsx
- **Modal** für Insassen-Verlegung
- **Zellen-Auswahl:** Filterbare Dropdown-Liste
- **Validierung:** Kapazitätsprüfung und Duplikat-Vermeidung

#### Backend-APIs

##### Hausverwaltung Routes (`/api/houses`)
```typescript
// Haus-Management
GET    /api/houses                    # Alle Häuser abrufen
GET    /api/houses/:id               # Haus nach ID abrufen
POST   /api/houses                   # Neues Haus erstellen
PUT    /api/houses/:id               # Haus aktualisieren
DELETE /api/houses/:id               # Haus deaktivieren

// Station-Management
GET    /api/houses/:houseId/stations # Stationen eines Hauses
POST   /api/houses/:houseId/stations # Neue Station erstellen
PUT    /api/houses/stations/:id      # Station aktualisieren
DELETE /api/houses/stations/:id      # Station deaktivieren

// Zellen-Management
GET    /api/houses/stations/:stationId/cells # Zellen einer Station
POST   /api/houses/stations/:stationId/cells # Neue Zelle erstellen
PUT    /api/houses/cells/:id         # Zelle aktualisieren
DELETE /api/houses/cells/:id         # Zelle deaktivieren

// Zellen-Zuweisungen
GET    /api/houses/cells/:cellId/assignments     # Zellen-Zuweisungen
POST   /api/houses/cells/:cellId/assignments     # Insasse zuweisen
DELETE /api/houses/assignments/:id               # Zuweisung entfernen
GET    /api/houses/assignments/current/:userId   # Aktuelle Zuweisung
GET    /api/houses/assignments/history/:userId   # Zuweisungshistorie
```

### 🎨 UI/UX Features

#### Drag & Drop
- **Intuitive Bedienung:** Insassen per Drag & Drop zuweisen
- **Visueller Feedback:** Hover-Effekte und Drop-Zonen
- **Validierung:** Automatische Kapazitätsprüfung
- **Fehlerbehandlung:** Benutzerfreundliche Fehlermeldungen

#### Farbkodierung
- **Grau:** Leere Zellen (0 Insassen)
- **Blau:** Teilweise belegte Zellen (1 bis capacity-1 Insassen)
- **Türkis:** Voll belegte Zellen (capacity Insassen)

#### Suchfunktionen
- **Haus-Filter:** Nach Hausnamen filtern
- **Station-Filter:** Nach Stationsnamen filtern
- **Belegungs-Filter:** Nach Belegungsstatus filtern
- **Text-Suche:** Nach Insassen-Namen, Zellen-Nummer, Beschreibungen

#### Automatische Zuweisung
- **Intelligente Platzierung:** Optimale Zellen-Auswahl
- **Kapazitätsprüfung:** Automatische Überprüfung verfügbarer Plätze
- **Bestätigungsdialog:** Sicherheitsabfrage vor Massenzuweisung
- **Fehlerbehandlung:** Benutzerfreundliche Fehlermeldungen

## 👥 Insassen-Übersicht

### 🎯 Zweck
Die Insassen-Übersicht bietet allen Mitarbeitern eine zentrale Verwaltung aller Insassen mit vollständigen Details, Anträgen und Zuweisungshistorie.

### 🔧 Technische Implementierung

#### Frontend-Komponente

##### InmatesOverview.tsx
- **Hauptkomponente** für die Insassen-Übersicht
- **Zwei-Spalten-Layout:** Liste + Detail-Ansicht
- **Tab-basierte Details:** Persönliche Daten, Anträge, Zuweisung, Historie
- **Suchfunktion:** Echtzeit-Filterung der Insassen-Liste

#### Datenstruktur
```typescript
interface Inmate {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  createdAt: string;
  currentAssignment?: {
    cell: {
      number: string;
      station: {
        name: string;
        house: {
          name: string;
        };
      };
    };
  };
  services?: Array<{
    id: number;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  assignmentHistory?: Array<{
    id: number;
    action: string;
    notes?: string;
    createdAt: string;
    cell: {
      number: string;
      station: {
        name: string;
        house: {
          name: string;
        };
      };
    };
    assignedByUser?: {
      firstName: string;
      lastName: string;
    };
  }>;
}
```

### 🎨 UI/UX Features

#### Insassen-Liste
- **Suchfunktion:** Nach Name, Username, E-Mail
- **Aktuelle Zelle:** Anzeige der aktuellen Zuweisung
- **Selektierung:** Klickbare Einträge für Detail-Ansicht
- **Responsive Design:** Optimiert für alle Geräte

#### Detail-Ansicht (Tabs)

##### Persönliche Daten
- **Vollständige Informationen:** Name, E-Mail, Registrierungsdatum
- **Übersichtliche Darstellung:** Grid-Layout für bessere Lesbarkeit

##### Anträge
- **Service-Übersicht:** Alle Anträge des Insassen
- **Status-Anzeige:** Farbkodierte Status-Badges
- **Priorität:** Anzeige der Antrags-Priorität
- **Erstellungsdatum:** Chronologische Sortierung

##### Aktuelle Zuweisung
- **Zellen-Informationen:** Zelle, Station, Haus
- **Strukturierte Darstellung:** Übersichtliche Grid-Layout
- **Fallback:** Anzeige wenn keine Zuweisung vorhanden

##### Zuweisungshistorie
- **Vollständige Historie:** Alle bisherigen Zuweisungen
- **Datum und Uhrzeit:** Deutsche Formatierung (DD.MM.YYYY HH:MM)
- **Action-Badges:** Farbkodierte Aktionen (ASSIGNED, TRANSFERRED, REMOVED)
- **Zusätzliche Informationen:** Notizen und durchführende Person

## 🎨 UI/UX Design

### Farben (Tailwind)
- **Primary:** Blue (primary-500: #3b82f6)
- **Background:** Gray-50 (#f9fafb)
- **Cards:** White mit Shadow
- **Buttons:** Primary-Blue, Secondary-Gray, Danger-Red

### Komponenten
- **Buttons:** `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Inputs:** `.input`
- **Cards:** `.card`

### Dashboard-Layout
- **Admin-Dashboard:** KPIs, Gruppen-Management, System-Status, Hausverwaltung
- **Mitarbeiter-Dashboard:** Service-Übersicht, Workflow-Statistiken, Insassen-Übersicht
- **Insassen-Dashboard:** Eigene Anträge, Neuer Antrag

### UI/UX Verbesserungen
- **Benutzerfreundliche Gruppennamen:** Anzeige von `description` statt `name`
- **Klickbare Gruppenzeilen:** Ganze Zeile klickbar für Ausklappen
- **Kategoriebasierte Sortierung:** Logische Hierarchie der Gruppen
- **In-App Modals:** Konsistente Benutzerführung ohne Browser-Dialoge
- **Sofortige UI-Aktualisierung:** Keine Seitenaktualisierung nötig
- **System-Gruppen-Schutz:** Keine Bearbeitung technischer Gruppen
- **Drag & Drop Interface:** Intuitive Zuweisungen
- **Farbkodierte Belegung:** Visuelle Status-Anzeige
- **Tab-basierte Detail-Ansicht:** Übersichtliche Informationsdarstellung

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

## 🎯 Aktuelle Erfolge

### ✅ Vollständig funktionsfähige Insassen-Features
- **Antragstellung:** Insassen können neue Anträge erstellen
- **Antragsübersicht:** Eigene Anträge werden angezeigt
- **Rollenbasierte Navigation:** Automatische Menü-Anpassung
- **Echte API-Verbindung:** Frontend kommuniziert mit Backend
- **Datenbankintegration:** Anträge werden in SQLite gespeichert
- **Aktivitätsprotokollierung:** Alle Aktionen werden dokumentiert

### ✅ Vollständig funktionsfähige Mitarbeiter-Features
- **Mitarbeiter-Dashboard:** Übersicht aller Services und Statistiken
- **Service-Bearbeitung:** Detaillierte Service-Ansicht mit Kommentaren
- **Status-Änderungen:** Status-Übergänge mit Begründungen
- **Workflow-Engine:** Automatische Status-Übergänge und Task-Zuweisung
- **Aktivitätsverlauf:** Vollständige Historie aller Service-Aktionen

### ✅ Vollständig funktionsfähige Admin-Features
- **Admin-Dashboard:** KPIs, Gruppen-Management, System-Status
- **Gruppen-Management:** Benutzer zu Gruppen hinzufügen/entfernen
- **Admin-Logs:** Vollständiges Audit-Logging aller Admin-Aktionen
- **Service-Übersicht:** Übersicht aller Services mit Lösch-Funktion
- **Flexibles Berechtigungssystem:** Gruppen-basierte Rollenverwaltung
- **Benutzerfreundliche Oberfläche:** Intuitive Gruppenverwaltung

### 🔧 Technische Implementierung
- **JWT-Middleware:** User-Informationen werden aus Token extrahiert
- **Gruppen-basierte Berechtigungsprüfung:** Flexible Rollenverwaltung
- **Admin-Berechtigungsprüfung:** `checkAdmin` Middleware für Admin-Routen
- **Admin-Logging:** Automatisches Logging aller Admin-Aktionen
- **Fehlerbehandlung:** Graceful Fallbacks bei API-Fehlern
- **TypeScript:** Vollständige Typsicherheit (alle Fehler behoben)
- **Prisma ORM:** Sichere Datenbankoperationen
- **AuthenticatedRequest Interface:** Erweiterte Request-Typen für JWT-User-Daten
- **Workflow-Engine:** Automatische Status-Übergänge und Task-Zuweisung
- **UI/UX Optimierung:** Moderne, intuitive Benutzeroberfläche

### 📊 Dashboard-KPIs
- **Anträge Gesamt:** Gesamtzahl aller Services
- **Offene Anträge:** Services mit Status PENDING
- **In Bearbeitung:** Services mit Status IN_PROGRESS
- **Abgeschlossene Anträge:** Services mit Status COMPLETED/REJECTED
- **Registrierte Benutzer:** Gesamtzahl aktiver Benutzer
- **Gruppen:** Anzahl aktiver Gruppen
- **Insassen:** Anzahl Benutzer in PS Inmates Gruppe

---

**Letzte Aktualisierung:** Dezember 2024
**Status:** ✅ Vollständig funktionsfähige Anwendung mit Insassen-, Mitarbeiter-, Admin-Features, Hausverwaltung und Insassen-Übersicht
**Version:** 3.0.0
**Nächster Schritt:** E-Mail-Benachrichtigungen und erweiterte Features implementieren
