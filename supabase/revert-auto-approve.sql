-- ============================================================
-- Artsorbit — Revert auto-approve: require admin approval
-- Run in Supabase SQL Editor
-- ============================================================
-- Restores the original moderation flow:
--   1. Newly minted NFTs default to 'review'
--   2. Admin must approve via the moderation panel
--   3. Only 'approved' NFTs appear on the marketplace
-- ============================================================

-- Revert column default back to 'review'
ALTER TABLE nfts
  ALTER COLUMN mod_status SET DEFAULT 'review';

-- Put any user-minted NFTs that were auto-approved back to 'review'
-- (Seeded NFTs stay 'approved' — they are the demo catalogue)
UPDATE nfts
SET    mod_status = 'review'
WHERE  mod_status = 'approved'
AND    creator_id IS NOT NULL;

NOTIFY pgrst, 'reload schema';
