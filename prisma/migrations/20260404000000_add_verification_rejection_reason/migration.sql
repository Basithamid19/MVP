-- Add rejection reason field to ProviderVerification
ALTER TABLE "ProviderVerification" ADD COLUMN "rejectionReason" TEXT;
