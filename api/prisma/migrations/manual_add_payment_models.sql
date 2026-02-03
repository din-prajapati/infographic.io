-- Manual migration: Add payment models
-- Run this SQL directly against your PostgreSQL database if Prisma CLI is having issues

-- Create enums
CREATE TYPE "PaymentProvider" AS ENUM ('RAZORPAY', 'STRIPE', 'PADDLE', 'PAYPAL');
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'HALTED', 'PAUSED', 'EXPIRED');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'CAPTURED', 'REFUNDED', 'FAILED');
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'SOLO', 'TEAM', 'BROKERAGE', 'API_STARTER', 'API_GROWTH', 'API_ENTERPRISE');

-- Add payment provider customer IDs to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "razorpayCustomerId" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "paddleCustomerId" TEXT UNIQUE;

-- Add indexes for User payment provider IDs
CREATE INDEX IF NOT EXISTS "User_razorpayCustomerId_idx" ON "User"("razorpayCustomerId");
CREATE INDEX IF NOT EXISTS "User_stripeCustomerId_idx" ON "User"("stripeCustomerId");

-- Add payment provider customer IDs to Organization table
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "razorpayCustomerId" TEXT UNIQUE;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "paddleCustomerId" TEXT UNIQUE;
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "activeSubscriptionId" TEXT;

-- Add index for Organization activeSubscriptionId
CREATE INDEX IF NOT EXISTS "Organization_activeSubscriptionId_idx" ON "Organization"("activeSubscriptionId");

-- Create Subscription table
CREATE TABLE IF NOT EXISTS "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT,
    "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "externalSubscriptionId" TEXT NOT NULL UNIQUE,
    "externalPlanId" TEXT NOT NULL,
    "externalCustomerId" TEXT,
    "planTier" "PlanTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- Create Payment table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subscriptionId" TEXT,
    "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "externalPaymentId" TEXT NOT NULL UNIQUE,
    "externalOrderId" TEXT,
    "externalInvoiceId" TEXT,
    "signature" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT,
    "errorCode" TEXT,
    "errorDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- Create Invoice table
CREATE TABLE IF NOT EXISTS "Invoice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL DEFAULT 'RAZORPAY',
    "externalInvoiceId" TEXT NOT NULL UNIQUE,
    "externalSubscriptionId" TEXT,
    "amount" INTEGER NOT NULL,
    "amountPaid" INTEGER,
    "amountDue" INTEGER,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "invoiceUrl" TEXT,
    "receiptUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- Add foreign keys and indexes for Subscription
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx" ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_organizationId_idx" ON "Subscription"("organizationId");
CREATE INDEX IF NOT EXISTS "Subscription_externalSubscriptionId_idx" ON "Subscription"("externalSubscriptionId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_paymentProvider_idx" ON "Subscription"("paymentProvider");
CREATE INDEX IF NOT EXISTS "Subscription_planTier_idx" ON "Subscription"("planTier");

ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign keys and indexes for Payment
CREATE INDEX IF NOT EXISTS "Payment_userId_idx" ON "Payment"("userId");
CREATE INDEX IF NOT EXISTS "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");
CREATE INDEX IF NOT EXISTS "Payment_externalPaymentId_idx" ON "Payment"("externalPaymentId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");
CREATE INDEX IF NOT EXISTS "Payment_paymentProvider_idx" ON "Payment"("paymentProvider");
CREATE INDEX IF NOT EXISTS "Payment_createdAt_idx" ON "Payment"("createdAt");

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add foreign keys and indexes for Invoice
CREATE INDEX IF NOT EXISTS "Invoice_userId_idx" ON "Invoice"("userId");
CREATE INDEX IF NOT EXISTS "Invoice_externalInvoiceId_idx" ON "Invoice"("externalInvoiceId");
CREATE INDEX IF NOT EXISTS "Invoice_externalSubscriptionId_idx" ON "Invoice"("externalSubscriptionId");
CREATE INDEX IF NOT EXISTS "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX IF NOT EXISTS "Invoice_paymentProvider_idx" ON "Invoice"("paymentProvider");
CREATE INDEX IF NOT EXISTS "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
