/*
  Warnings:

  - You are about to drop the column `alternative_link` on the `Category` table. All the data in the column will be lost.
  - You are about to drop the column `alternative_link` on the `Product` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[alternativeLink]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alternativeLink]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alternativeLink` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `alternativeLink` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Category_alternative_link_key";

-- DropIndex
DROP INDEX "Product_alternative_link_key";

-- AlterTable
ALTER TABLE "Category"
    DROP COLUMN "alternative_link",
    ADD COLUMN "alternativeLink" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product"
    DROP COLUMN "alternative_link",
    ADD COLUMN "alternativeLink" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_alternativeLink_key" ON "Category" ("alternativeLink");

-- CreateIndex
CREATE UNIQUE INDEX "Product_alternativeLink_key" ON "Product" ("alternativeLink");
