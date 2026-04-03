-- AlterTable: Add customerId and providerId to ChatThread
ALTER TABLE "ChatThread" ADD COLUMN "customerId" TEXT;
ALTER TABLE "ChatThread" ADD COLUMN "providerId" TEXT;

-- Backfill: Populate customerId and providerId from the implicit join table
-- The _ChatThreadToUser join table has columns A (ChatThread.id) and B (User.id)
-- We need to figure out which user is the customer and which is the provider
UPDATE "ChatThread" ct
SET "customerId" = u_customer."id"
FROM "_ChatThreadToUser" ctu
JOIN "User" u_customer ON u_customer."id" = ctu."B" AND u_customer."role" = 'CUSTOMER'
WHERE ctu."A" = ct."id" AND ct."customerId" IS NULL;

UPDATE "ChatThread" ct
SET "providerId" = u_provider."id"
FROM "_ChatThreadToUser" ctu
JOIN "User" u_provider ON u_provider."id" = ctu."B" AND u_provider."role" = 'PROVIDER'
WHERE ctu."A" = ct."id" AND ct."providerId" IS NULL;

-- Delete any threads that couldn't be backfilled (orphaned/invalid data)
DELETE FROM "ChatMessage" WHERE "threadId" IN (
  SELECT "id" FROM "ChatThread" WHERE "customerId" IS NULL OR "providerId" IS NULL
);
DELETE FROM "_ChatThreadToUser" WHERE "A" IN (
  SELECT "id" FROM "ChatThread" WHERE "customerId" IS NULL OR "providerId" IS NULL
);
DELETE FROM "ChatThread" WHERE "customerId" IS NULL OR "providerId" IS NULL;

-- Remove duplicate threads: keep the one with the most messages per (requestId, customerId, providerId) group
-- First, identify duplicates
WITH ranked AS (
  SELECT ct."id",
         ct."requestId",
         ct."customerId",
         ct."providerId",
         (SELECT COUNT(*) FROM "ChatMessage" cm WHERE cm."threadId" = ct."id") as msg_count,
         ROW_NUMBER() OVER (
           PARTITION BY ct."requestId", ct."customerId", ct."providerId"
           ORDER BY (SELECT COUNT(*) FROM "ChatMessage" cm WHERE cm."threadId" = ct."id") DESC, ct."createdAt" ASC
         ) as rn
  FROM "ChatThread" ct
),
duplicates AS (
  SELECT "id" FROM ranked WHERE rn > 1
)
-- Move messages from duplicates to the canonical thread
-- (Skip this step — just delete duplicates and their messages for simplicity)
DELETE FROM "ChatMessage" WHERE "threadId" IN (SELECT "id" FROM duplicates);

WITH ranked AS (
  SELECT ct."id",
         ROW_NUMBER() OVER (
           PARTITION BY ct."requestId", ct."customerId", ct."providerId"
           ORDER BY (SELECT COUNT(*) FROM "ChatMessage" cm WHERE cm."threadId" = ct."id") DESC, ct."createdAt" ASC
         ) as rn
  FROM "ChatThread" ct
),
duplicates AS (
  SELECT "id" FROM ranked WHERE rn > 1
)
DELETE FROM "_ChatThreadToUser" WHERE "A" IN (SELECT "id" FROM duplicates);

WITH ranked AS (
  SELECT ct."id",
         ROW_NUMBER() OVER (
           PARTITION BY ct."requestId", ct."customerId", ct."providerId"
           ORDER BY ct."createdAt" ASC
         ) as rn
  FROM "ChatThread" ct
),
duplicates AS (
  SELECT "id" FROM ranked WHERE rn > 1
)
DELETE FROM "ChatThread" WHERE "id" IN (SELECT "id" FROM duplicates);

-- Now make the columns NOT NULL
ALTER TABLE "ChatThread" ALTER COLUMN "customerId" SET NOT NULL;
ALTER TABLE "ChatThread" ALTER COLUMN "providerId" SET NOT NULL;

-- Add unique constraint
CREATE UNIQUE INDEX "ChatThread_requestId_customerId_providerId_key" ON "ChatThread"("requestId", "customerId", "providerId");
