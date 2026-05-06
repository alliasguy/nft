-- ============================================================
-- Artsorbit — Fix withdrawal flow
--
-- Problem: balance was checked & deducted at admin approval time,
-- meaning it could fail if the user spent funds after requesting.
--
-- Fix: deduct balance at REQUEST time (funds are locked immediately).
-- Admin approval just marks the record complete — no balance check needed.
-- Rejection refunds the full amount back to the user.
-- ============================================================

-- ── 1. request_withdrawal — replaces direct table insert ──
-- Checks balance, deducts it immediately, creates the pending request.
CREATE OR REPLACE FUNCTION request_withdrawal(
  p_amount     NUMERIC,
  p_to_address TEXT
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid     UUID    := auth.uid();
  v_balance NUMERIC;
  v_min_wd  NUMERIC := 0.01;
BEGIN
  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be greater than zero');
  END IF;

  -- Read minimum withdrawal setting
  SELECT COALESCE(NULLIF(value, ''), '0.01')::NUMERIC INTO v_min_wd
  FROM platform_settings WHERE key = 'min_withdrawal_eth';

  IF p_amount < v_min_wd THEN
    RETURN json_build_object('success', false, 'error',
      'Amount is below the minimum withdrawal of ' || v_min_wd || ' ETH');
  END IF;

  -- Lock and check user balance
  SELECT balance INTO v_balance FROM profiles WHERE id = v_uid FOR UPDATE;

  IF v_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Profile not found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN json_build_object(
      'success', false,
      'error',   'Insufficient balance',
      'balance', v_balance
    );
  END IF;

  -- Deduct immediately — funds are now locked pending admin processing
  UPDATE profiles SET balance = balance - p_amount WHERE id = v_uid;

  -- Create the pending request
  INSERT INTO withdrawal_requests (user_id, amount, to_address, status)
  VALUES (v_uid, p_amount, p_to_address, 'pending');

  -- Log activity
  INSERT INTO activity_log (user_id, nft_id, nft_title, event_type, amount)
  VALUES (v_uid, NULL, NULL, 'sale', p_amount);

  RETURN json_build_object(
    'success',     true,
    'new_balance', v_balance - p_amount
  );
END;
$$;
GRANT EXECUTE ON FUNCTION request_withdrawal TO authenticated;

-- ── 2. complete_withdrawal — admin marks as sent ───────────
-- Balance was already deducted at request time.
-- This just marks the record complete — no balance check needed.
CREATE OR REPLACE FUNCTION complete_withdrawal(p_withdrawal_id UUID)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  UPDATE withdrawal_requests
  SET status = 'completed', processed_at = NOW()
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Not found or already processed');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION complete_withdrawal TO authenticated;

-- ── 3. reject_withdrawal — admin rejects, refunds user ────
-- Refunds the locked amount back to the user's balance.
CREATE OR REPLACE FUNCTION reject_withdrawal(
  p_withdrawal_id UUID,
  p_note          TEXT DEFAULT ''
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role    TEXT;
  v_user_id UUID;
  v_amount  NUMERIC;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  SELECT user_id, amount INTO v_user_id, v_amount
  FROM withdrawal_requests
  WHERE id = p_withdrawal_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Not found or already processed');
  END IF;

  -- Refund the locked amount
  UPDATE profiles SET balance = balance + v_amount WHERE id = v_user_id;

  UPDATE withdrawal_requests
  SET status = 'rejected', admin_note = p_note, processed_at = NOW()
  WHERE id = p_withdrawal_id;

  RETURN json_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION reject_withdrawal TO authenticated;

NOTIFY pgrst, 'reload schema';
