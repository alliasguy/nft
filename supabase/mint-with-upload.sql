-- ============================================================
-- Artsorbit — Update mint_nft_internal to accept image_url
-- Run AFTER storage.sql
-- ============================================================

-- Drop ALL existing overloads of mint_nft_internal so the
-- CREATE OR REPLACE below is unambiguous.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure AS sig
    FROM   pg_proc
    WHERE  proname = 'mint_nft_internal'
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
  p_image_url       TEXT    DEFAULT NULL   -- uploaded file URL (nullable)
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        UUID    := auth.uid();
  v_balance    NUMERIC;
  v_mint_fee   NUMERIC := 0.05;
  v_nft_id     UUID;
  v_handle     TEXT;
  v_name       TEXT;
  v_token_num  INTEGER;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;

  SELECT COALESCE(NULLIF(value,''),'0.05')::NUMERIC INTO v_mint_fee
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
    image_url
  ) VALUES (
    p_title, p_description,
    p_art_shape, p_art_stop_1, p_art_stop_2,
    v_uid, v_name, '@' || v_handle, false,
    'linear-gradient(135deg,' || p_art_stop_1 || ',' || p_art_stop_2 || ')',
    p_collection_name,
    p_price, NULL, LPAD(v_token_num::TEXT, 3, '0'),
    p_category, p_status,
    0, 0, false,
    p_image_url   -- nullable — NULL means generative SVG art
  )
  RETURNING id INTO v_nft_id;

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
NOTIFY pgrst, 'reload schema';
