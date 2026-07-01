-- Persist the customer's time-of-day preference on the request. Previously the
-- morning/afternoon/evening choice was only concatenated into the description
-- text, so the accepted booking's scheduledAt was UTC-midnight with no time.
ALTER TABLE "ServiceRequest" ADD COLUMN IF NOT EXISTS "timeOfDay" TEXT;
