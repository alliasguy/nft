-- ============================================================
-- NFTX — Admin Analytics RPC Functions
-- Run in Supabase SQL Editor
-- ============================================================

-- ── 1. Platform-wide KPI stats ────────────────────────────
CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role         TEXT;
  v_users        INTEGER;
  v_nfts         INTEGER;
  v_total_vol    NUMERIC;
  v_vol_24h      NUMERIC;
  v_vol_prev_24h NUMERIC;
  v_fee_pct      NUMERIC := 2;
  v_new_nfts_24h INTEGER;
  v_pending_dep  INTEGER;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN
    RETURN json_build_object('error', 'Admin access required');
  END IF;

  SELECT COUNT(*)                        INTO v_users        FROM profiles;
  SELECT COUNT(*)                        INTO v_nfts         FROM nfts;
  SELECT COALESCE(SUM(amount), 0)        INTO v_total_vol    FROM activity_log WHERE event_type = 'purchase';
  SELECT COALESCE(SUM(amount), 0)        INTO v_vol_24h      FROM activity_log
    WHERE event_type = 'purchase' AND created_at >= NOW() - INTERVAL '24 hours';
  SELECT COALESCE(SUM(amount), 0)        INTO v_vol_prev_24h FROM activity_log
    WHERE event_type = 'purchase'
      AND created_at >= NOW() - INTERVAL '48 hours'
      AND created_at <  NOW() - INTERVAL '24 hours';
  SELECT COALESCE(NULLIF(value,''),'2')::NUMERIC INTO v_fee_pct
    FROM platform_settings WHERE key = 'platform_fee_pct';
  SELECT COUNT(*)                        INTO v_new_nfts_24h FROM nfts
    WHERE created_at >= NOW() - INTERVAL '24 hours';
  SELECT COUNT(*)                        INTO v_pending_dep  FROM deposit_requests
    WHERE status = 'pending';

  RETURN json_build_object(
    'user_count',       v_users,
    'nft_count',        v_nfts,
    'total_volume_eth', v_total_vol,
    'volume_24h_eth',   v_vol_24h,
    'volume_prev_24h',  v_vol_prev_24h,
    'platform_fees_eth',ROUND(v_total_vol * v_fee_pct / 100, 6),
    'new_nfts_24h',     v_new_nfts_24h,
    'pending_deposits', v_pending_dep,
    'fee_pct',          v_fee_pct
  );
END;
$$;
GRANT EXECUTE ON FUNCTION get_admin_analytics TO authenticated;

-- ── 2. Top earners (by total sales revenue) ───────────────
CREATE OR REPLACE FUNCTION get_top_sellers(p_limit INTEGER DEFAULT 8)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RETURN '[]'::JSON; END IF;

  RETURN COALESCE(
    (SELECT json_agg(row_to_json(t))
     FROM (
       SELECT
         p.id,
         p.name,
         p.handle,
         COALESCE(p.creator_gradient,
           'linear-gradient(135deg,#00f5d4,#f15bb5)') AS gradient,
         COALESCE(SUM(al.amount), 0)                   AS volume
       FROM profiles p
       LEFT JOIN activity_log al
              ON al.user_id = p.id AND al.event_type = 'sale'
       GROUP BY p.id, p.name, p.handle, p.creator_gradient
       ORDER BY volume DESC
       LIMIT p_limit
     ) t),
    '[]'::JSON
  );
END;
$$;
GRANT EXECUTE ON FUNCTION get_top_sellers TO authenticated;

-- ── 3. Recent transactions (purchase + mint events) ───────
CREATE OR REPLACE FUNCTION get_recent_transactions(p_limit INTEGER DEFAULT 12)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RETURN '[]'::JSON; END IF;

  RETURN COALESCE(
    (SELECT json_agg(row_to_json(t))
     FROM (
       SELECT
         al.id,
         al.event_type,
         al.amount,
         al.nft_title,
         al.created_at,
         n.art_stop_1,
         n.art_stop_2,
         p.handle  AS user_handle,
         p.name    AS user_name
       FROM activity_log al
       LEFT JOIN nfts     n ON n.id = al.nft_id
       LEFT JOIN profiles p ON p.id = al.user_id
       WHERE al.event_type IN ('purchase', 'mint', 'sale')
       ORDER BY al.created_at DESC
       LIMIT p_limit
     ) t),
    '[]'::JSON
  );
END;
$$;
GRANT EXECUTE ON FUNCTION get_recent_transactions TO authenticated;

-- ── 4. Daily volume for bar chart ─────────────────────────
CREATE OR REPLACE FUNCTION get_daily_volume(p_days INTEGER DEFAULT 14)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  IF v_role != 'admin' THEN RETURN '[]'::JSON; END IF;

  RETURN COALESCE(
    (SELECT json_agg(row_to_json(t) ORDER BY t.day)
     FROM (
       SELECT
         DATE_TRUNC('day', created_at)::DATE             AS day,
         COALESCE(SUM(amount), 0)                        AS volume,
         COUNT(*)                                         AS tx_count
       FROM activity_log
       WHERE event_type = 'purchase'
         AND created_at >= NOW() - (p_days::TEXT || ' days')::INTERVAL
       GROUP BY DATE_TRUNC('day', created_at)::DATE
     ) t),
    '[]'::JSON
  );
END;
$$;
GRANT EXECUTE ON FUNCTION get_daily_volume TO authenticated;

-- ── Reload schema cache ────────────────────────────────────
NOTIFY pgrst, 'reload schema';
