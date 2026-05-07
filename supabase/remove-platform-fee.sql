-- ============================================================
-- Artsorbit — Remove platform fee on sales (artists keep 100%)
-- Run in Supabase SQL editor.
-- ============================================================

-- Set fee to 0 in platform_settings.
-- All RPCs (purchase_nft_internal, accept_bid, relist_nft) read from
-- here — setting this to '0' makes v_fee = 0 and v_net = full price
-- without touching any RPC code.
UPDATE platform_settings
SET value = '0'
WHERE key = 'platform_fee_pct';

NOTIFY pgrst, 'reload schema';
