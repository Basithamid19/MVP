-- Legacy avatars were stored as base64 data URLs (20-60KB per row) and shipped
-- in every payload that selects User.image. The read layer now nulls them out
-- anyway (lib/safe-image.ts), so clear them at rest; users re-upload via the
-- fixed /api/user/avatar which stores a short public URL.
UPDATE "User" SET "image" = NULL WHERE "image" LIKE 'data:%';
