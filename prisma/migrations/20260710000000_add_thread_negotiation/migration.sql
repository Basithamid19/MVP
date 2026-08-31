-- In-inbox negotiation. All quote haggling (offer → counter both ways →
-- accept/decline) now lives in the conversation, so two things must be
-- persisted that previously were not:
--
--   1. Quote.currentPrice / Quote.turn — the *current* negotiation state.
--      `price` keeps the provider's original ask so it stays auditable;
--      currentPrice holds the latest offered figure (null => use price) and
--      turn records whose accept/counter is pending (null => 'customer',
--      i.e. a fresh provider quote awaits the customer).
--
--   2. ChatMessage.kind / ChatMessage.payload — offer and system cards are
--      real messages now instead of client-synthesized chips, so the history
--      of a negotiation survives a reload and is identical for both sides.
--
-- Idempotent (ADD COLUMN IF NOT EXISTS) per this folder's convention, and
-- `kind` is added with a DEFAULT plus an explicit backfill so existing rows
-- are valid the instant the column appears — every read site also carries a
-- P2022 fallback, so a DB that is behind on this migration degrades to the
-- pre-negotiation behaviour rather than erroring.

ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "currentPrice" DOUBLE PRECISION;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "turn" TEXT;

ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "payload" JSONB;
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'text';

-- Belt-and-braces backfill: harmless when the DEFAULT already applied, and
-- correct if the column pre-existed as nullable from a partial deploy.
UPDATE "ChatMessage" SET "kind" = 'text' WHERE "kind" IS NULL;
