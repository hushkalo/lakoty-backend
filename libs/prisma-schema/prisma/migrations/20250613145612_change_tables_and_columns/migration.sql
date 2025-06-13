/*
  Warnings:

  - You are about to drop the column `city` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cityArea` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `cityRef` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `messenger` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `statusId` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseAddress` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseNumber` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseRef` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `warehouseType` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the `OrderStatus` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `status` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Order" DROP CONSTRAINT "Order_statusId_fkey";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "city",
DROP COLUMN "cityArea",
DROP COLUMN "cityRef",
DROP COLUMN "messenger",
DROP COLUMN "statusId",
DROP COLUMN "warehouseAddress",
DROP COLUMN "warehouseNumber",
DROP COLUMN "warehouseRef",
DROP COLUMN "warehouseType",
ADD COLUMN     "status" TEXT NOT NULL;

-- DropTable
DROP TABLE "OrderStatus";
