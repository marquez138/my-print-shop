-- CreateEnum
CREATE TYPE "PrintSide" AS ENUM ('front', 'back', 'sleeve');

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "productId" TEXT NOT NULL,
    "variantSku" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pricingBase" INTEGER NOT NULL,
    "pricingFees" INTEGER NOT NULL,
    "pricingTotal" INTEGER NOT NULL,
    "previewFront" TEXT,
    "previewBack" TEXT,
    "previewLeft" TEXT,
    "previewRight" TEXT,
    "printSpec" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignPlacement" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "side" "PrintSide" NOT NULL,
    "areaId" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "scale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "rotation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "widthPx" INTEGER NOT NULL,
    "heightPx" INTEGER NOT NULL,
    "dpi" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignPlacement_designId_side_key" ON "DesignPlacement"("designId", "side");

-- AddForeignKey
ALTER TABLE "DesignPlacement" ADD CONSTRAINT "DesignPlacement_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;
