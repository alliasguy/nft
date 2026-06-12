-- ── admin_direct_debit (admin only) ────────────────────────
-- Lets an admin manually deduct ETH from a user's balance, e.g.
-- to correct an accidental over-credit. Mirrors admin_direct_credit
-- but subtracts from the balance and logs the adjustment as a
-- completed withdrawal for audit purposes.

CREATE OR REPLACE FUNCTION admin_direct_debit(
  p_user_id UUID,
  p_amount  NUMERIC,
  p_note    TEXT DEFAULT ''
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role        TEXT;
  v_balance     NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('success',false,'error','Admin access required');
  END IF;

  IF p_amount <= 0 THEN
    RETURN json_build_object('success',false,'error','Amount must be greater than 0');
  END IF;

  SELECT balance INTO v_balance FROM profiles WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success',false,'error','User not found');
  END IF;

  IF v_balance < p_amount THEN
    RETURN json_build_object('success',false,'error','User balance is lower than the debit amount');
  END IF;

  UPDATE profiles
    SET balance = balance - p_amount
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;

  -- Log as a completed withdrawal for audit trail (admin-initiated, no destination address)
  INSERT INTO withdrawal_requests (user_id, amount, to_address, status, admin_note, processed_at)
  VALUES (
    p_user_id,
    p_amount,
    'Admin adjustment',
    'completed',
    CASE WHEN p_note != '' THEN 'Direct admin debit — ' || p_note ELSE 'Direct admin debit' END,
    NOW()
  );

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_direct_debit TO authenticated;

NOTIFY pgrst, 'reload schema';
