-- Make the quote builder's expiry picker real. The 1/2/3/7-day selector and
-- "Expires: <date>" line existed in the UI but expiresInDays was never sent
-- and nothing ever expired.
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP(3);
