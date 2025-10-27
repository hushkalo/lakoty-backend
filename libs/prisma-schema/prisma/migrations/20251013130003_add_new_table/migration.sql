-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "partnersId" TEXT;

-- CreateTable
CREATE TABLE "Brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partners" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "managerId" INTEGER NOT NULL,
    "sourceId" INTEGER NOT NULL,
    "postPayId" INTEGER NOT NULL,
    "prePayId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Brands_name_key" ON "Brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Partners_name_key" ON "Partners"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Partners_apiKey_key" ON "Partners"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Partners_apiUrl_key" ON "Partners"("apiUrl");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_partnersId_fkey" FOREIGN KEY ("partnersId") REFERENCES "Partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
