-- AlterTable: add instantBook, bufferMins, blackoutDates to ProviderProfile
ALTER TABLE "ProviderProfile" ADD COLUMN "instantBook" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProviderProfile" ADD COLUMN "bufferMins" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "ProviderProfile" ADD COLUMN "blackoutDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
