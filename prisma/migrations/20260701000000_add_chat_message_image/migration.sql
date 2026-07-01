-- Persist image attachments on chat messages. Previously the API accepted an
-- imageUrl in the POST body but silently dropped it, so photos disappeared on
-- the next poll.
ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
