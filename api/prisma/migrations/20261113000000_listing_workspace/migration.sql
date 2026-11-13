-- Existing scalar fields and historical design associations remain intact.
ALTER TABLE "Property"
  ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "record" JSONB,
  ADD COLUMN "version" INTEGER NOT NULL DEFAULT 1;
CREATE TABLE "ListingProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "record" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ListingProfile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Property_organizationId_updatedAt_idx" ON "Property"("organizationId", "updatedAt");
CREATE INDEX "Property_organizationId_name_idx" ON "Property"("organizationId", "name");
CREATE INDEX "Property_organizationId_address_idx" ON "Property"("organizationId", "address");
CREATE UNIQUE INDEX "ListingProfile_userId_key" ON "ListingProfile"("userId");
ALTER TABLE "ListingProfile" ADD CONSTRAINT "ListingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
