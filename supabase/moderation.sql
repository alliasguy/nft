-- ============================================================
-- Artsorbit — NFT Moderation System
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Add moderation columns to nfts ─────────────────────
ALTER TABLE nfts
  ADD COLUMN IF NOT EXISTS mod_status TEXT NOT NULL DEFAULT 'review'
    CHECK (mod_status IN ('review', 'approved', 'flagged')),
  ADD COLUMN IF NOT EXISTS mod_note TEXT;

CREATE INDEX IF NOT EXISTS nfts_mod_status_idx ON nfts(mod_status);

-- ── 2. Pre-approve all existing/seeded NFTs ───────────────
-- Newly minted NFTs will default to 'review'.
-- The 16 seeded NFTs and any that existed before this migration
-- are marked approved so they don't flood the moderation queue.
UPDATE nfts SET mod_status = 'approved' WHERE mod_status = 'review';

-- ── 3. RPC: Moderate an NFT (admin only) ──────────────────
CREATE OR REPLACE FUNCTION moderate_nft(
  p_nft_id  UUID,
  p_status  TEXT,          -- 'approved' | 'flagged' | 'review'
  p_note    TEXT DEFAULT ''
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  IF p_status NOT IN ('review', 'approved', 'flagged') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid status');
  END IF;

  UPDATE nfts
  SET mod_status = p_status,
      mod_note   = NULLIF(p_note, '')
  WHERE id = p_nft_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'NFT not found');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION moderate_nft TO authenticated;

-- ── 4. Reload schema cache ────────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- After running this, newly minted NFTs will arrive in the
-- moderation queue with status = 'review'.
-- The 16 seeded NFTs are automatically approved.
-- ============================================================
