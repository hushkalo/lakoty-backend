/*
  Warnings:

  - You are about to drop the `ProductColor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProductColor" DROP CONSTRAINT "ProductColor_colorId_fkey";

-- DropForeignKey
ALTER TABLE "ProductColor" DROP CONSTRAINT "ProductColor_productId_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "colorId" TEXT;

-- DropTable
DROP TABLE "ProductColor";

-- CreateIndex
CREATE INDEX "Product_colorId_idx" ON "Product"("colorId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "Color"("id") ON DELETE SET NULL ON UPDATE CASCADE;
