-- ============================================================
-- Artsorbit — Complete Database Schema
-- ============================================================
-- Run this once in the Supabase SQL Editor:
--   Dashboard → SQL Editor → New query → paste → Run
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── PROFILES ──────────────────────────────────────────────
-- One row per authenticated user (auto-created on signup via trigger).
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name            TEXT NOT NULL,
  handle          TEXT UNIQUE NOT NULL,
  bio             TEXT,
  avatar_url      TEXT,
  wallet_address  TEXT,
  website         TEXT,
  twitter         TEXT,
  role            TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  verified        BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── COLLECTIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS collections (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  creator_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  floor_price   NUMERIC(18,8),
  total_volume  NUMERIC(18,8) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NFTS ──────────────────────────────────────────────────
-- creator_id is nullable so seeded rows don't require auth users.
CREATE TABLE IF NOT EXISTS nfts (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title            TEXT NOT NULL,
  description      TEXT,
  image_url        TEXT,
  art_shape        TEXT NOT NULL,
  art_stop_1       TEXT NOT NULL,
  art_stop_2       TEXT NOT NULL,
  creator_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  creator_name     TEXT NOT NULL,
  creator_handle   TEXT NOT NULL,
  creator_verified BOOLEAN NOT NULL DEFAULT false,
  creator_gradient TEXT,
  collection_id    UUID REFERENCES collections(id) ON DELETE SET NULL,
  collection_name  TEXT,
  price            NUMERIC(18,8) NOT NULL,
  usd_price        TEXT,
  token_id         TEXT,
  category         TEXT NOT NULL CHECK (category IN ('Art','Music','Photography','Gaming','Virtual Worlds')),
  status           TEXT NOT NULL DEFAULT 'buy-now' CHECK (status IN ('buy-now','auction','new')),
  likes_count      INTEGER NOT NULL DEFAULT 0,
  views_count      INTEGER NOT NULL DEFAULT 0,
  is_live          BOOLEAN NOT NULL DEFAULT false,
  badge            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NFT TRAITS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nft_traits (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nft_id        UUID REFERENCES nfts(id) ON DELETE CASCADE NOT NULL,
  label         TEXT NOT NULL,
  value         TEXT NOT NULL,
  rarity        TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- ── BIDS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bids (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nft_id          UUID REFERENCES nfts(id) ON DELETE CASCADE NOT NULL,
  bidder_id       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  bidder_name     TEXT NOT NULL,
  bidder_gradient TEXT,
  amount          NUMERIC(18,8) NOT NULL,
  usd_value       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NFT OWNERSHIP ─────────────────────────────────────────
-- One owner per NFT (current owner only — no transfer history here).
CREATE TABLE IF NOT EXISTS nft_ownership (
  nft_id          UUID REFERENCES nfts(id) ON DELETE CASCADE PRIMARY KEY,
  owner_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  purchase_price  NUMERIC(18,8),
  acquired_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── WATCHLIST ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS watchlist (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nft_id     UUID REFERENCES nfts(id)     ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, nft_id)
);

-- ── ACTIVITY LOG ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nft_id     UUID REFERENCES nfts(id)     ON DELETE SET NULL,
  nft_title  TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('purchase','bid','sale','like','list','follow','mint')),
  amount     NUMERIC(18,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS nfts_category_idx   ON nfts(category);
CREATE INDEX IF NOT EXISTS nfts_status_idx     ON nfts(status);
CREATE INDEX IF NOT EXISTS nfts_creator_idx    ON nfts(creator_id);
CREATE INDEX IF NOT EXISTS nfts_created_idx    ON nfts(created_at DESC);
CREATE INDEX IF NOT EXISTS bids_nft_idx        ON bids(nft_id);
CREATE INDEX IF NOT EXISTS bids_bidder_idx     ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS bids_created_idx    ON bids(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_user_idx   ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_nft_idx    ON activity_log(nft_id);
CREATE INDEX IF NOT EXISTS activity_created_idx ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS watchlist_user_idx  ON watchlist(user_id);

-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_traits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids          ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log  ENABLE ROW LEVEL SECURITY;

-- profiles: anyone can read; only the owner can write
CREATE POLICY "profiles_select"  ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update"  ON profiles FOR UPDATE USING  (auth.uid() = id);

-- collections: public read; authenticated users can create
CREATE POLICY "collections_select" ON collections FOR SELECT USING (true);
CREATE POLICY "collections_insert" ON collections FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "collections_update" ON collections FOR UPDATE USING (auth.uid() = creator_id);

-- nfts: public read; creator can insert/update
CREATE POLICY "nfts_select"  ON nfts FOR SELECT USING (true);
CREATE POLICY "nfts_insert"  ON nfts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "nfts_update"  ON nfts FOR UPDATE USING  (auth.uid() = creator_id);

-- traits: public read; inherits nft creator permission
CREATE POLICY "traits_select" ON nft_traits FOR SELECT USING (true);
CREATE POLICY "traits_insert" ON nft_traits FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT creator_id FROM nfts WHERE id = nft_id));

-- bids: public read; authenticated bidder can insert their own
CREATE POLICY "bids_select" ON bids FOR SELECT USING (true);
CREATE POLICY "bids_insert" ON bids FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = bidder_id);

-- ownership: public read; managed by service role (purchases)
CREATE POLICY "ownership_select" ON nft_ownership FOR SELECT USING (true);

-- watchlist: user manages their own rows only
CREATE POLICY "watchlist_crud" ON watchlist
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- activity: user reads their own log only
CREATE POLICY "activity_select" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_insert" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── AUTO-CREATE PROFILE ON SIGNUP ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_handle  TEXT;
  final_handle TEXT;
  suffix       INTEGER := 0;
BEGIN
  base_handle := LOWER(REGEXP_REPLACE(
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    '[^a-z0-9_]', '_', 'g'
  ));

  final_handle := base_handle;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE handle = final_handle) LOOP
    suffix       := suffix + 1;
    final_handle := base_handle || suffix::TEXT;
  END LOOP;

  INSERT INTO public.profiles (id, name, handle, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    final_handle,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ── UPDATED_AT TRIGGER ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ============================================================
-- To grant your account admin privileges after signing up:
--
--   UPDATE profiles SET role = 'admin'
--   WHERE handle = 'your_handle';
-- ============================================================
