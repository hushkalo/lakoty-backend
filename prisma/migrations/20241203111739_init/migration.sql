/*
  Warnings:

  - Added the required column `keyCrmId` to the `ProductSize` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProductSize"
    ADD COLUMN "keyCrmId" INTEGER NOT NULL,
    ALTER COLUMN "sku" DROP NOT NULL;
