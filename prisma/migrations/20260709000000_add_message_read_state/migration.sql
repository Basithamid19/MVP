-- Unread indicators for the messages inbox. readAt is stamped on the
-- counterpart's messages whenever the recipient opens (or polls) the thread;
-- null therefore means "not seen yet". Idempotent per this folder's convention.

ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

-- Backfill: everything that existed before read-tracking counts as read, so
-- long-standing conversations don't all light up as NEW on deploy.
UPDATE "ChatMessage" SET "readAt" = now() WHERE "readAt" IS NULL;
