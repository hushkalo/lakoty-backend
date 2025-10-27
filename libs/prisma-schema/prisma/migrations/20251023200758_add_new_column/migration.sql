-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "additionalKeyCrmIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
