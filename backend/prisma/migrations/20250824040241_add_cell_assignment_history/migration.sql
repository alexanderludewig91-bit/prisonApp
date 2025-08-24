-- CreateTable
CREATE TABLE "cell_assignment_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cellId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedBy" INTEGER,
    CONSTRAINT "cell_assignment_history_cellId_fkey" FOREIGN KEY ("cellId") REFERENCES "cells" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cell_assignment_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cell_assignment_history_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
