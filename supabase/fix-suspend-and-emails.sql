-- ============================================================
-- Artsorbit — Fix suspend feature + expose user emails
-- Run in Supabase SQL editor.
-- ============================================================

-- ── 1. Add is_suspended column to profiles ────────────────
-- Separates suspension from the role field so the role CHECK
-- constraint (user | admin) is no longer violated.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT FALSE;

-- ── 2. Rebuild admin_update_user with suspension support ──
CREATE OR REPLACE FUNCTION admin_update_user(
  p_user_id   UUID,
  p_role      TEXT    DEFAULT NULL,
  p_verified  BOOLEAN DEFAULT NULL,
  p_suspended BOOLEAN DEFAULT NULL
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  UPDATE profiles SET
    role         = COALESCE(p_role,      role),
    verified     = COALESCE(p_verified,  verified),
    is_suspended = COALESCE(p_suspended, is_suspended)
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;
GRANT EXECUTE ON FUNCTION admin_update_user TO authenticated;

-- ── 3. RPC: list user emails from auth.users (admin only) ─
CREATE OR REPLACE FUNCTION admin_list_user_emails()
RETURNS TABLE (id uuid, email text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_role text;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Admin only';
  END IF;
  RETURN QUERY SELECT u.id, u.email FROM auth.users u ORDER BY u.created_at DESC;
END;
$$;
GRANT EXECUTE ON FUNCTION admin_list_user_emails TO authenticated;

NOTIFY pgrst, 'reload schema';
