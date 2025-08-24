# Projektdokumentation - Hausverwaltung & Insassen-Übersicht

## 📋 Übersicht

Diese Dokumentation beschreibt die neu implementierten Features der **Hausverwaltung** und **Insassen-Übersicht** in der Prisoner Services Web Application.

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

## 🔄 Workflow-Integration

### Zuweisungshistorie
- **Automatische Erfassung:** Alle Zuweisungsänderungen werden protokolliert
- **Vollständige Details:** Zelle, Aktion, Notizen, durchführende Person
- **Zeitstempel:** Präzise Datum/Uhrzeit-Erfassung
- **Audit-Trail:** Vollständige Nachverfolgbarkeit

### Automatische Zuweisung
- **Intelligente Logik:** Optimale Zellen-Auswahl basierend auf Kapazität
- **Fehlerbehandlung:** Benutzerfreundliche Fehlermeldungen
- **Bestätigungsdialog:** Sicherheitsabfrage vor Massenzuweisung
- **In-App Dialoge:** Konsistente Benutzerführung

## 🛡️ Sicherheit & Berechtigungen

### Hausverwaltung
- **Nur Administratoren:** Vollzugriff auf Hausverwaltung
- **Validierung:** Backend-Validierung aller Eingaben
- **Audit-Logging:** Alle Änderungen werden protokolliert
- **Kapazitätsprüfung:** Automatische Überprüfung vor Zuweisungen

### Insassen-Übersicht
- **Alle Mitarbeiter:** Zugriff auf Insassen-Übersicht
- **Lesender Zugriff:** Nur Anzeige, keine Änderungen
- **Datenintegrität:** Sichere API-Aufrufe mit Authentifizierung

## 📊 Datenbank-Performance

### Optimierungen
- **Indizierung:** Optimierte Datenbank-Indizes für schnelle Abfragen
- **Eager Loading:** Reduzierte Anzahl von Datenbank-Abfragen
- **Pagination:** Skalierbare Implementierung für große Datenmengen
- **Caching:** Frontend-Caching für bessere Performance

### Skalierbarkeit
- **Modulare Architektur:** Erweiterbare Komponenten
- **API-Design:** RESTful APIs für einfache Integration
- **Datenbank-Schema:** Normalisierte Struktur für Datenintegrität

## 🧪 Testing

### Frontend-Tests
- **Komponenten-Tests:** Unit-Tests für alle React-Komponenten
- **Integration-Tests:** End-to-End Tests für Workflows
- **Drag & Drop Tests:** Spezielle Tests für Drag & Drop-Funktionalität

### Backend-Tests
- **API-Tests:** Unit-Tests für alle API-Endpunkte
- **Validierung-Tests:** Tests für Input-Validierung
- **Datenbank-Tests:** Integration-Tests mit Test-Datenbank

## 🚀 Deployment

### Voraussetzungen
- **Datenbank-Migration:** Neue Tabellen müssen erstellt werden
- **Prisma Client:** Regenerierung nach Schema-Änderungen
- **Frontend-Build:** Aktualisierte React-Komponenten

### Deployment-Schritte
```bash
# Backend
cd backend
npx prisma migrate deploy
npx prisma generate
npm run build
npm start

# Frontend
cd frontend
npm run build
# dist/ auf Webserver deployen
```

## 📈 Monitoring & Logging

### Logging
- **API-Logs:** Alle Hausverwaltungs-Aktionen werden geloggt
- **Fehler-Logs:** Detaillierte Fehlerprotokollierung
- **Performance-Logs:** Monitoring der API-Performance

### Monitoring
- **Datenbank-Performance:** Überwachung der Abfrage-Performance
- **API-Response-Times:** Monitoring der API-Antwortzeiten
- **Fehler-Raten:** Überwachung von Fehlern und Exceptions

## 🔧 Entwicklung & Deployment

### Entwicklung

#### Backend-Entwicklung
```bash
cd backend
npm run dev          # Entwicklungsserver starten
npm run build        # TypeScript kompilieren
npm run start        # Produktionsserver starten
```

#### Frontend-Entwicklung
```bash
cd frontend
npm run dev          # Entwicklungsserver starten
npm run build        # Produktionsbuild erstellen
npm run preview      # Produktionsbuild testen
```

#### Datenbank-Entwicklung
```bash
cd backend
npx prisma studio    # Datenbank-GUI öffnen
npx prisma generate  # Prisma Client generieren
npx prisma db push   # Schema zur Datenbank pushen
npm run db:seed      # Testdaten erstellen (Benutzer, Gruppen, Services)
npx db:seed          # Alternative für Windows
npx ts-node prisma/seed-houses.ts  # Hausverwaltung-Testdaten erstellen
```

### Deployment

#### Backend-Deployment
```bash
cd backend
npm run build
npm start
```

#### Frontend-Deployment
```bash
cd frontend
npm run build
# dist/ Ordner auf Webserver deployen
```

### Testing

#### Backend-Tests
```bash
cd backend
npm test
```

#### Frontend-Tests
```bash
cd frontend
npm test
```

## 🔮 Zukünftige Erweiterungen

### Geplante Features
- **Mehrere Gefängnisse:** Unterstützung für mehrere Standorte
- **Zellen-Wartung:** Wartungs- und Instandhaltungs-Features
- **Erweiterte Statistiken:** Detaillierte Berichte und Analysen
- **E-Mail-Benachrichtigungen:** Automatische Benachrichtigungen
- **Dokumenten-Upload:** Anhänge für Anträge und Zuweisungen

### Technische Verbesserungen
- **Real-time Updates:** WebSocket-Integration für Live-Updates
- **Offline-Support:** Service Worker für Offline-Funktionalität
- **Mobile App:** Native Mobile-Anwendung
- **API-Versioning:** Versionierte APIs für bessere Kompatibilität

## 📁 Projektstruktur

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
├── PROJEKT_DOKUMENTATION.md # Detaillierte Projektdokumentation
└── .gitignore
```

---

**Dokumentation erstellt:** Dezember 2024  
**Version:** 3.0.0  
**Status:** ✅ Vollständig implementiert und getestet
