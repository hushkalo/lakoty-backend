/*
  Warnings:

  - Added the required column `KeyCrmId` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "KeyCrmId" INTEGER NOT NULL;
