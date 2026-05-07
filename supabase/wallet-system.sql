-- ============================================================
-- Artsorbit — Internal Wallet System
-- Run in Supabase SQL Editor after setup.sql + likes-and-buy.sql
-- ============================================================

-- ── 1. Add balance columns to profiles ────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS balance         NUMERIC(18,8) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_balance NUMERIC(18,8) NOT NULL DEFAULT 0;

-- ── 2. Platform Settings (key-value store) ────────────────
CREATE TABLE IF NOT EXISTS platform_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO platform_settings (key, value) VALUES
  ('deposit_wallet_address', ''),   -- admin fills this in Settings
  ('minting_fee_eth',        '0.15'),
  ('min_withdrawal_eth',     '0.01'),
  ('platform_fee_pct',       '0')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_select" ON platform_settings;
DROP POLICY IF EXISTS "settings_update" ON platform_settings;
CREATE POLICY "settings_select" ON platform_settings FOR SELECT USING (true);
CREATE POLICY "settings_update" ON platform_settings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

GRANT SELECT              ON platform_settings TO anon, authenticated;
GRANT UPDATE              ON platform_settings TO authenticated;

-- ── 3. Deposit Requests ───────────────────────────────────
CREATE TABLE IF NOT EXISTS deposit_requests (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount       NUMERIC(18,8) NOT NULL CHECK (amount > 0),
  tx_hash      TEXT,           -- user-provided Ethereum tx hash
  from_address TEXT,           -- user's sending wallet address
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','approved','rejected')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS deposit_user_idx   ON deposit_requests(user_id);
CREATE INDEX IF NOT EXISTS deposit_status_idx ON deposit_requests(status);
CREATE INDEX IF NOT EXISTS deposit_date_idx   ON deposit_requests(created_at DESC);

ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "deposits_select" ON deposit_requests;
DROP POLICY IF EXISTS "deposits_insert" ON deposit_requests;
CREATE POLICY "deposits_select" ON deposit_requests FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "deposits_insert" ON deposit_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON deposit_requests TO authenticated;

-- ── 4. Withdrawal Requests ────────────────────────────────
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount       NUMERIC(18,8) NOT NULL CHECK (amount > 0),
  to_address   TEXT NOT NULL,  -- user's receiving ETH wallet
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','processing','completed','rejected')),
  admin_note   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS withdrawal_user_idx   ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS withdrawal_status_idx ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS withdrawal_date_idx   ON withdrawal_requests(created_at DESC);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "withdrawals_select" ON withdrawal_requests;
DROP POLICY IF EXISTS "withdrawals_insert" ON withdrawal_requests;
CREATE POLICY "withdrawals_select" ON withdrawal_requests FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "withdrawals_insert" ON withdrawal_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT ON withdrawal_requests TO authenticated;

-- ── 5. RPC: Purchase NFT (atomic balance deduction) ───────
CREATE OR REPLACE FUNCTION purchase_nft_internal(p_nft_id UUID, p_price NUMERIC)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid     UUID    := auth.uid();
  v_balance NUMERIC;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success',false,'error','Not authenticated');
  END IF;

  SELECT balance INTO v_balance FROM profiles WHERE id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','User not found');
  END IF;
  IF v_balance < p_price THEN
    RETURN json_build_object(
      'success', false, 'error', 'Insufficient balance',
      'balance', v_balance, 'required', p_price
    );
  END IF;

  UPDATE profiles     SET balance = balance - p_price WHERE id = v_uid;
  INSERT INTO nft_ownership (nft_id, owner_id, purchase_price)
  VALUES (p_nft_id, v_uid, p_price)
  ON CONFLICT (nft_id) DO UPDATE SET
    owner_id       = EXCLUDED.owner_id,
    purchase_price = EXCLUDED.purchase_price,
    acquired_at    = NOW();
  INSERT INTO activity_log (user_id, nft_id, event_type, amount)
  VALUES (v_uid, p_nft_id, 'purchase', p_price);

  RETURN json_build_object('success',true,'new_balance', v_balance - p_price);
END;
$$;
GRANT EXECUTE ON FUNCTION purchase_nft_internal TO authenticated;

-- ── 6. RPC: Approve Deposit (admin only) ──────────────────
CREATE OR REPLACE FUNCTION approve_deposit(p_deposit_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role    TEXT;
  v_user_id UUID;
  v_amount  NUMERIC;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM deposit_requests WHERE id = p_deposit_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','Not found or already processed');
  END IF;
  UPDATE deposit_requests
    SET status = 'approved', confirmed_at = NOW() WHERE id = p_deposit_id;
  UPDATE profiles
    SET balance = balance + v_amount WHERE id = v_user_id;
  RETURN json_build_object('success',true);
END;
$$;
GRANT EXECUTE ON FUNCTION approve_deposit TO authenticated;

-- ── 7. RPC: Reject Deposit (admin only) ───────────────────
CREATE OR REPLACE FUNCTION reject_deposit(p_deposit_id UUID, p_note TEXT DEFAULT '')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;
  UPDATE deposit_requests
    SET status = 'rejected', admin_note = p_note WHERE id = p_deposit_id AND status = 'pending';
  RETURN json_build_object('success',true);
END;
$$;
GRANT EXECUTE ON FUNCTION reject_deposit TO authenticated;

-- ── 8. RPC: Complete Withdrawal (admin — deducts balance) ─
CREATE OR REPLACE FUNCTION complete_withdrawal(p_withdrawal_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role    TEXT;
  v_user_id UUID;
  v_amount  NUMERIC;
  v_balance NUMERIC;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;
  SELECT user_id, amount INTO v_user_id, v_amount
  FROM withdrawal_requests WHERE id = p_withdrawal_id AND status = 'pending';
  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','Not found or already processed');
  END IF;
  SELECT balance INTO v_balance FROM profiles WHERE id = v_user_id FOR UPDATE;
  IF v_balance < v_amount THEN
    RETURN json_build_object('success',false,'error','User has insufficient balance');
  END IF;
  UPDATE profiles
    SET balance = balance - v_amount WHERE id = v_user_id;
  UPDATE withdrawal_requests
    SET status = 'completed', processed_at = NOW() WHERE id = p_withdrawal_id;
  RETURN json_build_object('success',true);
END;
$$;
GRANT EXECUTE ON FUNCTION complete_withdrawal TO authenticated;

-- ── 9. RPC: Reject Withdrawal (admin only) ────────────────
CREATE OR REPLACE FUNCTION reject_withdrawal(p_withdrawal_id UUID, p_note TEXT DEFAULT '')
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;
  UPDATE withdrawal_requests
    SET status = 'rejected', admin_note = p_note WHERE id = p_withdrawal_id AND status = 'pending';
  RETURN json_build_object('success',true);
END;
$$;
GRANT EXECUTE ON FUNCTION reject_withdrawal TO authenticated;

-- ── 10. Reload schema cache ───────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- After running this, go to Admin → Settings and set the
-- deposit wallet address so users can see where to send ETH.
-- ============================================================
