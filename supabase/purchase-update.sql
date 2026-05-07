-- ============================================================
-- Artsorbit — Purchase & Mint RPC Updates
-- Run in Supabase SQL Editor after wallet-system.sql
-- ============================================================

-- ── 1. Updated purchase_nft_internal ─────────────────────
-- Now credits the seller's internal balance (minus platform fee)
-- instead of just deducting from the buyer.
CREATE OR REPLACE FUNCTION purchase_nft_internal(p_nft_id UUID, p_price NUMERIC)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID    := auth.uid();
  v_buyer_bal  NUMERIC;
  v_seller_id  UUID;
  v_fee_pct    NUMERIC := 2;
  v_fee        NUMERIC;
  v_net        NUMERIC;
  v_nft_title  TEXT;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;

  -- Fetch platform fee percentage
  SELECT COALESCE(NULLIF(value,''),'2')::NUMERIC INTO v_fee_pct
  FROM platform_settings WHERE key = 'platform_fee_pct';

  -- Lock and read buyer balance
  SELECT balance INTO v_buyer_bal FROM profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','User not found');
  END IF;
  IF v_buyer_bal < p_price THEN
    RETURN json_build_object(
      'success', false, 'error', 'Insufficient balance',
      'balance', v_buyer_bal, 'required', p_price
    );
  END IF;

  -- Get NFT title for activity log
  SELECT title INTO v_nft_title FROM nfts WHERE id = p_nft_id;

  -- Find current owner (someone who bought it previously)
  SELECT owner_id INTO v_seller_id FROM nft_ownership WHERE nft_id = p_nft_id;
  -- If never sold before, seller is the creator
  IF v_seller_id IS NULL THEN
    SELECT creator_id INTO v_seller_id FROM nfts WHERE id = p_nft_id;
  END IF;

  -- Calculate fee and seller net
  v_fee := ROUND(p_price * v_fee_pct / 100.0, 8);
  v_net := p_price - v_fee;

  -- Deduct from buyer
  UPDATE profiles SET balance = balance - p_price WHERE id = v_uid;

  -- Credit seller (only if seller exists, is different from buyer, and has a profile)
  IF v_seller_id IS NOT NULL AND v_seller_id <> v_uid THEN
    UPDATE profiles SET balance = balance + v_net WHERE id = v_seller_id;
    -- Record sale activity for seller
    INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
    VALUES (v_seller_id, p_nft_id, v_nft_title, 'sale', v_net);
  END IF;

  -- Transfer ownership to buyer
  INSERT INTO nft_ownership (nft_id, owner_id, purchase_price)
  VALUES (p_nft_id, v_uid, p_price)
  ON CONFLICT (nft_id) DO UPDATE SET
    owner_id       = EXCLUDED.owner_id,
    purchase_price = EXCLUDED.purchase_price,
    acquired_at    = NOW();

  -- Record purchase activity for buyer
  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  VALUES (v_uid, p_nft_id, v_nft_title, 'purchase', p_price);

  RETURN json_build_object(
    'success',         true,
    'new_balance',     v_buyer_bal - p_price,
    'fee_charged',     v_fee,
    'seller_credited', v_net,
    'seller_id',       v_seller_id
  );
END;
$$;
GRANT EXECUTE ON FUNCTION purchase_nft_internal TO authenticated;

-- ── 2. mint_nft_internal ──────────────────────────────────
-- Creates a new NFT entry, deducts the minting fee from the
-- creator's internal balance. No external wallet needed.
CREATE OR REPLACE FUNCTION mint_nft_internal(
  p_title           TEXT,
  p_description     TEXT,
  p_art_shape       TEXT,
  p_art_stop_1      TEXT,
  p_art_stop_2      TEXT,
  p_price           NUMERIC,
  p_category        TEXT,
  p_status          TEXT    DEFAULT 'buy-now',
  p_collection_name TEXT    DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID    := auth.uid();
  v_balance    NUMERIC;
  v_mint_fee   NUMERIC := 0.15;
  v_nft_id     UUID;
  v_handle     TEXT;
  v_name       TEXT;
  v_token_num  INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;

  -- Fetch minting fee from settings
  SELECT COALESCE(NULLIF(value,''),'0.15')::NUMERIC INTO v_mint_fee
  FROM platform_settings WHERE key = 'minting_fee_eth';

  -- Lock and read creator profile
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

  -- Generate sequential token ID for this creator
  SELECT COUNT(*) + 1 INTO v_token_num FROM nfts WHERE creator_id = v_uid;

  -- Deduct minting fee
  UPDATE profiles SET balance = balance - v_mint_fee WHERE id = v_uid;

  -- Insert the NFT
  INSERT INTO nfts (
    title, description,
    art_shape, art_stop_1, art_stop_2,
    creator_id, creator_name, creator_handle, creator_verified, creator_gradient,
    collection_name,
    price, usd_price, token_id,
    category, status,
    likes_count, views_count, is_live
  ) VALUES (
    p_title, p_description,
    p_art_shape, p_art_stop_1, p_art_stop_2,
    v_uid, v_name, '@' || v_handle, false,
    'linear-gradient(135deg,' || p_art_stop_1 || ',' || p_art_stop_2 || ')',
    p_collection_name,
    p_price, NULL, LPAD(v_token_num::TEXT, 3, '0'),
    p_category, p_status,
    0, 0, false
  )
  RETURNING id INTO v_nft_id;

  -- Record mint activity
  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  VALUES (v_uid, v_nft_id, p_title, 'mint', v_mint_fee);

  RETURN json_build_object(
    'success',     true,
    'nft_id',      v_nft_id,
    'fee_paid',    v_mint_fee,
    'new_balance', v_balance - v_mint_fee
  );
END;
$$;
GRANT EXECUTE ON FUNCTION mint_nft_internal TO authenticated;

-- ── Reload API schema cache ────────────────────────────────
NOTIFY pgrst, 'reload schema';
