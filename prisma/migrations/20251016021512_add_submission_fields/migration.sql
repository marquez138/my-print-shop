-- AlterTable
ALTER TABLE "Design" ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "submittedSnapshot" JSONB;
