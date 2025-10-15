-- CreateTable
CREATE TABLE "DesignLineItem" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "variantSku" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 0,
    "unitPrice" INTEGER NOT NULL,
    "surcharge" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DesignLineItem_designId_size_key" ON "DesignLineItem"("designId", "size");

-- AddForeignKey
ALTER TABLE "DesignLineItem" ADD CONSTRAINT "DesignLineItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;
