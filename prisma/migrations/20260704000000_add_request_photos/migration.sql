-- Attach uploaded photos to service requests. The wizard already uploaded
-- photos and showed them on the Review step, but they were never sent with the
-- request — providers never saw them.
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "photoUrls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
