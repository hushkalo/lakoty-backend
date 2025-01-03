/*
  Warnings:

  - You are about to drop the column `KeyCrmId` on the `Product` table. All the data in the column will be lost.
  - Added the required column `keyCrmId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product"
    DROP COLUMN "KeyCrmId",
    ADD COLUMN "keyCrmId" INTEGER NOT NULL;
