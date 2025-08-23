-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cell_assignments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER,
    "notes" TEXT,
    "cellId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "cell_assignments_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "cells" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cell_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cell_assignments_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_cell_assignments" ("assignedAt", "assignedBy", "cellId", "id", "isActive", "notes", "userId") SELECT "assignedAt", "assignedBy", "cellId", "id", "isActive", "notes", "userId" FROM "cell_assignments";
DROP TABLE "cell_assignments";
ALTER TABLE "new_cell_assignments" RENAME TO "cell_assignments";
CREATE UNIQUE INDEX "cell_assignments_cellId_userId_isActive_key" ON "cell_assignments"("cellId", "userId", "isActive");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
