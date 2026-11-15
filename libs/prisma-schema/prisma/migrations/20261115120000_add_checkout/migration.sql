-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "prepaidAmount" INTEGER;

-- CreateTable
CREATE TABLE "Checkout" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT,
    "paymentType" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "prepaidAmount" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "invoiceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "orderId" TEXT,
    "crmOrderIds" JSONB,
    "errorMessage" TEXT,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Checkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_invoiceId_key" ON "Checkout"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Checkout_orderId_key" ON "Checkout"("orderId");

-- CreateIndex
CREATE INDEX "Checkout_status_idx" ON "Checkout"("status");
