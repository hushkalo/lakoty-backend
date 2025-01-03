/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `UserSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "imageUrl" TEXT;

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "imageUrl";
