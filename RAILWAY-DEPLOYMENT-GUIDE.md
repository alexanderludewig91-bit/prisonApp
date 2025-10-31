# Railway Deployment Guide - Lessons Learned

**Zweck**: Diese Dokumentation sammelt alle Erkenntnisse und Best Practices für Railway-Deployments, die in mehreren Projekten erarbeitet wurden. Sie dient als Referenz für zukünftige Deployments.

**Zielgruppe**: KI-Assistenten und Entwickler, die Node.js-Fullstack-Anwendungen auf Railway deployen.

---

## 📋 Inhaltsverzeichnis

1. [Grundlegende Architektur-Entscheidungen](#grundlegende-architektur-entscheidungen)
2. [Häufige Build-Probleme und Lösungen](#häufige-build-probleme-und-lösungen)
3. [Datenbank-Setup](#datenbank-setup)
4. [Umgebungsvariablen](#umgebungsvariablen)
5. [Production vs Development Modi](#production-vs-development-modi)
6. [Railway-spezifische Konfiguration](#railway-spezifische-konfiguration)
7. [Deployment-Checkliste](#deployment-checkliste)
8. [Troubleshooting-Patterns](#troubleshooting-patterns)

---

## 🏗️ Grundlegende Architektur-Entscheidungen

### Monolith vs. Separate Services

**Empfehlung für kleine bis mittlere Projekte: Monolith**

#### Separate Services (Prisoner Services Projekt)

```
✅ Vorteile:
- Unabhängige Skalierung von Frontend und Backend
- Klare Trennung der Verantwortlichkeiten
- Einfacheres Debugging (getrennte Logs)
- Flexiblere Deployment-Strategie
- Railway Hobby Plan (5€/Monat) unterstützt 3 Services problemlos

⚠️ Nachteile:
- CORS-Konfiguration erforderlich
- Komplexere Umgebungsvariablen-Verwaltung
- API-URL-Konfiguration im Frontend notwendig
- 3 Railway-Services erforderlich (Frontend, Backend, PostgreSQL)
```

**Unsere Implementierung**:
- **Frontend Service:** React + Vite → Statische Dateien (Caddy)
- **Backend Service:** Express API
- **Database Service:** PostgreSQL (Railway-managed)

**Wichtige Erkenntnisse**:
- Für **komplexere Anwendungen** mit vielen API-Calls ist die **Trennung übersichtlicher**
- CORS ist bei korrekter Konfiguration **kein Problem**
- **Logs sind klarer getrennt** → besseres Debugging

#### Monolith-Setup (Empfohlen)
```
✅ Vorteile:
- Nur eine Railway-Instanz → günstiger
- Keine CORS-Probleme
- Einfacheres Deployment
- Ein Domain, ein Port
- Perfekt für React + Express

❌ Nachteile:
- Weniger flexibel in der Skalierung
- Frontend und Backend teilen sich Ressourcen
```

**Implementierung**:
```typescript
// server/src/index.ts
import express from 'express';
import path from 'path';

const app = express();
const isDevelopment = process.env.NODE_ENV !== 'production';

// API Routes (immer zuerst!)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
// ...

// NUR in Production: Statische Files servieren
if (!isDevelopment) {
  const clientBuildPath = path.join(__dirname, '../../client/dist');
  
  // Statische Dateien
  app.use(express.static(clientBuildPath));
  
  // Catch-all für React Router (SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}
```

**Wichtig**: In Development bleiben 2 Prozesse (Vite Dev Server + Backend), in Production wird es automatisch zum Monolith.

---

## 🐛 Häufige Build-Probleme und Lösungen

### Problem 1: PostCSS/Vite Config - ES6 vs CommonJS

**Symptom**:
```
SyntaxError: Unexpected token 'export'
/app/client/postcss.config.js:1
export default {
^^^^^^
```

**Ursache**: Node.js in Railway erwartet CommonJS, nicht ES6 Modules.

**Lösung**:
```javascript
// ❌ FALSCH (ES6):
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// ✅ RICHTIG (CommonJS):
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### Problem 2: Subdirectory Dependencies nicht installiert

**Symptom**:
```
sh: 1: tsc: Permission denied
```
oder
```
Module not found: Can't resolve 'react'
```

**Ursache**: Railway installiert nur Root-Dependencies mit `npm ci`. Monorepo-Subdirectories (client/, server/) werden ignoriert.

**Lösung in `railway.json`**:
```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "cd server && npm ci && cd ../client && npm ci && cd .. && npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

**Alternative (weniger zuverlässig)**:
```json
// package.json (root)
{
  "scripts": {
    "postinstall": "cd server && npm ci && cd ../client && npm ci"
  }
}
```

⚠️ **Achtung**: `postinstall` wird manchmal von Railway blockiert. Expliziter `buildCommand` ist zuverlässiger!

---

### Problem 3: TypeScript Compilation Error - Property does not exist

**Symptom** (Prisoner Services):
```
src/services/ai/ClaudeProvider.ts(209,51): error TS2339: Property 'text' does not exist on type 'ContentBlock'.
```

**Ursache**: Externe SDK-Typen haben sich geändert oder sind nicht vollständig typisiert.

**Lösung**:
```typescript
// ❌ FALSCH (ohne Type-Assertion):
const text = response.content[0].text;

// ✅ RICHTIG (mit Type-Assertion):
const text = (response.content[0] as any)?.text;
```

**Best Practice**: Bei externen SDKs, die häufig aktualisiert werden (OpenAI, Claude, etc.), defensive Type-Assertions verwenden.

---

### Problem 4: Permission Denied für Prisma CLI

**Symptom**:
```
sh: 1: prisma: Permission denied
sh: 1: node_modules/.bin/prisma: Permission denied
```

**Ursache**: Docker-Container-Permissions oder fehlende Execute-Rechte auf Binaries.

**Lösung 1 - npm Script verwenden** (Zuverlässigste):
```javascript
// server/scripts/init-db.js
const { execSync } = require('child_process');

// ❌ FALSCH:
execSync('npx prisma db push', { cwd: __dirname + '/..' });
// oder
execSync('node_modules/.bin/prisma db push', { cwd: __dirname + '/..' });

// ✅ RICHTIG:
execSync('npm run db:push', { 
  stdio: 'inherit',
  cwd: __dirname + '/..'
});
```

```json
// server/package.json
{
  "scripts": {
    "db:push": "prisma db push --skip-generate --accept-data-loss"
  }
}
```

**Lösung 2 - Raw SQL verwenden** (Ultimative Fallback):

Wenn alle Prisma-CLI-Aufrufe fehlschlagen, verwende Raw SQL:

```javascript
// server/scripts/init-db.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTables() {
  // Tabelle für Tabelle einzeln erstellen!
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "User" (
      "id" SERIAL PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL,
      "name" TEXT
    )
  `);
  
  // NICHT alle Tabellen in einem Statement (PostgreSQL prepared statement limit)
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "Post" (
      "id" SERIAL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "userId" INTEGER NOT NULL,
      CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")
    )
  `);
}
```

⚠️ **Wichtig**: PostgreSQL prepared statements erlauben nur **einen** SQL-Befehl pro Aufruf!

---

### Problem 5: TypeScript Path Resolution - Cannot find module '/app/dist/app.js'

**Symptom** (Prisoner Services - KRITISCH):
```
Error: Cannot find module '/app/dist/app.js'
at Function._resolveFilename (node:internal/modules/cjs/loader:1383:15)
```

**Ursache**: TypeScript kompiliert nach `dist/src/` statt nach `dist/`, weil `tsconfig.json` die Source-Struktur beibehält.

**Falsch** ❌:
```json
// package.json
{
  "scripts": {
    "start": "npm run build && node dist/app.js"  // ❌ Pfad existiert nicht!
  }
}
```

**Richtig** ✅:
```json
// package.json
{
  "scripts": {
    "start": "npm run build && node dist/src/app.js"  // ✅ Korrekter Pfad
  }
}
```

**Noch besser** (mit Fehlerbehandlung):
```javascript
// backend/startup.js
const fs = require('fs');
const path = require('path');

// Prüfe ob app.js existiert
const appPath = path.join(__dirname, 'dist', 'src', 'app.js');
if (!fs.existsSync(appPath)) {
  console.log('❌ ERROR: dist/src/app.js not found!');
  console.log('🔧 Attempting rebuild...');
  execSync('npm run build', { stdio: 'inherit' });
}

console.log('✅ app.js found, starting server...');
```

**Best Practice**: Startup-Script mit Pfad-Validierung verwenden!

---

### Problem 6: Build vs Runtime - Datenbank nicht verfügbar

**Symptom**:
```
Error: P1001: Can't reach database server at `postgres.railway.internal:5432`
```
während der Build-Phase (`npm run build` oder `postbuild`).

**Ursache**: Die Datenbank ist nur zur **Runtime** verfügbar, nicht während des **Builds**.

**Falsch** ❌:
```json
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "postbuild": "cd server && npm run db:init"  // ❌ DB nicht verfügbar!
  }
}
```

**Richtig** ✅:

Datenbank-Initialisierung in ein Startup-Script verschieben:

```bash
# server/scripts/startup.sh
#!/bin/bash
echo "🚀 Railway Startup Script"

# 1. DB-Initialisierung (jetzt ist DB verfügbar)
cd /app/server && node scripts/init-db.js

# 2. Server starten
cd /app/server && node dist/index.js
```

```json
// package.json (root)
{
  "scripts": {
    "build": "npm run build:client && npm run build:server",
    "start": "bash server/scripts/startup.sh"
  }
}
```

**Railway-Ablauf**:
```
BUILD-PHASE (keine DB):
1. npm ci
2. npm run build
   
RUNTIME-PHASE (DB verfügbar):
3. npm start
   → startup.sh
   → DB-Initialisierung
   → Server starten
```

---

## 🗄️ Datenbank-Setup

### SQLite → PostgreSQL Migration (Prisoner Services Erfahrungen)

**Für Railway MUSS PostgreSQL verwendet werden** (SQLite funktioniert nicht persistent).

**Wichtige Erkenntnisse**:
- ✅ **Lokale PostgreSQL-Entwicklung** → Konsistenz mit Production
- ✅ **Überraschend einfach** → Keine Schema-Probleme bei Migration
- ✅ **Prisma handled alles** → Nur Provider ändern
- ✅ **Kein Datenverlust** → Seed-Scripts funktionieren identisch

**Prisma Schema ändern**:
```prisma
// ❌ Lokal (Development):
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// ✅ Production (Railway):
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Beide parallel nutzen**:

Lokal mit PostgreSQL entwickeln (empfohlen für Konsistenz):
```bash
# Docker (einfachste Variante):
docker run --name myapp-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=myapp_dev \
  -p 5432:5432 \
  -d postgres:15

# .env (lokal):
DATABASE_URL="postgresql://postgres:password@localhost:5432/myapp_dev"
```

Railway setzt `DATABASE_URL` automatisch, wenn PostgreSQL-Service hinzugefügt wird.

---

### Automatische Datenbank-Initialisierung (Prisoner Services Pattern)

**Pattern**: Startup-Script mit automatischem Seeding zur Runtime

**Unsere bewährte Implementierung**:

```javascript
// backend/startup.js
const { execSync } = require('child_process');

async function setupDatabase() {
  try {
    console.log('🏗️ Setting up database schema...');
    
    // 1. Schema anwenden (kein --force-reset!)
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database schema applied successfully');
    
    console.log('🌱 Seeding database...');
    
    // 2. Haupt-Seed-Daten
    execSync('npm run db:seed', { stdio: 'inherit' });
    console.log('✅ Main data seeded successfully');
    
    // 3. Zusätzliche Seed-Daten (mit Fehlerbehandlung!)
    try {
      execSync('npm run db:seed-houses', { stdio: 'inherit' });
      console.log('✅ Houses data seeded successfully');
    } catch (error) {
      console.log('⚠️ Houses seeding failed (may already exist):', error.message);
      // App trotzdem starten!
    }
    
    console.log('🚀 Starting application...');
  } catch (error) {
    console.log('⚠️ Setup failed:', error.message);
    // Bei kritischen Fehlern: process.exit(1)
  }
}

setupDatabase();
```

**Wichtige Prinzipien**:
- ✅ **Keine `prisma generate` in Runtime** → Wird schon bei `npm run build` ausgeführt
- ✅ **Fehlerbehandlung für optionale Seeds** → App startet trotzdem
- ✅ **`db push` statt Migrations** → Einfacher für Hobby-Projekte
- ✅ **Seed-Scripts prüfen auf Duplikate** → Idempotent

**Pattern für Seed-Scripts** (Prisoner Services):

```typescript
// backend/prisma/seed-houses.ts
async function main() {
  console.log('🌆 Erstelle Beispieldaten für Hausverwaltung...');
  
  // 1. WICHTIG: Alte Daten löschen (in richtiger Reihenfolge!)
  console.log('🗑️ Lösche alle bestehenden Hausverwaltungsdaten...');
  
  await prisma.cellAssignment.deleteMany({});  // Zuerst Foreign Keys
  await prisma.cell.deleteMany({});
  await prisma.station.deleteMany({});
  await prisma.house.deleteMany({});           // Zuletzt Parents
  
  // 2. Neue Daten erstellen
  // ...
}
```

**Kritische Erkenntnis**: 
- **`deleteMany({})` IMMER in korrekter Reihenfolge** → Sonst Foreign Key Errors!
- **Order**: Child-Tabellen zuerst, Parent-Tabellen zuletzt

---

### Alternative: Idempotentes Init-Script (ohne deleteMany)

**Pattern**: Idempotentes Init-Script, das beim Start läuft:

```javascript
// server/scripts/init-db.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function initDatabase() {
  console.log('🚀 Starting database initialization...');

  try {
    // 1. Prüfen ob Tabellen existieren
    const tableCheck = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'User'
      );
    `;
    
    if (tableCheck[0].exists) {
      console.log('ℹ️  Database already initialized');
      return;
    }

    // 2. Tabellen erstellen (einzeln!)
    await createTables();

    // 3. Seed-Daten
    await createDefaultAdmin();

    console.log('✅ Database initialization completed');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function createTables() {
  // JEDE Tabelle einzeln!
  await prisma.$executeRawUnsafe(`
    CREATE TABLE "User" (
      "id" SERIAL PRIMARY KEY,
      "email" TEXT UNIQUE NOT NULL
    )
  `);
  
  // Nächste Tabelle...
}

async function createDefaultAdmin() {
  const count = await prisma.user.count();
  if (count === 0) {
    await prisma.user.create({
      data: {
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10)
      }
    });
  }
}

// Nur ausführen wenn direkt aufgerufen
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
```

**Wichtige Prinzipien**:
- ✅ Idempotent (kann mehrfach ausgeführt werden)
- ✅ Prüft ob Daten schon existieren
- ✅ Jede Tabelle einzeln erstellen
- ✅ Fehlerbehandlung mit Process Exit
- ✅ Prisma Client disconnecten

---

## 🔐 Umgebungsvariablen

### Lokale Entwicklung (.env) - Prisoner Services

```env
# backend/.env (lokal - NICHT committen!)
DATABASE_URL="postgresql://postgres:password@localhost:5432/prisoner_services"
JWT_SECRET="mein-geheimer-schluessel-123"
OPENAI_API_KEY="sk-proj-..."
FRONTEND_URL="http://localhost:3000"
PORT=3001
NODE_ENV=development

# KI-Provider (Optional)
AI_PROVIDER="openai"  # oder "gemini" oder "claude"
AI_MAX_TOKENS="1000"  # Default-Wert für KI-Übersetzungen
```

```env
# frontend/.env (optional)
VITE_API_URL="http://localhost:3001/api"
```

### Railway Variables (Separate Services)

**Frontend Service** (Railway Dashboard → Variables):
```
VITE_API_URL=https://backend-production-xxxx.up.railway.app/api
```

**Backend Service** (Railway Dashboard → Variables):
```
NODE_ENV=production
JWT_SECRET=<starker-production-key>
DATABASE_URL=<automatisch gesetzt von PostgreSQL-Service>
FRONTEND_URL=https://frontend-production-xxxx.up.railway.app
OPENAI_API_KEY=sk-proj-...
AI_PROVIDER=openai
PORT=8080  # Railway-managed, nicht ändern!
```

**Wichtige Erkenntnisse**:
- ✅ **`VITE_API_URL` ist optional** → Fallback im Code definieren
- ✅ **Railway setzt `PORT` automatisch** → Nicht überschreiben!
- ✅ **`FRONTEND_URL` für CORS** → Backend muss Frontend-URL kennen
- ✅ **Default-Werte im Code** → App funktioniert auch ohne alle Vars

---

### Frontend API-Konfiguration (Prisoner Services Pattern)

**Problem**: Frontend muss Backend-URL kennen, die sich je nach Umgebung ändert.

**Lösung**: Konfigurierbare API-URL mit Fallback

```typescript
// frontend/src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://backend-production-xxxx.up.railway.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
});

export default api;
```

**Vite Type Declaration** (wichtig!):
```typescript
// frontend/src/vite-env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Verwendung in Components**:
```typescript
// ❌ FALSCH:
const response = await fetch('/api/services');

// ✅ RICHTIG:
import api from '../services/api';
const response = await api.get('/services');
const data = response.data;
```

**Lokale Entwicklung** (Vite Proxy - optional):
```typescript
// frontend/vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

**Best Practice**: 
- Axios-Client für **alle** API-Calls verwenden
- **Nie** direktes `fetch()` in Production!

**JWT_SECRET generieren**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Cross-Platform Umgebungsvariablen

**Problem**: Windows CMD vs. PowerShell vs. Unix haben unterschiedliche Syntax.

**Lösung**: `cross-env` Package

```bash
npm install --save-dev cross-env
```

```json
{
  "scripts": {
    "start:prod": "cross-env NODE_ENV=production npm start"
  }
}
```

---

## 🔄 Production vs Development Modi

### Server-Code

```typescript
// server/src/index.ts
const isDevelopment = process.env.NODE_ENV !== 'production';

if (!isDevelopment) {
  // Production: Serviere React Build
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

console.log(`Modus: ${isDevelopment ? 'Development' : 'Production'}`);
```

### Scripts-Struktur

```json
// package.json (root)
{
  "scripts": {
    "dev": "concurrently \"npm run server:dev\" \"npm run client:dev\"",
    "server:dev": "cd server && npm run dev",
    "client:dev": "cd client && npm run dev",
    
    "build": "npm run build:client && npm run build:server",
    "build:client": "cd client && npm run build",
    "build:server": "cd server && npx prisma generate && npm run build",
    
    "start": "bash server/scripts/startup.sh",
    "start:prod": "cross-env NODE_ENV=production npm start"
  }
}
```

**Development** (lokal):
```bash
npm run dev
# → 2 Prozesse
# → Frontend: localhost:3000 (Vite Dev Server mit HMR)
# → Backend: localhost:3001 (nodemon)
```

**Production** (Railway oder lokal testen):
```bash
npm run build
npm run start:prod
# → 1 Prozess
# → Alles auf localhost:3001
# → Express serviert statische React-Files
```

---

## ⚙️ Railway-spezifische Konfiguration

### Separate Services (Prisoner Services Approach)

**Railway UI Settings** (KEINE railway.json benötigt!):

**Frontend Service:**
- **Root Directory:** `/frontend`
- **Build Command:** (automatisch erkannt von Nixpacks)
- **Start Command:** (automatisch - Caddy)
- **Environment Variables:** `VITE_API_URL`

**Backend Service:**
- **Root Directory:** `/backend`
- **Build Command:** (automatisch - `npm run build`)
- **Start Command:** `npm run start`
- **Environment Variables:** Siehe oben

**Wichtige Erkenntnisse**:
- ✅ **Root Directory reicht** → Keine railway.json notwendig
- ✅ **Nixpacks erkennt automatisch** → Build-Command, Start-Command
- ✅ **Weniger Konfiguration** → Weniger Fehlerquellen
- ✅ **Einfacher zu warten** → Nur package.json anpassen

**package.json Backend** (Prisoner Services):
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/app.ts",
    "build": "tsc",
    "start": "npm run build && node startup.js && node dist/src/app.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:seed": "ts-node prisma/seed.ts",
    "db:seed-houses": "ts-node prisma/seed-houses.ts"
  }
}
```

**tsconfig.json Backend** (WICHTIG für Pfade):
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./",  // NICHT nur "./src"!
  },
  "include": ["src/**/*", "prisma/**/*"],  // Prisma-Scripts inkludieren!
  "exclude": ["node_modules", "dist"]
}
```

---

### Alternative: Minimale railway.json (Monolith)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "cd server && npm ci && cd ../client && npm ci && cd .. && npm run build"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

**Wichtig**: 
- ✅ Explizite Subdirectory-Installation
- ✅ Einfache Restart-Policy
- ❌ Keine `restartPolicyType` (veraltetes Format)

---

### .gitignore für Railway

```gitignore
# Dependencies
node_modules/
*/node_modules/

# Build outputs
client/dist/
client/build/
server/dist/

# Environment
.env
*.env
!*.env.example

# Database (nur lokal)
server/prisma/dev.db
*.db
*.db-journal

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# Railway
.railway/
```

---

## ✅ Deployment-Checkliste

### Pre-Deployment (Separate Services)

- [ ] **Lokalen Backend-Build testen**
  ```bash
  cd backend
  npm run build
  # Prüfe ob dist/src/app.js existiert!
  ```

- [ ] **Lokalen Frontend-Build testen**
  ```bash
  cd frontend
  npm run build
  # Prüfe ob dist/ existiert!
  ```

- [ ] **PostgreSQL Schema validieren**
  ```bash
  cd backend
  npx prisma validate
  ```

- [ ] **API-Client prüfen**
  - `api.get()` statt `fetch()` überall?
  - `import api from '../services/api'` in allen Components?
  - `vite-env.d.ts` vorhanden?

- [ ] **TypeScript Config prüfen**
  - `tsconfig.json` → `"include": ["src/**/*", "prisma/**/*"]`?
  - Compile-Output-Pfad korrekt? (`dist/src/` beachten!)

- [ ] **Seed-Scripts prüfen**
  - `deleteMany({})` in korrekter Reihenfolge?
  - Foreign Keys beachtet?
  - Error-Handling vorhanden?

- [ ] **Startup-Script vorhanden?**
  - `backend/startup.js` existiert?
  - Fehlerbehandlung für optionale Seeds?
  - Pfad-Validierung für `app.js`?

- [ ] **CORS-Konfiguration vorbereitet**
  - Railway Frontend-URL bekannt?
  - Backend akzeptiert öffentliche URLs?

### Railway Setup (Separate Services)

- [ ] **GitHub Repository verbunden**
- [ ] **3 Services erstellt**:
  - Frontend Service (Root: `/frontend`)
  - Backend Service (Root: `/backend`)
  - PostgreSQL Database
- [ ] **Frontend Environment Variables gesetzt**:
  - `VITE_API_URL` (optional, aber empfohlen)
- [ ] **Backend Environment Variables gesetzt**:
  - `NODE_ENV=production`
  - `JWT_SECRET=<secure-key>`
  - `FRONTEND_URL=<railway-frontend-url>`
  - `DATABASE_URL` (automatisch)
  - `OPENAI_API_KEY` (wenn benötigt)
  - `AI_PROVIDER` (wenn benötigt)

### Nach Deployment

- [ ] **Logs prüfen**:
  - "Database initialization completed" ✅
  - "Server läuft auf Port..." ✅
  - Keine Fehler ❌

- [ ] **Domain generieren** (Settings → Domains → Generate Domain)
- [ ] **Anwendung testen**:
  - Login funktioniert?
  - Datenbank-Operationen funktionieren?
  - Frontend lädt korrekt?

- [ ] **Datenbank verifizieren**:
  - Railway Dashboard → PostgreSQL → Data
  - Tabellen existieren?
  - Seed-Daten vorhanden?

- [ ] **Sicherheit**:
  - Default-Passwörter geändert?
  - JWT_SECRET stark gewählt?

---

## 🔍 Troubleshooting-Patterns

### Error-Pattern: CORS Policy Errors (Prisoner Services)

**Symptom**:
```
Access to XMLHttpRequest... has been blocked by CORS policy:
The 'Access-Control-Allow-Origin' header contains the invalid value 'frontend.railway.internal'
```

**Ursache**: Railway interne Domain (`frontend.railway.internal`) funktioniert nicht für Browser-CORS.

**Falsch** ❌:
```typescript
// backend/src/app.ts
app.use(cors({
  origin: [
    'http://localhost:3000',
    'frontend.railway.internal'  // ❌ Browser kennt diese URL nicht!
  ]
}));
```

**Richtig** ✅:
```typescript
app.use(cors({
  origin: [
    'http://localhost:3000',                              // Lokal
    'https://frontend-production-xxxx.up.railway.app',   // Production (öffentliche URL!)
    'frontend.railway.internal'                           // Für Backend-zu-Frontend Calls (optional)
  ],
  credentials: true
}));
```

**Best Practice**: Immer **öffentliche Railway-URL** für CORS verwenden!

---

### Error-Pattern: Frontend API Calls - "Unexpected token '<'"

**Symptom** (Prisoner Services - häufig!):
```
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

**Ursache**: Frontend verwendet `fetch()` statt konfiguriertem Axios-Client → ruft falsche URL auf → erhält HTML statt JSON.

**Falsch** ❌:
```typescript
// InmatesOverview.tsx
const response = await fetch('/api/inmates');  // ❌ Relative URL!
const data = await response.json();
```

**Richtig** ✅:
```typescript
import api from '../services/api';

const response = await api.get('/inmates');  // ✅ Axios mit BASE_URL
const data = response.data;
```

**Best Practice**: 
- ✅ **IMMER** konfiguriertes `api` verwenden
- ❌ **NIEMALS** direktes `fetch()` in Components
- ✅ `api.get()`, `api.post()`, `api.put()`, `api.delete()`

---

### Error-Pattern: "Module not found"

**Mögliche Ursachen**:
1. Dependencies nicht in `package.json`
2. Subdirectory-Dependencies nicht installiert
3. Dev-Dependency statt Production-Dependency

**Debugging**:
```bash
# Lokal testen:
rm -rf node_modules
npm ci --production
npm run build
```

**Fix**: Prüfe `dependencies` vs `devDependencies` in `package.json`.

---

### Error-Pattern: "Command not found" / "Permission denied"

**Ursache**: Binary nicht gefunden oder keine Execute-Rechte.

**Lösungsansätze** (in dieser Reihenfolge probieren):
1. npm-Script verwenden statt direktem Binary-Aufruf
2. `npx` verwenden
3. Expliziter Pfad: `./node_modules/.bin/binary`
4. Fallback auf programmatische Lösung (z.B. Raw SQL statt Prisma CLI)

---

### Error-Pattern: "Can't reach database"

**Frage 1**: Wann tritt der Fehler auf?

**Während Build** → Datenbank-Zugriff in Runtime verschieben (startup.sh)

**Während Runtime** → Prüfe:
- PostgreSQL-Service läuft?
- `DATABASE_URL` korrekt gesetzt?
- Netzwerk-Verbindung erlaubt?

**Debugging**:
```javascript
// Im Code temporär hinzufügen:
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
```

---

### Error-Pattern: Prisma Unique Constraint Failed (Seed-Scripts)

**Symptom** (Prisoner Services):
```
PrismaClientKnownRequestError: Unique constraint failed on the fields: (name)
```

**Ursache**: Seed-Script versucht Daten zu erstellen, die bereits existieren.

**Falsch** ❌:
```typescript
// seed-houses.ts
await prisma.house.create({ data: { name: "Haus A" } });  // ❌ Fehlt wenn schon existiert!
```

**Richtig** ✅:
```typescript
// seed-houses.ts
async function main() {
  // 1. Alte Daten löschen (in richtiger Reihenfolge!)
  await prisma.cellAssignment.deleteMany({});  // Child zuerst
  await prisma.cell.deleteMany({});
  await prisma.station.deleteMany({});
  await prisma.house.deleteMany({});           // Parent zuletzt
  
  // 2. Neue Daten erstellen
  await prisma.house.create({ data: { name: "Haus A" } });
}
```

**Best Practice**: **Immer `deleteMany({})` vor Create** → Idempotent

---

### Error-Pattern: "Frontend lädt nicht" / "404" (Monolith)

**Checkliste**:
1. `NODE_ENV=production` gesetzt?
2. `client/dist` existiert nach Build?
3. Statisches File-Serving nur in Production-Modus?
4. API-Routes vor Catch-all Route?

**Korrektes Pattern**:
```typescript
// API-Routes ZUERST
app.use('/api/auth', authRoutes);

// Statische Files
if (!isDevelopment) {
  app.use(express.static(clientBuildPath));
  
  // Catch-all Route ZULETZT
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}
```

**Hinweis**: Bei **Separate Services** (Prisoner Services) entfällt dies!

---

## 📝 Schema-Änderungen in Production

**Problem**: Prisma-Schema ändern ohne Daten zu verlieren.

**Workflow**:

1. **Lokal ändern und testen**:
   ```bash
   cd server
   npx prisma db push
   npx prisma generate
   # Testen!
   ```

2. **Committen und pushen**:
   ```bash
   git add server/prisma/schema.prisma
   git commit -m "Add new field to User model"
   git push origin main
   ```

3. **Nach Deployment: Railway Terminal öffnen**:
   ```bash
   cd server
   npx prisma db push --accept-data-loss
   ```

⚠️ **Wichtig**: 
- Schema-Änderungen werden **NICHT automatisch** angewendet!
- `init-db.js` prüft nur ob Tabellen existieren, nicht ob Schema aktuell ist
- Für automatische Migrations: Prisma Migrate verwenden (komplexer)

---

## 🎯 Best Practices - Zusammenfassung

### ✅ DO (Prisoner Services Erkenntnisse)

1. **Monolith ODER Separate Services** → Beide funktionieren gut
2. **PostgreSQL lokal** nutzen (gleiche DB wie Production)
3. **Root Directory in Railway** setzen (Frontend/Backend getrennt)
4. **Datenbank-Init zur Runtime**, nicht beim Build
5. **Startup-Script mit Fehlerbehandlung** → App startet trotzdem
6. **`deleteMany({})` in Seed-Scripts** → Idempotent
7. **Axios-Client konfigurieren** → Nie direktes `fetch()`
8. **CORS mit öffentlichen URLs** → Railway interne URLs funktionieren nicht
9. **TypeScript `include` für Prisma** → `["src/**/*", "prisma/**/*"]`
10. **Default-Werte im Code** → `process.env.VAR || 'default'`
11. **Logs überwachen** beim ersten Deployment
12. **tsconfig.json Pfade prüfen** → `dist/src/app.js` vs `dist/app.js`
13. **Type-Assertions für externe SDKs** → `(data as any)?.property`
14. **Foreign Key Reihenfolge beachten** → Children zuerst löschen
15. **`prisma generate` nur im Build** → Nicht in Runtime

### ❌ DON'T (Prisoner Services Fehler)

1. **Keine SQLite in Production** (nicht persistent)
2. **Keine DB-Zugriffe im Build-Prozess** (postbuild)
3. **Keine hardcoded Secrets** (JWT_SECRET in Code)
4. **Keine `railway.internal` für CORS** (Browser kennt es nicht)
5. **Kein direktes `fetch()`** → Immer Axios-Client verwenden
6. **Keine falsche TypeScript-Pfade** → `dist/src/app.js` beachten
7. **Keine Seed-Scripts ohne `deleteMany()`** → Unique Constraints
8. **Keine `prisma generate` in Runtime** → Verschwendet Zeit
9. **Kein `PORT` in Railway überschreiben** → Railway managed automatisch
10. **Keine API-Routes nach Catch-all-Route** (Monolith)
11. **Kein force-reset in Production** ohne Backup
12. **Keine Missing Imports** → `api` in Components importieren
13. **Keine falschen Foreign Key Lösch-Reihenfolge** → Parents zuletzt
14. **Keine ungetesteten Production-Builds** → Lokal testen!

---

## 🔄 Updates & Maintenance

### Code-Updates (sicher)

```bash
git add .
git commit -m "Update feature"
git push origin main
# → Railway deployed automatisch
# → Daten bleiben erhalten ✅
```

### Schema-Updates (manuell)

1. Lokal testen
2. Committen und pushen
3. Railway Terminal: `npx prisma db push`

### Datenbank Reset (DESTRUKTIV)

```bash
# In Railway Terminal:
cd server
npx prisma db push --force-reset  # ⚠️ LÖSCHT ALLES
npm run db:init                    # Seed-Daten wiederherstellen
```

---

## 🆘 Wenn alles fehlschlägt

### Debugging-Strategie

1. **Lokal im Production-Modus testen**:
   ```bash
   npm run build
   npm run start:prod
   ```

2. **Railway Logs analysieren**:
   - Build Logs: Wo schlägt der Build fehl?
   - Deploy Logs: Startet der Server?
   - Application Logs: Runtime-Fehler?

3. **Railway Terminal nutzen**:
   - Manuell Befehle ausführen
   - Dateistruktur prüfen
   - Environment-Variablen prüfen

4. **Schritt für Schritt isolieren**:
   - Funktioniert Build ohne Frontend?
   - Funktioniert Backend ohne DB-Init?
   - Funktioniert DB-Init separat?

5. **Fallback-Strategien**:
   - Prisma CLI → npm Scripts
   - npm Scripts → Raw SQL
   - Komplexe Builds → Einfachere Struktur

---

## 📚 Weiterführende Ressourcen

- **Railway Docs**: https://docs.railway.app/
- **Nixpacks**: https://nixpacks.com/ (Railway's Build-System)
- **Prisma Docs**: https://www.prisma.io/docs/
- **Express Production Best Practices**: https://expressjs.com/en/advanced/best-practice-performance.html

---

## 🚀 Git Branching für Railway Deployments (Prisoner Services)

### Problem: Automatisches Re-Deployment bei jedem Push

**Herausforderung**: Railway deployed automatisch bei jedem Push zu `main` → ungewollt für kleine Änderungen.

**Lösung**: Branch-basierter Workflow

```bash
# 1. Feature-Branch erstellen
git checkout -b feature/new-feature

# 2. Änderungen committen
git add .
git commit -m "Add new feature"

# 3. Zu lokalem main pushen (KEIN Remote-Push!)
git checkout main
git merge feature/new-feature

# 4. Lokal testen
npm run dev  # Frontend + Backend

# 5. Erst wenn alles funktioniert → Production Push
git push origin main  # → Railway deployed automatisch
```

**Alternative**: Railway-Branch in Settings ändern

```
Railway Dashboard → Service Settings → Branch
→ Von "main" zu "production" ändern
```

Dann:
- `main` → Lokale Entwicklung
- `production` → Railway Deployment

```bash
git checkout main
# ... entwickeln und testen ...

# Wenn ready für Production:
git checkout production
git merge main
git push origin production  # → Railway deployed
```

**Best Practice**: Production-Branch nur für getestete Änderungen!

---

## ✍️ Für zukünftige AI-Assistenten

Wenn du diese Datei in einem neuen Projekt siehst:

1. **Prüfe die Projekt-Struktur**:
   - Monorepo (client/ + server/) oder separates Frontend/Backend?
   - Welche Datenbank wird lokal verwendet?
   - Welche Build-Tools? (Vite, Webpack, etc.)

2. **Folge dieser Anleitung systematisch**:
   - Beginne mit Monolith ODER Separate Services (beide funktionieren!)
   - Dann Root Directory in Railway Settings
   - Dann DB-Initialisierung mit Startup-Script
   - Zuletzt Production-Modus lokal testen

3. **Bei Fehlern**: Nutze die Troubleshooting-Patterns als Checkliste
   - CORS Errors → Öffentliche URLs
   - "Unexpected token '<'" → Axios statt fetch()
   - "Cannot find module" → TypeScript Pfade prüfen
   - Unique Constraints → deleteMany() hinzufügen

4. **Dokumentiere neue Erkenntnisse**: Ergänze diese Datei wenn neue Probleme auftreten!

---

## 📚 Projekt-spezifische Erfahrungen

### Prisoner Services (Fullstack React + Express + PostgreSQL)
- ✅ **Separate Services** → 3 Railway-Services (Frontend, Backend, DB)
- ✅ **Startup-Script** → Automatisches DB-Seeding
- ✅ **Axios-Client** → Konfigurierbare API-URL
- ✅ **CORS mit öffentlichen URLs** → Funktioniert perfekt
- ✅ **PostgreSQL lokal** → Konsistenz mit Production
- ✅ **TypeScript Paths** → `dist/src/app.js` beachten
- ⚠️ **Häufiger Fehler**: `fetch()` statt `api.get()` → JSON-Parsing-Error
- ⚠️ **Häufiger Fehler**: Railway interne URLs in CORS → Browser-Error

### Hayrose (Persönlichkeitstest)
- ✅ **Monolith-Setup** → Einfacher für kleine Projekte
- ✅ **PostCSS CommonJS** → ES6 funktioniert nicht
- ✅ **Raw SQL Fallback** → Bei Prisma CLI Problemen
- ⚠️ **Häufiger Fehler**: DB-Zugriff während Build → Verschieben zu Runtime

---

**Version**: 2.0  
**Letzte Aktualisierung**: 2025-10-12  
**Projekte**: 
  - hayrose (Persönlichkeitstest - Monolith)
  - Prisoner Services (Fullstack - Separate Services)  
**Status**: Produktiv getestet ✅ (beide Architekturen)

