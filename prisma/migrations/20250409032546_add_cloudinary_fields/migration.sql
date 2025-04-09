/*
  Warnings:

  - You are about to drop the column `storagePath` on the `File` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "storagePath",
ADD COLUMN     "cloudinaryPublicId" TEXT,
ADD COLUMN     "resourceType" TEXT,
ADD COLUMN     "url" TEXT;
