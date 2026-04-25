-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_secondCategoryId_fkey" FOREIGN KEY ("secondCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
