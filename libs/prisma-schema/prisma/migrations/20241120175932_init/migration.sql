/*
  Warnings:

  - Added the required column `discount` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product"
    ADD COLUMN "discount"   DOUBLE PRECISION NOT NULL,
    ADD COLUMN "topProduct" BOOLEAN          NOT NULL DEFAULT false;
