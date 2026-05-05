-- ============================================================
-- NFTX — Likes & Purchases
-- Run this in Supabase SQL Editor after setup.sql
-- ============================================================

-- ── NFT Likes ─────────────────────────────────────────────
-- One row per (user, nft) pair — prevents double-liking.
CREATE TABLE IF NOT EXISTS nft_likes (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nft_id     UUID REFERENCES nfts(id)     ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, nft_id)
);

CREATE INDEX IF NOT EXISTS nft_likes_nft_idx  ON nft_likes(nft_id);
CREATE INDEX IF NOT EXISTS nft_likes_user_idx ON nft_likes(user_id);

ALTER TABLE nft_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select" ON nft_likes;
DROP POLICY IF EXISTS "likes_insert" ON nft_likes;
DROP POLICY IF EXISTS "likes_delete" ON nft_likes;

CREATE POLICY "likes_select" ON nft_likes FOR SELECT USING (true);
CREATE POLICY "likes_insert" ON nft_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete" ON nft_likes FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT                   ON nft_likes TO anon;
GRANT SELECT, INSERT, DELETE   ON nft_likes TO authenticated;

-- ── Allow authenticated users to record ownership on purchase ──
-- (The original schema only had SELECT; purchases need INSERT.)
DROP POLICY IF EXISTS "ownership_insert" ON nft_ownership;
CREATE POLICY "ownership_insert" ON nft_ownership
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- ── Reload API schema cache ────────────────────────────────
NOTIFY pgrst, 'reload schema';
