-- ============================================================
-- Artsorbit — Admin: Boost NFT likes
-- Run in Supabase SQL editor.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_boost_likes(p_nft_id uuid, p_amount int DEFAULT 100)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin only');
  END IF;

  IF p_amount < 1 OR p_amount > 10000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be between 1 and 10 000');
  END IF;

  UPDATE nfts SET likes_count = likes_count + p_amount WHERE id = p_nft_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NFT not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_boost_likes TO authenticated;

NOTIFY pgrst, 'reload schema';
