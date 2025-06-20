/*
  Warnings:

  - You are about to drop the column `warehouse` on the `Order` table. All the data in the column will be lost.
  - Added the required column `warehouseAddress` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wharehoseNumber` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "warehouse",
ADD COLUMN     "warehouseAddress" TEXT NOT NULL,
ADD COLUMN     "wharehoseNumber" TEXT NOT NULL;
