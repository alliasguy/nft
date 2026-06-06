-- ============================================================
-- Artsorbit — Pending Mints + Admin Direct Credit
-- Run in Supabase SQL Editor AFTER royalties.sql
-- ============================================================

-- ── 1. Pending Mints table ────────────────────────────────
CREATE TABLE IF NOT EXISTS pending_mints (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  art_shape       TEXT NOT NULL DEFAULT 'burst',
  art_stop_1      TEXT NOT NULL DEFAULT '#00f5d4',
  art_stop_2      TEXT NOT NULL DEFAULT '#f15bb5',
  price           NUMERIC(18,8) NOT NULL CHECK (price > 0),
  category        TEXT NOT NULL DEFAULT 'Art',
  sale_status     TEXT NOT NULL DEFAULT 'buy-now',
  collection_name TEXT,
  image_url       TEXT,
  royalty_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
  minting_fee     NUMERIC(18,8) NOT NULL,
  mint_status     TEXT NOT NULL DEFAULT 'pending'
                  CHECK (mint_status IN ('pending','approved','rejected')),
  admin_note      TEXT,
  nft_id          UUID,            -- filled in after approval
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pending_mints_user_idx   ON pending_mints(user_id);
CREATE INDEX IF NOT EXISTS pending_mints_status_idx ON pending_mints(mint_status);
CREATE INDEX IF NOT EXISTS pending_mints_date_idx   ON pending_mints(created_at DESC);

ALTER TABLE pending_mints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pending_mints_select" ON pending_mints;
CREATE POLICY "pending_mints_select" ON pending_mints FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

GRANT SELECT ON pending_mints TO authenticated;

-- ── 2. Replace mint_nft_internal ──────────────────────────
-- Drop all overloads first.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT oid::regprocedure AS sig FROM pg_proc WHERE proname = 'mint_nft_internal'
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION mint_nft_internal(
  p_title           TEXT,
  p_description     TEXT,
  p_art_shape       TEXT,
  p_art_stop_1      TEXT,
  p_art_stop_2      TEXT,
  p_price           NUMERIC,
  p_category        TEXT,
  p_status          TEXT    DEFAULT 'buy-now',
  p_collection_name TEXT    DEFAULT NULL,
  p_image_url       TEXT    DEFAULT NULL,
  p_royalty_pct     NUMERIC DEFAULT 0
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID    := auth.uid();
  v_balance    NUMERIC;
  v_mint_fee   NUMERIC := 0.15;
  v_nft_id     UUID;
  v_pending_id UUID;
  v_handle     TEXT;
  v_name       TEXT;
  v_token_num  INTEGER;
  v_royalty    NUMERIC := LEAST(GREATEST(COALESCE(p_royalty_pct, 0), 0), 15);
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;

  SELECT COALESCE(NULLIF(value,''),'0.15')::NUMERIC INTO v_mint_fee
  FROM platform_settings WHERE key = 'minting_fee_eth';

  SELECT balance, handle, name INTO v_balance, v_handle, v_name
  FROM profiles WHERE id = v_uid FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','Profile not found');
  END IF;

  -- Insufficient balance: save as pending mint instead of failing
  IF v_balance < v_mint_fee THEN
    INSERT INTO pending_mints (
      user_id, title, description,
      art_shape, art_stop_1, art_stop_2,
      price, category, sale_status,
      collection_name, image_url, royalty_pct, minting_fee
    ) VALUES (
      v_uid, p_title, p_description,
      p_art_shape, p_art_stop_1, p_art_stop_2,
      p_price, p_category, p_status,
      p_collection_name, p_image_url, v_royalty, v_mint_fee
    ) RETURNING id INTO v_pending_id;

    RETURN json_build_object(
      'success',         true,
      'queued',          true,
      'pending_mint_id', v_pending_id,
      'balance',         v_balance,
      'required',        v_mint_fee
    );
  END IF;

  -- Enough balance: mint immediately
  SELECT COUNT(*) + 1 INTO v_token_num FROM nfts WHERE creator_id = v_uid;

  UPDATE profiles SET balance = balance - v_mint_fee WHERE id = v_uid;

  INSERT INTO nfts (
    title, description,
    art_shape, art_stop_1, art_stop_2,
    creator_id, creator_name, creator_handle, creator_verified, creator_gradient,
    collection_name,
    price, usd_price, token_id,
    category, status,
    likes_count, views_count, is_live,
    image_url,
    royalty_pct,
    mod_status
  ) VALUES (
    p_title, p_description,
    p_art_shape, p_art_stop_1, p_art_stop_2,
    v_uid, v_name, '@' || v_handle, false,
    'linear-gradient(135deg,' || p_art_stop_1 || ',' || p_art_stop_2 || ')',
    p_collection_name,
    p_price, NULL, LPAD(v_token_num::TEXT, 3, '0'),
    p_category, p_status,
    0, 0, false,
    p_image_url,
    v_royalty,
    CASE WHEN (SELECT role FROM profiles WHERE id = v_uid) = 'admin'
         THEN 'approved' ELSE 'review' END
  )
  RETURNING id INTO v_nft_id;

  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  VALUES (v_uid, v_nft_id, p_title, 'mint', v_mint_fee);

  RETURN json_build_object(
    'success',     true,
    'queued',      false,
    'nft_id',      v_nft_id,
    'fee_paid',    v_mint_fee,
    'new_balance', v_balance - v_mint_fee,
    'royalty_pct', v_royalty
  );
END;
$$;
GRANT EXECUTE ON FUNCTION mint_nft_internal TO authenticated;

-- ── 3. approve_pending_mint (admin only) ──────────────────
CREATE OR REPLACE FUNCTION approve_pending_mint(p_mint_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role      TEXT;
  v_mint      RECORD;
  v_balance   NUMERIC;
  v_handle    TEXT;
  v_name      TEXT;
  v_token_num INTEGER;
  v_nft_id    UUID;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;

  SELECT * INTO v_mint FROM pending_mints WHERE id = p_mint_id AND mint_status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','Not found or already processed');
  END IF;

  SELECT balance, handle, name INTO v_balance, v_handle, v_name
  FROM profiles WHERE id = v_mint.user_id FOR UPDATE;

  IF v_balance < v_mint.minting_fee THEN
    RETURN json_build_object(
      'success',  false,
      'error',    'User still has insufficient balance',
      'balance',  v_balance,
      'required', v_mint.minting_fee
    );
  END IF;

  UPDATE profiles SET balance = balance - v_mint.minting_fee WHERE id = v_mint.user_id;

  SELECT COUNT(*) + 1 INTO v_token_num FROM nfts WHERE creator_id = v_mint.user_id;

  INSERT INTO nfts (
    title, description,
    art_shape, art_stop_1, art_stop_2,
    creator_id, creator_name, creator_handle, creator_verified, creator_gradient,
    collection_name,
    price, usd_price, token_id,
    category, status,
    likes_count, views_count, is_live,
    image_url,
    royalty_pct,
    mod_status
  ) VALUES (
    v_mint.title, v_mint.description,
    v_mint.art_shape, v_mint.art_stop_1, v_mint.art_stop_2,
    v_mint.user_id, v_name, '@' || v_handle, false,
    'linear-gradient(135deg,' || v_mint.art_stop_1 || ',' || v_mint.art_stop_2 || ')',
    v_mint.collection_name,
    v_mint.price, NULL, LPAD(v_token_num::TEXT, 3, '0'),
    v_mint.category, v_mint.sale_status,
    0, 0, false,
    v_mint.image_url,
    v_mint.royalty_pct,
    'review'
  )
  RETURNING id INTO v_nft_id;

  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  VALUES (v_mint.user_id, v_nft_id, v_mint.title, 'mint', v_mint.minting_fee);

  UPDATE pending_mints
    SET mint_status = 'approved', nft_id = v_nft_id, approved_at = NOW()
  WHERE id = p_mint_id;

  RETURN json_build_object('success', true, 'nft_id', v_nft_id, 'user_id', v_mint.user_id);
END;
$$;
GRANT EXECUTE ON FUNCTION approve_pending_mint TO authenticated;

-- ── 4. reject_pending_mint (admin only) ───────────────────
CREATE OR REPLACE FUNCTION reject_pending_mint(p_mint_id UUID, p_note TEXT DEFAULT '')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role    TEXT;
  v_user_id UUID;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;

  UPDATE pending_mints
    SET mint_status = 'rejected', admin_note = p_note
  WHERE id = p_mint_id AND mint_status = 'pending'
  RETURNING user_id INTO v_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','Not found or already processed');
  END IF;

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END;
$$;
GRANT EXECUTE ON FUNCTION reject_pending_mint TO authenticated;

-- ── 5. admin_direct_credit (admin only) ───────────────────
CREATE OR REPLACE FUNCTION admin_direct_credit(
  p_user_id UUID,
  p_amount  NUMERIC,
  p_note    TEXT DEFAULT ''
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role        TEXT;
  v_new_balance NUMERIC;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success',false,'error','Amount must be greater than 0');
  END IF;

  UPDATE profiles
    SET balance = balance + p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','User not found');
  END IF;

  -- Log as an approved deposit for audit trail (no tx_hash = direct admin credit)
  INSERT INTO deposit_requests (user_id, amount, status, admin_note, confirmed_at)
  VALUES (
    p_user_id,
    p_amount,
    'approved',
    CASE WHEN p_note != '' THEN 'Direct admin credit — ' || p_note ELSE 'Direct admin credit' END,
    NOW()
  );

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_direct_credit TO authenticated;

NOTIFY pgrst, 'reload schema';
