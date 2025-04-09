/*
  Warnings:

  - You are about to drop the column `salt` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" ALTER COLUMN "storagePath" DROP NOT NULL,
ALTER COLUMN "size" DROP NOT NULL,
ALTER COLUMN "mimeType" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "salt";

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX "File_parentId_idx" ON "File"("parentId");

-- CreateIndex
CREATE INDEX "File_userId_parentId_idx" ON "File"("userId", "parentId");
