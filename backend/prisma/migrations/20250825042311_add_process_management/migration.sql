-- CreateTable
CREATE TABLE "process_definitions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "process_steps" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "processId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "statusName" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isDecision" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "process_steps_processId_fkey" FOREIGN KEY ("processId") REFERENCES "process_definitions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "process_step_assignments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stepId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "process_step_assignments_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "process_steps" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "process_step_assignments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_services" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "number" REAL,
    "folderId" INTEGER,
    "assignedTo" INTEGER,
    "antragstyp" TEXT,
    "processId" INTEGER,
    "createdBy" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "services_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "services_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "services_processId_fkey" FOREIGN KEY ("processId") REFERENCES "process_definitions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_services" ("assignedTo", "createdAt", "createdBy", "description", "folderId", "id", "number", "priority", "status", "title", "updatedAt") SELECT "assignedTo", "createdAt", "createdBy", "description", "folderId", "id", "number", "priority", "status", "title", "updatedAt" FROM "services";
DROP TABLE "services";
ALTER TABLE "new_services" RENAME TO "services";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "process_definitions_name_key" ON "process_definitions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "process_step_assignments_stepId_groupId_key" ON "process_step_assignments"("stepId", "groupId");
