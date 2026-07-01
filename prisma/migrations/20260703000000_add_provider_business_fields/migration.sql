-- Persist business identity collected during provider onboarding. Previously
-- companyName/businessType/vatNumber were gathered in the onboarding UI but had
-- no column to land in (companyName only conditionally leaked into bio).
-- Note: raw national ID number is deliberately NOT stored here — it belongs
-- only in the verification document, not a plaintext column.
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "businessType" TEXT;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "vatNumber" TEXT;
