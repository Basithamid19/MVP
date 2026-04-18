-- AlterTable: add instantBook, bufferMins, blackoutDates to ProviderProfile
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "instantBook" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "bufferMins" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "blackoutDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
