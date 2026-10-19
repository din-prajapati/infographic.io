-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "externalRefundId" TEXT,
ADD COLUMN     "refundedAmount" INTEGER,
ADD COLUMN     "refundedAt" TIMESTAMP(3);
