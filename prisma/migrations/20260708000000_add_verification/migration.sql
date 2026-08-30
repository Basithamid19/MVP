-- Account verification (email link or SMS code) + password reset.
-- Registration previously accepted any string as an email and there was no way
-- to recover a forgotten password. This adds the storage those flows need:
--   User.phone      — E.164 number for the SMS channel (login stays email-based)
--   User.verifiedAt — null blocks login; set once the user proves the channel
--   AuthToken       — single-use, expiring link tokens / 6-digit codes
-- Idempotent (IF NOT EXISTS / DO blocks) so re-runs against a partially
-- migrated database are no-ops, matching the rest of this migrations folder.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- CreateTable: AuthToken
CREATE TABLE IF NOT EXISTS "AuthToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "AuthToken_token_key" ON "AuthToken"("token");
CREATE INDEX IF NOT EXISTS "AuthToken_userId_type_idx" ON "AuthToken"("userId", "type");

-- Wrapped in a DO block so a re-run against a DB that already has the
-- constraint is a no-op instead of an error (see 20260421 for the pattern).
DO $$ BEGIN
  ALTER TABLE "AuthToken"
    ADD CONSTRAINT "AuthToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Backfill: every account that existed before verification was introduced is
-- grandfathered in, otherwise this migration would lock out every user.
UPDATE "User" SET "verifiedAt" = now() WHERE "verifiedAt" IS NULL;
