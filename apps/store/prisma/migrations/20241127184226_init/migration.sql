/*
  Warnings:

  - You are about to drop the column `alternativeLink` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `alternativeLink` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[alias]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alias]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alias` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alias` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Category_alternativeLink_key";

-- DropIndex
DROP INDEX "Product_alternativeLink_key";

-- AlterTable
ALTER TABLE "Category" DROP COLUMN "alternativeLink",
ADD COLUMN     "alias" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "alternativeLink",
ADD COLUMN     "alias" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_alias_key" ON "Category"("alias");

-- CreateIndex
CREATE UNIQUE INDEX "Product_alias_key" ON "Product"("alias");
