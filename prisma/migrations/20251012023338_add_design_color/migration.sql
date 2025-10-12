-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "color" TEXT;

-- CreateIndex
CREATE INDEX "Design_productId_color_idx" ON "Design"("productId", "color");

-- CreateIndex
CREATE INDEX "Design_status_idx" ON "Design"("status");
