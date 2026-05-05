-- ============================================================
-- NFTX — Relist / Sell NFT
-- Run in Supabase SQL Editor
-- ============================================================
-- Allows the current owner of an NFT to update its price and
-- sale type (buy-now or auction) so it reappears in the marketplace.
--
-- Authorisation: caller must be either
--   a) the creator of an NFT that has never been sold (no ownership record), OR
--   b) the recorded current owner in nft_ownership
-- ============================================================

CREATE OR REPLACE FUNCTION relist_nft(
  p_nft_id UUID,
  p_price  NUMERIC,
  p_status TEXT DEFAULT 'buy-now'   -- 'buy-now' | 'auction'
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_authorized BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;
  IF p_price <= 0 THEN
    RETURN json_build_object('success',false,'error','Price must be greater than 0');
  END IF;
  IF p_status NOT IN ('buy-now','auction') THEN
    RETURN json_build_object('success',false,'error','Invalid status — use buy-now or auction');
  END IF;

  -- Creator of an NFT that has never been transferred
  SELECT EXISTS (
    SELECT 1 FROM nfts n
    WHERE  n.id          = p_nft_id
      AND  n.creator_id  = v_uid
      AND  NOT EXISTS (SELECT 1 FROM nft_ownership o WHERE o.nft_id = n.id)
  ) INTO v_authorized;

  -- Current owner recorded in nft_ownership
  IF NOT v_authorized THEN
    SELECT EXISTS (
      SELECT 1 FROM nft_ownership
      WHERE nft_id = p_nft_id AND owner_id = v_uid
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RETURN json_build_object('success',false,'error','You do not own this NFT');
  END IF;

  UPDATE nfts
  SET price  = p_price,
      status = p_status
  WHERE id = p_nft_id;

  RETURN json_build_object('success',true,'new_price',p_price,'new_status',p_status);
END;
$$;
GRANT EXECUTE ON FUNCTION relist_nft TO authenticated;
NOTIFY pgrst, 'reload schema';
