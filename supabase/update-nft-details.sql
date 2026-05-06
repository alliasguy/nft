-- ============================================================
-- Artsorbit — Update NFT Details (title, description, price, etc.)
-- Run in Supabase SQL Editor
-- ============================================================
-- Using a SECURITY DEFINER RPC guarantees the update is audited
-- server-side rather than relying on client-side RLS which can
-- silently fail (return error:null but update 0 rows).
-- ============================================================

CREATE OR REPLACE FUNCTION update_nft_details(
  p_nft_id      UUID,
  p_title       TEXT,
  p_description TEXT    DEFAULT NULL,
  p_price       NUMERIC DEFAULT NULL,
  p_status      TEXT    DEFAULT NULL,
  p_category    TEXT    DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID := auth.uid();
  v_authorized BOOLEAN := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;

  IF p_price IS NOT NULL AND p_price <= 0 THEN
    RETURN json_build_object('success',false,'error','Price must be greater than 0');
  END IF;

  IF p_status IS NOT NULL AND p_status NOT IN ('buy-now','auction','new') THEN
    RETURN json_build_object('success',false,'error','Invalid status');
  END IF;

  -- ── Authorisation: creator of unsold NFT, OR current owner ──
  -- Creator of a never-sold NFT
  SELECT EXISTS (
    SELECT 1 FROM nfts n
    WHERE  n.id         = p_nft_id
      AND  n.creator_id = v_uid
      AND  NOT EXISTS (SELECT 1 FROM nft_ownership o WHERE o.nft_id = n.id)
  ) INTO v_authorized;

  -- Current owner (bought from someone else)
  IF NOT v_authorized THEN
    SELECT EXISTS (
      SELECT 1 FROM nft_ownership WHERE nft_id = p_nft_id AND owner_id = v_uid
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RETURN json_build_object('success',false,'error','You do not have permission to edit this NFT');
  END IF;

  -- ── Apply updates (only non-null fields change) ────────────
  UPDATE nfts SET
    title       = COALESCE(p_title,       title),
    description = COALESCE(p_description, description),
    price       = COALESCE(p_price,       price),
    status      = COALESCE(p_status,      status),
    category    = COALESCE(p_category,    category)
  WHERE id = p_nft_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','NFT not found');
  END IF;

  RETURN json_build_object('success',true);
END;
$$;
GRANT EXECUTE ON FUNCTION update_nft_details TO authenticated;
NOTIFY pgrst, 'reload schema';
