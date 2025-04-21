/*
  Warnings:

  - You are about to drop the column `token` on the `UserSession` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSession"
    DROP COLUMN "token";
