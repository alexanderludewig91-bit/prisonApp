# Prisoner Services Web - Projekt-Dokumentation

## 📋 Projekt-Übersicht

**Ziel:** Rebuild der Appian "Prisoner Services" Anwendung als moderne Web-Anwendung mit React, Node.js und SQLite.

**Status:** ✅ **Phase 2.2 abgeschlossen - Workflow-Engine implementiert**

**Letzte Aktualisierung:** Dezember 2024

---

## 🎯 Aktueller Stand

### ✅ **Implementiert (Phase 1 & 2):**

#### **Phase 1: Insassen-Features**
- ✅ **Authentifizierung & Rollen-System** (INMATE, STAFF, ADMIN)
- ✅ **Insassen-Dashboard** mit eigenen Anträgen
- ✅ **Neue Anträge erstellen** (Titel, Beschreibung, Priorität)
- ✅ **Antrags-Übersicht** mit Status und Aktivitäten

#### **Phase 2: Mitarbeiter-Features**
- ✅ **Mitarbeiter-Dashboard** mit erweiterten Filtern
- ✅ **Antragsbearbeitung mit Kommentaren**
- ✅ **Status-Änderungen** mit Begründungen
- ✅ **Aktivitätsprotokoll** für alle Aktionen

#### **Phase 2.2: Workflow-Engine & Automatisierung** ⭐ **NEU**
- ✅ **Automatische Aufgaben-Zuweisung** bei Status-Änderungen
- ✅ **Workflow-Regeln** für Status-Übergänge
- ✅ **Zuweisungsinformationen** in Service-Liste und Details
- ✅ **Workflow-Statistiken** (meine Anträge, Auto-Zuweisungen, Übergänge)
- ✅ **Manuelle Zuweisung** bestehender PENDING Anträge
- ✅ **Aktivitätsprotokollierung** für Workflow-Aktionen

### 🔄 **In Entwicklung:**
- **Erweiterte Workflow-Features** (Prioritäten-basierte Zuweisung, Escalation)
- **Insassen-Features** (Benachrichtigungen, Dokumenten-Upload)

---

## 🏗️ Technologie-Stack

### **Frontend:**
- **React 18** mit TypeScript
- **Tailwind CSS** für Styling
- **React Router** für Navigation
- **Axios** für API-Kommunikation
- **Lucide React** für Icons
- **Vite** als Build-Tool

### **Backend:**
- **Node.js** mit Express
- **TypeScript** für Typsicherheit
- **Prisma ORM** für Datenbankzugriff
- **SQLite** als lokale Datenbank
- **JWT** für Authentifizierung
- **bcryptjs** für Passwort-Hashing

### **Datenbank:**
- **SQLite** (lokal)
- **Prisma Studio** für Datenbank-Management

---

## 📁 Projekt-Struktur

```
prisoner-services-web/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.ts          # Authentifizierung
│   │   │   ├── services.ts      # Service-Management + Workflow
│   │   │   └── users.ts         # Benutzer-Management
│   │   └── app.ts               # Express-App
│   ├── prisma/
│   │   └── schema.prisma        # Datenbank-Schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.tsx       # Navigation
│   │   ├── pages/
│   │   │   ├── Login.tsx        # Login-Seite
│   │   │   ├── Dashboard.tsx    # Haupt-Dashboard
│   │   │   ├── MyServices.tsx   # Insassen-Anträge
│   │   │   ├── NewService.tsx   # Neuer Antrag
│   │   │   ├── StaffDashboard.tsx # Mitarbeiter-Dashboard
│   │   │   └── ServiceDetail.tsx # Antrags-Details
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Auth-State
│   │   └── services/
│   │       └── api.ts           # API-Client
│   └── package.json
└── README.md
```

---

## 🗄️ Datenbank-Schema

### **Haupt-Tabellen:**

