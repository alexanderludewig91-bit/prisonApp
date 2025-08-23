/*
  Warnings:

  - A unique constraint covering the columns `[cellId,userId]` on the table `cell_assignments` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "cell_assignments_cellId_userId_isActive_key";

-- CreateIndex
CREATE UNIQUE INDEX "cell_assignments_cellId_userId_key" ON "cell_assignments"("cellId", "userId");
