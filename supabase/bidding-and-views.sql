-- ============================================================
-- Artsorbit — Bidding system + NFT view tracking
-- Run in Supabase SQL editor.
-- ============================================================

-- ── 1. nft_bids table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS nft_bids (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nft_id     uuid NOT NULL REFERENCES nfts(id)     ON DELETE CASCADE,
  bidder_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount     numeric(18,8) NOT NULL CHECK (amount > 0),
  status     text NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending','accepted','rejected','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- One active pending bid per user per NFT
CREATE UNIQUE INDEX IF NOT EXISTS nft_bids_one_pending
ON nft_bids (nft_id, bidder_id) WHERE status = 'pending';

ALTER TABLE nft_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bids_select" ON nft_bids;
CREATE POLICY "bids_select" ON nft_bids
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "bids_insert" ON nft_bids;
CREATE POLICY "bids_insert" ON nft_bids
  FOR INSERT TO authenticated WITH CHECK (bidder_id = auth.uid());

-- ── 2. nft_views table ────────────────────────────────────
CREATE TABLE IF NOT EXISTS nft_views (
  nft_id      uuid NOT NULL REFERENCES nfts(id) ON DELETE CASCADE,
  viewer_hash text NOT NULL,
  viewed_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (nft_id, viewer_hash)
);

ALTER TABLE nft_views ENABLE ROW LEVEL SECURITY;

-- ── 3. place_bid ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION place_bid(p_nft_id uuid, p_amount numeric)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid        uuid    := auth.uid();
  v_balance    numeric;
  v_nft_status text;
  v_current_owner uuid;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- NFT must exist, be approved, and be an auction
  SELECT status INTO v_nft_status FROM nfts
  WHERE id = p_nft_id AND mod_status = 'approved';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NFT not found');
  END IF;
  IF v_nft_status <> 'auction' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This NFT is not accepting bids');
  END IF;

  -- Cannot bid on your own NFT
  SELECT COALESCE(
    (SELECT owner_id   FROM nft_ownership WHERE nft_id = p_nft_id),
    (SELECT creator_id FROM nfts           WHERE id    = p_nft_id)
  ) INTO v_current_owner;

  IF v_current_owner = v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot bid on your own NFT');
  END IF;

  -- Balance check
  SELECT balance INTO v_balance FROM profiles WHERE id = v_uid FOR UPDATE;
  IF v_balance < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Replace any existing pending bid from this user on this NFT
  DELETE FROM nft_bids WHERE nft_id = p_nft_id AND bidder_id = v_uid AND status = 'pending';

  INSERT INTO nft_bids (nft_id, bidder_id, amount)
  VALUES (p_nft_id, v_uid, p_amount);

  -- Log activity
  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  SELECT v_uid, p_nft_id, title, 'bid', p_amount FROM nfts WHERE id = p_nft_id;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION place_bid TO authenticated;

-- ── 4. accept_bid ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION accept_bid(p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid        uuid    := auth.uid();
  v_nft_id     uuid;
  v_bidder_id  uuid;
  v_amount     numeric;
  v_bidder_bal numeric;
  v_owner      uuid;
  v_fee_pct    numeric := 2;
  v_fee        numeric;
  v_net        numeric;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get bid
  SELECT nft_id, bidder_id, amount INTO v_nft_id, v_bidder_id, v_amount
  FROM nft_bids WHERE id = p_bid_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bid not found or already processed');
  END IF;

  -- Verify caller is the current NFT owner
  SELECT COALESCE(
    (SELECT owner_id   FROM nft_ownership WHERE nft_id = v_nft_id),
    (SELECT creator_id FROM nfts           WHERE id    = v_nft_id)
  ) INTO v_owner;
  IF v_owner IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the NFT owner can accept bids');
  END IF;

  -- Check bidder still has sufficient balance
  SELECT balance INTO v_bidder_bal FROM profiles WHERE id = v_bidder_id FOR UPDATE;
  IF v_bidder_bal < v_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bidder no longer has sufficient balance');
  END IF;

  -- Read platform fee
  SELECT COALESCE(NULLIF(value,''),'2')::numeric INTO v_fee_pct
  FROM platform_settings WHERE key = 'platform_fee_pct';
  v_fee := v_amount * (v_fee_pct / 100);
  v_net := v_amount - v_fee;

  -- Deduct from bidder
  UPDATE profiles SET balance = balance - v_amount WHERE id = v_bidder_id;

  -- Credit seller (net of fee)
  UPDATE profiles SET balance = balance + v_net WHERE id = v_uid;

  -- Transfer ownership
  INSERT INTO nft_ownership (nft_id, owner_id)
  VALUES (v_nft_id, v_bidder_id)
  ON CONFLICT (nft_id) DO UPDATE SET owner_id = EXCLUDED.owner_id;

  -- Close the auction: set NFT to buy-now so new owner can relist as they choose
  UPDATE nfts SET status = 'buy-now' WHERE id = v_nft_id;

  -- Mark this bid as accepted, reject all others on this NFT
  UPDATE nft_bids SET status = 'accepted'  WHERE id = p_bid_id;
  UPDATE nft_bids SET status = 'rejected'  WHERE nft_id = v_nft_id AND status = 'pending';

  -- Activity log for both parties
  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  SELECT v_bidder_id, v_nft_id, title, 'purchase', v_amount FROM nfts WHERE id = v_nft_id;

  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  SELECT v_uid, v_nft_id, title, 'sale', v_net FROM nfts WHERE id = v_nft_id;

  RETURN jsonb_build_object('success', true, 'net_received', v_net, 'fee', v_fee);
END;
$$;
GRANT EXECUTE ON FUNCTION accept_bid TO authenticated;

-- ── 5. reject_bid (owner dismisses a single bid) ──────────
CREATE OR REPLACE FUNCTION reject_bid(p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_uid    uuid := auth.uid();
  v_nft_id uuid;
  v_owner  uuid;
BEGIN
  SELECT nft_id INTO v_nft_id FROM nft_bids WHERE id = p_bid_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bid not found');
  END IF;

  SELECT COALESCE(
    (SELECT owner_id   FROM nft_ownership WHERE nft_id = v_nft_id),
    (SELECT creator_id FROM nfts           WHERE id    = v_nft_id)
  ) INTO v_owner;
  IF v_owner IS DISTINCT FROM v_uid THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not the NFT owner');
  END IF;

  UPDATE nft_bids SET status = 'rejected' WHERE id = p_bid_id;
  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION reject_bid TO authenticated;

-- ── 6. withdraw_bid (bidder cancels their own bid) ────────
CREATE OR REPLACE FUNCTION withdraw_bid(p_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE nft_bids SET status = 'withdrawn'
  WHERE id = p_bid_id AND bidder_id = auth.uid() AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bid not found or cannot be withdrawn');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION withdraw_bid TO authenticated;

-- ── 7. record_nft_view ────────────────────────────────────
CREATE OR REPLACE FUNCTION record_nft_view(p_nft_id uuid, p_viewer_hash text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_inserted int;
BEGIN
  INSERT INTO nft_views (nft_id, viewer_hash)
  VALUES (p_nft_id, p_viewer_hash)
  ON CONFLICT (nft_id, viewer_hash) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;
  IF v_inserted > 0 THEN
    UPDATE nfts SET views_count = views_count + 1 WHERE id = p_nft_id;
  END IF;
END;
$$;
-- Allow both anon and authenticated viewers
GRANT EXECUTE ON FUNCTION record_nft_view TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
