-- ============================================================
-- Artsorbit — Creator Royalties
-- Creators earn a % of every resale of their NFT automatically.
-- Run in Supabase SQL editor.
-- ============================================================

-- ── 1. Add royalty_pct column ─────────────────────────────
ALTER TABLE nfts
  ADD COLUMN IF NOT EXISTS royalty_pct NUMERIC(5,2) NOT NULL DEFAULT 0
  CHECK (royalty_pct >= 0 AND royalty_pct <= 10);

-- ── 2. mint_nft_internal — accept royalty_pct ─────────────
-- Drop all overloads first so the new signature is unambiguous.
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
  v_handle     TEXT;
  v_name       TEXT;
  v_token_num  INTEGER;
  v_royalty    NUMERIC := LEAST(GREATEST(COALESCE(p_royalty_pct, 0), 0), 10);
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

  IF v_balance < v_mint_fee THEN
    RETURN json_build_object(
      'success',  false,
      'error',    'Insufficient balance to pay minting fee',
      'balance',  v_balance,
      'required', v_mint_fee
    );
  END IF;

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
    'nft_id',      v_nft_id,
    'fee_paid',    v_mint_fee,
    'new_balance', v_balance - v_mint_fee,
    'royalty_pct', v_royalty
  );
END;
$$;
GRANT EXECUTE ON FUNCTION mint_nft_internal TO authenticated;

-- ── 3. purchase_nft_internal — pay royalties on resale ────
CREATE OR REPLACE FUNCTION purchase_nft_internal(p_nft_id UUID, p_price NUMERIC)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid          UUID    := auth.uid();
  v_buyer_bal    NUMERIC;
  v_seller_id    UUID;
  v_creator_id   UUID;
  v_royalty_pct  NUMERIC := 0;
  v_royalty      NUMERIC := 0;
  v_seller_gets  NUMERIC;
  v_nft_title    TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;

  SELECT balance INTO v_buyer_bal FROM profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN RETURN json_build_object('success',false,'error','User not found'); END IF;
  IF v_buyer_bal < p_price THEN
    RETURN json_build_object('success',false,'error','Insufficient balance','balance',v_buyer_bal,'required',p_price);
  END IF;

  SELECT title, creator_id, royalty_pct INTO v_nft_title, v_creator_id, v_royalty_pct
  FROM nfts WHERE id = p_nft_id;

  -- Determine current seller
  SELECT owner_id INTO v_seller_id FROM nft_ownership WHERE nft_id = p_nft_id;
  IF v_seller_id IS NULL THEN v_seller_id := v_creator_id; END IF;

  -- Royalty only applies on resales (seller is not the original creator)
  IF v_seller_id IS DISTINCT FROM v_creator_id AND v_royalty_pct > 0 THEN
    v_royalty := ROUND(p_price * v_royalty_pct / 100.0, 8);
  END IF;
  v_seller_gets := p_price - v_royalty;

  -- Deduct from buyer
  UPDATE profiles SET balance = balance - p_price WHERE id = v_uid;

  -- Credit seller
  IF v_seller_id IS NOT NULL AND v_seller_id <> v_uid THEN
    UPDATE profiles SET balance = balance + v_seller_gets WHERE id = v_seller_id;
    INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
    VALUES (v_seller_id, p_nft_id, v_nft_title, 'sale', v_seller_gets);
  END IF;

  -- Credit creator royalty (if applicable and creator is not the buyer)
  IF v_royalty > 0 AND v_creator_id IS NOT NULL AND v_creator_id <> v_uid THEN
    UPDATE profiles SET balance = balance + v_royalty WHERE id = v_creator_id;
    INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
    VALUES (v_creator_id, p_nft_id, v_nft_title, 'sale', v_royalty);
  END IF;

  -- Transfer ownership
  INSERT INTO nft_ownership (nft_id, owner_id, purchase_price)
  VALUES (p_nft_id, v_uid, p_price)
  ON CONFLICT (nft_id) DO UPDATE SET
    owner_id = EXCLUDED.owner_id, purchase_price = EXCLUDED.purchase_price, acquired_at = NOW();

  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  VALUES (v_uid, p_nft_id, v_nft_title, 'purchase', p_price);

  RETURN json_build_object(
    'success',         true,
    'new_balance',     v_buyer_bal - p_price,
    'royalty_paid',    v_royalty,
    'royalty_pct',     v_royalty_pct,
    'seller_credited', v_seller_gets
  );
END;
$$;
GRANT EXECUTE ON FUNCTION purchase_nft_internal TO authenticated;

-- ── 4. accept_bid — pay royalties on auction resales ──────
CREATE OR REPLACE FUNCTION accept_bid(p_bid_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid         uuid    := auth.uid();
  v_nft_id      uuid;
  v_bidder_id   uuid;
  v_amount      numeric;
  v_bidder_bal  numeric;
  v_owner       uuid;
  v_creator_id  uuid;
  v_royalty_pct numeric := 0;
  v_royalty     numeric := 0;
  v_seller_gets numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT nft_id, bidder_id, amount INTO v_nft_id, v_bidder_id, v_amount
  FROM nft_bids WHERE id = p_bid_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bid not found or already processed');
  END IF;

  SELECT COALESCE(
    (SELECT owner_id FROM nft_ownership WHERE nft_id = v_nft_id),
    (SELECT creator_id FROM nfts WHERE id = v_nft_id)
  ) INTO v_owner;
  IF v_owner IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the NFT owner can accept bids');
  END IF;

  SELECT balance INTO v_bidder_bal FROM profiles WHERE id = v_bidder_id FOR UPDATE;
  IF v_bidder_bal < v_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bidder no longer has sufficient balance');
  END IF;

  SELECT creator_id, royalty_pct INTO v_creator_id, v_royalty_pct FROM nfts WHERE id = v_nft_id;

  -- Royalty only on resales
  IF v_uid IS DISTINCT FROM v_creator_id AND v_royalty_pct > 0 THEN
    v_royalty := ROUND(v_amount * v_royalty_pct / 100.0, 8);
  END IF;
  v_seller_gets := v_amount - v_royalty;

  UPDATE profiles SET balance = balance - v_amount    WHERE id = v_bidder_id;
  UPDATE profiles SET balance = balance + v_seller_gets WHERE id = v_uid;

  IF v_royalty > 0 AND v_creator_id IS NOT NULL AND v_creator_id <> v_bidder_id THEN
    UPDATE profiles SET balance = balance + v_royalty WHERE id = v_creator_id;
  END IF;

  INSERT INTO nft_ownership (nft_id, owner_id)
  VALUES (v_nft_id, v_bidder_id)
  ON CONFLICT (nft_id) DO UPDATE SET owner_id = EXCLUDED.owner_id;

  UPDATE nfts SET status = 'buy-now' WHERE id = v_nft_id;
  UPDATE nft_bids SET status = 'accepted' WHERE id = p_bid_id;
  UPDATE nft_bids SET status = 'rejected' WHERE nft_id = v_nft_id AND status = 'pending';

  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  SELECT v_bidder_id, v_nft_id, title, 'purchase', v_amount FROM nfts WHERE id = v_nft_id;
  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  SELECT v_uid, v_nft_id, title, 'sale', v_seller_gets FROM nfts WHERE id = v_nft_id;

  RETURN jsonb_build_object('success', true, 'net_received', v_seller_gets, 'royalty', v_royalty);
END;
$$;
GRANT EXECUTE ON FUNCTION accept_bid TO authenticated;

NOTIFY pgrst, 'reload schema';
