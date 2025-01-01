/*
  Warnings:

  - The primary key for the `ProductSize` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sizeId` on the `ProductSize` table. All the data in the column will be lost.
  - You are about to drop the `Size` table. If the table is not empty, all the data it contains will be lost.
  - The required column `id` was added to the `ProductSize` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `size` to the `ProductSize` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sku` to the `ProductSize` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProductSize" DROP CONSTRAINT "ProductSize_sizeId_fkey";

-- AlterTable
ALTER TABLE "ProductSize" DROP CONSTRAINT "ProductSize_pkey",
DROP COLUMN "sizeId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "isAvailable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "size" TEXT NOT NULL,
ADD COLUMN     "sku" TEXT NOT NULL,
ADD CONSTRAINT "ProductSize_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Size";
