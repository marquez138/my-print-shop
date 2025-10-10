-- CreateTable
CREATE TABLE "DesignComment" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignComment_designId_createdAt_idx" ON "DesignComment"("designId", "createdAt");

-- AddForeignKey
ALTER TABLE "DesignComment" ADD CONSTRAINT "DesignComment_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;
