/*
  Warnings:

  - A unique constraint covering the columns `[keyCrmOrderId]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Order_keyCrmOrderId_key" ON "Order"("keyCrmOrderId");
