/*
  Warnings:

  - A unique constraint covering the columns `[alternative_link]` on the table `Category` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[alternative_link]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `alternative_link` to the `Category` table without a default value. This is not possible if the table is not empty.
  - Made the column `alternative_link` on table `Product` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Category"
    ADD COLUMN "alternative_link" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product"
    ALTER COLUMN "alternative_link" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Category_alternative_link_key" ON "Category" ("alternative_link");

-- CreateIndex
CREATE UNIQUE INDEX "Product_alternative_link_key" ON "Product" ("alternative_link");
