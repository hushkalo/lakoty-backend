/*
  Warnings:

  - Added the required column `keyCrmOrderId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "keyCrmOrderId" INTEGER NOT NULL;
