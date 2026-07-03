-- Dual-mode requests: a request sent from a provider's profile is DIRECT — it
-- goes only to that provider (targetProviderId = ProviderProfile.id). Requests
-- created from the homepage/category entry points stay open (NULL) and
-- broadcast to every provider in the category, as before.
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "targetProviderId" TEXT;
CREATE INDEX IF NOT EXISTS "ServiceRequest_targetProviderId_idx" ON "ServiceRequest"("targetProviderId");
