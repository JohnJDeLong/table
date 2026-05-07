-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('streaming', 'complete', 'cancelled', 'failed');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "status" "MessageStatus" NOT NULL DEFAULT 'complete',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Message_status_idx" ON "Message"("status");
