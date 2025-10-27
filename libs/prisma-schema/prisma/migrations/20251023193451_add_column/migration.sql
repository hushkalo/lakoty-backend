/*
  Warnings:

  - Added the required column `deliveryServiceId` to the `Partners` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Partners" ADD COLUMN     "deliveryServiceId" INTEGER NOT NULL;
