/*
  Warnings:

  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phoneNumber` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User"
    ADD COLUMN "firstName"   TEXT NOT NULL,
    ADD COLUMN "lastName"    TEXT NOT NULL,
    ADD COLUMN "phoneNumber" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "UserSession"
    ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
