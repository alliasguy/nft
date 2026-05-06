-- ============================================================
-- Artsorbit — Admin NFT Management
-- Run in Supabase SQL editor.
-- ============================================================

-- ── 1. featured_nft_id in platform_settings ───────────────
INSERT INTO platform_settings (key, value)
VALUES ('featured_nft_id', '')
ON CONFLICT (key) DO NOTHING;

-- ── 2. set_featured_nft ───────────────────────────────────
CREATE OR REPLACE FUNCTION set_featured_nft(p_nft_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin only');
  END IF;

  INSERT INTO platform_settings (key, value)
  VALUES ('featured_nft_id', p_nft_id::text)
  ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION set_featured_nft TO authenticated;

-- ── 3. admin_edit_nft ─────────────────────────────────────
CREATE OR REPLACE FUNCTION admin_edit_nft(
  p_nft_id      uuid,
  p_title       text,
  p_description text,
  p_price       numeric,
  p_status      text,
  p_category    text,
  p_badge       text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin only');
  END IF;

  UPDATE nfts SET
    title       = p_title,
    description = p_description,
    price       = p_price,
    status      = p_status,
    category    = p_category,
    badge       = NULLIF(p_badge, '')
  WHERE id = p_nft_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NFT not found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_edit_nft TO authenticated;

-- ── 4. admin_delete_nft ───────────────────────────────────
CREATE OR REPLACE FUNCTION admin_delete_nft(p_nft_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Admin only');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM nfts WHERE id = p_nft_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'NFT not found');
  END IF;

  -- Clear featured if this NFT is currently featured
  UPDATE platform_settings
  SET value = ''
  WHERE key = 'featured_nft_id' AND value = p_nft_id::text;

  -- Remove related rows (ignore if tables don't exist yet)
  DELETE FROM nft_likes     WHERE nft_id = p_nft_id;
  DELETE FROM nft_ownership WHERE nft_id = p_nft_id;
  DELETE FROM nft_traits    WHERE nft_id = p_nft_id;
  DELETE FROM nfts          WHERE id     = p_nft_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_delete_nft TO authenticated;

-- ── 5. Trigger: auto-approve NFTs minted by admins ────────
CREATE OR REPLACE FUNCTION fn_auto_approve_admin_nft()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.creator_id IS NOT NULL THEN
    IF (SELECT role FROM profiles WHERE id = NEW.creator_id) = 'admin' THEN
      NEW.mod_status := 'approved';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approve_admin ON nfts;
CREATE TRIGGER trg_auto_approve_admin
  BEFORE INSERT ON nfts
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_approve_admin_nft();

NOTIFY pgrst, 'reload schema';
