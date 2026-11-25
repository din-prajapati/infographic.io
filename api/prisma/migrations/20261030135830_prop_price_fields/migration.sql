-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "currency" TEXT DEFAULT 'INR',
ADD COLUMN     "rentalPeriod" TEXT,
ADD COLUMN     "transaction" TEXT;
