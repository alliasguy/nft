-- ============================================================
-- Artsorbit — Admin User Management RPC
-- Run in Supabase SQL Editor
-- ============================================================

-- Allows an admin to update any user's role or verified status.
-- Users cannot update each other's profiles via RLS — this
-- SECURITY DEFINER function bypasses that safely after
-- verifying the caller is an admin.
CREATE OR REPLACE FUNCTION admin_update_user(
  p_user_id  UUID,
  p_role     TEXT    DEFAULT NULL,
  p_verified BOOLEAN DEFAULT NULL
)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM profiles WHERE id = auth.uid();
  IF v_caller_role != 'admin' THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;

  UPDATE profiles SET
    role     = COALESCE(p_role,     role),
    verified = COALESCE(p_verified, verified)
  WHERE id = p_user_id;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION admin_update_user TO authenticated;

NOTIFY pgrst, 'reload schema';
