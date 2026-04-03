-- AlterTable: Add customerId and providerId to ChatThread (safe: ADD COLUMN IF NOT EXISTS not supported in all PG versions, but ALTER TABLE ADD COLUMN with a default NULL is safe for re-runs since Prisma tracks applied migrations)
ALTER TABLE "ChatThread" ADD COLUMN "customerId" TEXT;
ALTER TABLE "ChatThread" ADD COLUMN "providerId" TEXT;

-- Backfill: Populate customerId and providerId from the implicit join table
-- The _ChatThreadToUser join table has columns A (ChatThread.id) and B (User.id)
UPDATE "ChatThread" ct
SET "customerId" = sub."userId"
FROM (
  SELECT ctu."A" as "threadId", u."id" as "userId"
  FROM "_ChatThreadToUser" ctu
  JOIN "User" u ON u."id" = ctu."B" AND u."role" = 'CUSTOMER'
) sub
WHERE sub."threadId" = ct."id" AND ct."customerId" IS NULL;

UPDATE "ChatThread" ct
SET "providerId" = sub."userId"
FROM (
  SELECT ctu."A" as "threadId", u."id" as "userId"
  FROM "_ChatThreadToUser" ctu
  JOIN "User" u ON u."id" = ctu."B" AND u."role" = 'PROVIDER'
) sub
WHERE sub."threadId" = ct."id" AND ct."providerId" IS NULL;

-- Delete orphaned threads that couldn't be backfilled
DELETE FROM "ChatMessage" WHERE "threadId" IN (
  SELECT "id" FROM "ChatThread" WHERE "customerId" IS NULL OR "providerId" IS NULL
);
DELETE FROM "_ChatThreadToUser" WHERE "A" IN (
  SELECT "id" FROM "ChatThread" WHERE "customerId" IS NULL OR "providerId" IS NULL
);
DELETE FROM "ChatThread" WHERE "customerId" IS NULL OR "providerId" IS NULL;

-- Remove duplicate threads: keep the oldest per (requestId, customerId, providerId) group
-- Step 1: Delete messages belonging to duplicate threads
DELETE FROM "ChatMessage" WHERE "threadId" IN (
  SELECT ct."id" FROM "ChatThread" ct
  WHERE ct."id" != (
    SELECT ct2."id" FROM "ChatThread" ct2
    WHERE ct2."requestId" = ct."requestId"
      AND ct2."customerId" = ct."customerId"
      AND ct2."providerId" = ct."providerId"
    ORDER BY ct2."createdAt" ASC
    LIMIT 1
  )
);

-- Step 2: Delete join table entries for duplicate threads
DELETE FROM "_ChatThreadToUser" WHERE "A" IN (
  SELECT ct."id" FROM "ChatThread" ct
  WHERE ct."id" != (
    SELECT ct2."id" FROM "ChatThread" ct2
    WHERE ct2."requestId" = ct."requestId"
      AND ct2."customerId" = ct."customerId"
      AND ct2."providerId" = ct."providerId"
    ORDER BY ct2."createdAt" ASC
    LIMIT 1
  )
);

-- Step 3: Delete the duplicate threads themselves
DELETE FROM "ChatThread" ct
WHERE ct."id" != (
  SELECT ct2."id" FROM "ChatThread" ct2
  WHERE ct2."requestId" = ct."requestId"
    AND ct2."customerId" = ct."customerId"
    AND ct2."providerId" = ct."providerId"
  ORDER BY ct2."createdAt" ASC
  LIMIT 1
);

-- Now make the columns NOT NULL
ALTER TABLE "ChatThread" ALTER COLUMN "customerId" SET NOT NULL;
ALTER TABLE "ChatThread" ALTER COLUMN "providerId" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "ChatThread_requestId_customerId_providerId_key" ON "ChatThread"("requestId", "customerId", "providerId");