```prisma
model User {
  id        Int      @id @default(autoincrement())
  username  String   @unique
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  role      String   @default("STAFF") // INMATE, STAFF, ADMIN
  isActive  Boolean  @default(true)
  
  // Beziehungen
  services  Service[] @relation("CreatedBy")
  assignedServices Service[] @relation("AssignedTo") // ⭐ NEU
  activities Activity[]
}

model Service {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  status      String   @default("PENDING")
  priority    String   @default("MEDIUM")
  assignedTo  Int?     // ⭐ NEU: Zugewiesener Mitarbeiter
  
  // Beziehungen
  createdBy   Int
  createdByUser User @relation("CreatedBy", fields: [createdBy], references: [id])
  assignedToUser User? @relation("AssignedTo", fields: [assignedTo], references: [id]) // ⭐ NEU
  activities  Activity[]
}

model Activity {
  id        Int      @id @default(autoincrement())
  recordId  Int      // Service-ID
  who       String   // Username
  action    String   // created, status_changed, comment, assigned, workflow_transition
  details   String?
  when      DateTime @default(now())
  userId    Int
  
  // Beziehungen
  user      User     @relation("ActivityUser", fields: [userId], references: [id])
  service   Service  @relation("ServiceActivities", fields: [recordId], references: [id])
}
```

---

## 🔌 API-Endpunkte

### **Authentifizierung:**
- `POST /api/auth/login` - Benutzer-Login
- `POST /api/auth/register` - Benutzer-Registrierung
- `GET /api/auth/verify` - Token-Verifizierung
- `GET /api/auth/hash-password/:password` - Passwort-Hashing (Dev)

### **Services (Insassen):**
- `GET /api/services/my/services` - Eigene Anträge abrufen
- `POST /api/services/my/services` - Neuen Antrag erstellen

### **Services (Mitarbeiter):**
- `GET /api/services/staff/all` - Alle Anträge mit Filtern
- `GET /api/services/staff/statistics` - Service-Statistiken
- `GET /api/services/staff/workflow-stats` - ⭐ NEU: Workflow-Statistiken
- `POST /api/services/staff/assign-pending` - ⭐ NEU: PENDING Anträge zuweisen

### **Service-Management:**
- `GET /api/services/:id` - Service-Details
- `PATCH /api/services/:id/status` - Status ändern (mit Workflow)
- `GET /api/services/:id/comments` - Kommentare abrufen
- `POST /api/services/:id/comments` - Kommentar hinzufügen

---

## ⚙️ Workflow-Engine (NEU)

### **Workflow-Regeln:**
```typescript
const workflowRules = [
  {
    fromStatus: 'PENDING',
    toStatus: 'IN_PROGRESS',
    conditions: ['manual_review'],
    autoAssign: true,
    assignToRole: 'STAFF'
  },
  {
    fromStatus: 'PENDING',
    toStatus: 'COMPLETED',
    conditions: ['direct_approval'],
    autoAssign: true,
    assignToRole: 'STAFF'
  }
  // ... weitere Regeln
];
```

### **Automatische Zuweisung:**
- **PENDING → IN_PROGRESS:** Automatische Zuweisung an verfügbaren Mitarbeiter
- **PENDING → COMPLETED:** Automatische Zuweisung bei direkter Genehmigung
- **Lastverteilung:** Mitarbeiter mit geringster Arbeitslast werden bevorzugt

### **Workflow-Statistiken:**
- **Meine zugewiesenen Anträge:** Anzahl der dem eingeloggten Mitarbeiter zugewiesenen Anträge
- **Auto-Zuweisungen heute:** Anzahl automatischer Zuweisungen heute
- **Workflow-Übergänge heute:** Anzahl Workflow-Status-Übergänge heute

---

## 🎨 UI/UX Features

### **Mitarbeiter-Dashboard:**
- **Erweiterte Filter:** Status, Priorität, Suche, Datum
- **Workflow-Statistiken:** Echtzeit-Übersicht über Zuweisungen
- **Zuweisungsinformationen:** Anzeige zugewiesener Mitarbeiter
- **Schnell-Aktionen:** Status-Änderung direkt aus der Liste

### **Service-Details:**
- **Vollständige Antrags-Informationen**
- **Kommentar-System** für Mitarbeiter
- **Aktivitätsprotokoll** mit Zeitstempel
- **Zuweisungsinformationen** (falls zugewiesen)

### **Workflow-Features:**
- **"PENDING Anträge zuweisen" Button:** Manuelle Zuweisung bestehender Anträge
- **Automatische Zuweisung:** Bei Status-Änderungen
- **Workflow-Aktivitäten:** Protokollierung aller Workflow-Aktionen

