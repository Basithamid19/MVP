-- Block 3: add missing FK constraints and indexes.
--
-- Why: the raw-SQL migrations for Notification (20260420) and ChatThread
-- (20260403) never issued `ADD CONSTRAINT ... FOREIGN KEY`, and none of the
-- high-traffic FK source columns were indexed. This migration closes both
-- gaps. It is idempotent — safe to re-run against a DB that already has some
-- of the constraints.

-- ─── Orphan cleanup (chat-related: join table → messages → threads) ───────
-- Ordering matters. The join table references ChatThread.id, and ChatMessage
-- references ChatThread.id, so we remove them BEFORE deleting ChatThread rows
-- that fail the new FK. Doing it the other way would violate the existing
-- _ChatThreadToUser FK (which points to ChatThread on delete restrict).

-- 1. Remove join-table rows whose ChatThread is about to be deleted.
DELETE FROM "_ChatThreadToUser"
WHERE "A" IN (
  SELECT "id" FROM "ChatThread"
  WHERE "customerId" NOT IN (SELECT "id" FROM "User")
     OR "providerId" NOT IN (SELECT "id" FROM "User")
);

-- 2. Remove ChatMessage rows whose thread is about to be deleted.
DELETE FROM "ChatMessage"
WHERE "threadId" IN (
  SELECT "id" FROM "ChatThread"
  WHERE "customerId" NOT IN (SELECT "id" FROM "User")
     OR "providerId" NOT IN (SELECT "id" FROM "User")
);

-- 3. Finally remove the orphaned ChatThread rows themselves.
DELETE FROM "ChatThread"
WHERE "customerId" NOT IN (SELECT "id" FROM "User")
   OR "providerId" NOT IN (SELECT "id" FROM "User");

-- 4. Orphaned notifications (no dependents of their own, so no ordering issue).
DELETE FROM "Notification"
WHERE "userId" NOT IN (SELECT "id" FROM "User");

-- ─── Missing foreign keys ────────────────────────────────────────────────
-- Wrapped in DO blocks so re-runs against a DB that already has the
-- constraint are no-ops instead of errors.

DO $$ BEGIN
  ALTER TABLE "Notification"
    ADD CONSTRAINT "Notification_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatThread"
    ADD CONSTRAINT "ChatThread_customerId_fkey"
    FOREIGN KEY ("customerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ChatThread"
    ADD CONSTRAINT "ChatThread_providerId_fkey"
    FOREIGN KEY ("providerId") REFERENCES "User"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Missing indexes on FK source columns ─────────────────────────────────
-- IF NOT EXISTS makes these idempotent. Kept as plain CREATE INDEX (not
-- CONCURRENTLY) because Prisma runs migrations inside a transaction.

CREATE INDEX IF NOT EXISTS "Notification_userId_idx"              ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "ChatThread_customerId_idx"            ON "ChatThread"("customerId");
CREATE INDEX IF NOT EXISTS "ChatThread_providerId_idx"            ON "ChatThread"("providerId");
CREATE INDEX IF NOT EXISTS "ChatMessage_threadId_idx"             ON "ChatMessage"("threadId");
CREATE INDEX IF NOT EXISTS "ChatMessage_senderId_idx"             ON "ChatMessage"("senderId");
CREATE INDEX IF NOT EXISTS "Quote_requestId_idx"                  ON "Quote"("requestId");
CREATE INDEX IF NOT EXISTS "Quote_providerId_idx"                 ON "Quote"("providerId");
CREATE INDEX IF NOT EXISTS "Booking_customerId_idx"               ON "Booking"("customerId");
CREATE INDEX IF NOT EXISTS "Booking_providerId_idx"               ON "Booking"("providerId");
CREATE INDEX IF NOT EXISTS "Review_customerId_idx"                ON "Review"("customerId");
CREATE INDEX IF NOT EXISTS "Review_providerId_idx"                ON "Review"("providerId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_customerId_idx"        ON "ServiceRequest"("customerId");
CREATE INDEX IF NOT EXISTS "ServiceRequest_categoryId_idx"        ON "ServiceRequest"("categoryId");
CREATE INDEX IF NOT EXISTS "ServiceOffering_providerProfileId_idx" ON "ServiceOffering"("providerProfileId");
CREATE INDEX IF NOT EXISTS "AvailabilitySlot_providerProfileId_idx" ON "AvailabilitySlot"("providerProfileId");
