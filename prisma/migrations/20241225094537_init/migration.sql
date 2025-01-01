-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "keyCrmId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "keyCrmId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "ProductSize" ALTER COLUMN "keyCrmId" DROP NOT NULL;
