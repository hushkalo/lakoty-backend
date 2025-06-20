/*
  Warnings:

  - You are about to drop the column `wharehoseNumber` on the `Order` table. All the data in the column will be lost.
  - Added the required column `warehouseNumber` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseType` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "wharehoseNumber",
ADD COLUMN     "warehouseNumber" TEXT NOT NULL,
ADD COLUMN     "warehouseType" TEXT NOT NULL;