---

## 🔧 Bekannte Probleme & Lösungen

### **Prisma Studio:**
- **Problem:** Schema-Änderungen werden nicht sofort angezeigt
- **Lösung:** Prisma Studio neu starten nach `npx prisma db push`

### **Windows EPERM Error:**
- **Problem:** `EPERM: operation not permitted` bei `npx prisma generate`
- **Lösung:** Backend-Prozess stoppen (`Ctrl+C`) vor Prisma-Befehlen

### **Manuelle Ausführung:**
- **Hinweis:** Prisma-Befehle müssen manuell vom Benutzer ausgeführt werden
- **Grund:** Assistant hat keine Berechtigung für CLI-Befehle

---

## 🚀 Nächste Entwicklungsschritte

### **Option A: Erweiterte Workflow-Features** (Empfohlen)
- **Prioritäten-basierte Zuweisung:** URGENT Anträge bevorzugt zuweisen
- **Escalation-System:** Automatische Eskalation bei Timeouts
- **Workflow-Visualisierung:** Grafische Darstellung des Antrags-Lebenszyklus

### **Option B: Erweiterte Dashboard-Features**
- **Erweiterte Statistiken:** Charts und Grafiken
- **Export-Funktionen:** PDF/Excel Export
- **Bulk-Operationen:** Mehrere Anträge gleichzeitig bearbeiten

### **Option C: Insassen-Features**
- **Benachrichtigungssystem:** Status-Updates für Insassen
- **Dokumenten-Upload:** Anhänge zu Anträgen
- **Antrags-Templates:** Vordefinierte Antragsarten

### **Option D: Erweiterte Filter & Suche**
- **Volltext-Suche:** Durchsuchung aller Antragsfelder
- **Erweiterte Filter:** Nach Zuweisung, Datum, Priorität
- **Gespeicherte Filter:** Benutzerdefinierte Filter-Profile

---

## 🔒 Sicherheit

### **Implementiert:**
- **JWT-basierte Authentifizierung**
- **Passwort-Hashing** mit bcryptjs
- **Rollen-basierte Zugriffskontrolle** (RBAC)
- **Input-Validierung** mit express-validator

### **Geplant:**
- **Rate Limiting** für API-Endpunkte
- **CORS-Konfiguration** für Produktionsumgebung
- **HTTPS** für Produktionsumgebung

---

## 📊 Test-Daten

### **Benutzer:**
- **Insasse:** `inmate001` / `password123` (Role: INMATE)
- **Mitarbeiter:** `staff001` / `password123` (Role: STAFF)
- **Admin:** `admin001` / `password123` (Role: ADMIN)

### **Test-Szenarien:**
1. **Insasse erstellt Antrag** → Antrag erscheint im Mitarbeiter-Dashboard
2. **Mitarbeiter weist PENDING Anträge zu** → Zuweisungsinformationen werden sichtbar
3. **Status-Änderung PENDING → IN_PROGRESS** → Automatische Zuweisung erfolgt
4. **Workflow-Statistiken** → Echtzeit-Updates bei Aktionen

---

## 📝 Wichtige Dateien

### **Backend:**
- `backend/src/routes/services.ts` - Hauptlogik für Services und Workflow
- `backend/prisma/schema.prisma` - Datenbank-Schema
- `backend/src/app.ts` - Express-App-Konfiguration

### **Frontend:**
- `frontend/src/pages/StaffDashboard.tsx` - Mitarbeiter-Dashboard mit Workflow-Features
- `frontend/src/pages/ServiceDetail.tsx` - Service-Details mit Kommentaren
- `frontend/src/contexts/AuthContext.tsx` - Authentifizierung

---

## 🎯 Aktuelle Prioritäten

1. **✅ Workflow-Engine implementiert** - ABGESCHLOSSEN
2. **🔄 Testing der Workflow-Features** - IN BEARBEITUNG
3. **📋 Nächste Phase planen** - AUSSTEHEND

---

## 📞 Support & Kontakt

**Projekt-Status:** Aktive Entwicklung
**Letzte Änderung:** Workflow-Engine implementiert
**Nächster Meilenstein:** Testing und Optimierung der Workflow-Features

---

*Dokumentation zuletzt aktualisiert: Dezember 2024*
