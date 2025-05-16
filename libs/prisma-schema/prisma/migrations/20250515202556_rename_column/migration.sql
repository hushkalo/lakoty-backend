/*
  Warnings:

  - You are about to drop the column `topProduct` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "topProduct",
ADD COLUMN     "top" BOOLEAN NOT NULL DEFAULT false;
