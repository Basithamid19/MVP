-- Add Stripe Connect fields to ProviderProfile
ALTER TABLE "ProviderProfile"
  ADD COLUMN IF NOT EXISTS "stripeAccountId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- Add deposit + cancellation fields to Booking
ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "canceledAt" TIMESTAMP(3);

-- Add Stripe payment tracking fields to Payment
ALTER TABLE "Payment"
  ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "platformFee" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "stripeSessionId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeIntentId" TEXT,
  ADD COLUMN IF NOT EXISTS "stripeChargeId" TEXT;

-- Widen Payment.status to accommodate new values (DEPOSIT_HELD, PARTIAL_REFUND)
-- (already TEXT, no change needed — comment for reference)

-- Add isLocked to ChatThread
ALTER TABLE "ChatThread"
  ADD COLUMN IF NOT EXISTS "isLocked" BOOLEAN NOT NULL DEFAULT false;
