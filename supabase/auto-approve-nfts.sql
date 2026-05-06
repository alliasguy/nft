-- ============================================================
-- Artsorbit — Auto-approve newly minted user NFTs
-- Run in Supabase SQL Editor
-- ============================================================
-- Problem: moderation.sql set mod_status DEFAULT 'review', so every
-- user-minted NFT is invisible on the marketplace until an admin
-- manually approves it. For the current stage this blocks discovery.
--
-- Fix:
--   1. Change the column default to 'approved'
--   2. Approve all existing user-minted NFTs that are stuck in 'review'
--   3. Seeded NFTs are already 'approved' — no change needed
--   4. Admins can still FLAG individual NFTs via the moderation panel
-- ============================================================

-- 1. New mints auto-approve
ALTER TABLE nfts
  ALTER COLUMN mod_status SET DEFAULT 'approved';

-- 2. Approve existing user NFTs currently stuck in review
UPDATE nfts
SET    mod_status = 'approved'
WHERE  mod_status = 'review'
AND    creator_id IS NOT NULL;   -- only real user NFTs, not seeded

NOTIFY pgrst, 'reload schema';
