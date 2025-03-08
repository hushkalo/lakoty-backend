-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "statusId" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "OrderStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
