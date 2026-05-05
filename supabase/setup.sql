-- ============================================================
-- NFTX — Complete Setup  (schema + seed + grants)
-- ============================================================
-- Paste this ENTIRE file into:
--   Supabase Dashboard → SQL Editor → New query → Run
--
-- Safe to re-run: every statement uses IF NOT EXISTS / ON CONFLICT.
-- ============================================================

-- ── 1. EXTENSIONS ─────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 2. TABLES ─────────────────────────────────────────────

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

CREATE TABLE IF NOT EXISTS collections (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT,
  creator_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  floor_price   NUMERIC(18,8),
  total_volume  NUMERIC(18,8) NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS nft_traits (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  nft_id        UUID REFERENCES nfts(id) ON DELETE CASCADE NOT NULL,
  label         TEXT NOT NULL,
  value         TEXT NOT NULL,
  rarity        TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

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

CREATE TABLE IF NOT EXISTS nft_ownership (
  nft_id          UUID REFERENCES nfts(id) ON DELETE CASCADE PRIMARY KEY,
  owner_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  purchase_price  NUMERIC(18,8),
  acquired_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS watchlist (
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  nft_id     UUID REFERENCES nfts(id)     ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, nft_id)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  nft_id     UUID REFERENCES nfts(id)     ON DELETE SET NULL,
  nft_title  TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('purchase','bid','sale','like','list','follow','mint')),
  amount     NUMERIC(18,8),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. INDEXES ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS nfts_category_idx    ON nfts(category);
CREATE INDEX IF NOT EXISTS nfts_status_idx      ON nfts(status);
CREATE INDEX IF NOT EXISTS nfts_creator_idx     ON nfts(creator_id);
CREATE INDEX IF NOT EXISTS nfts_created_idx     ON nfts(created_at DESC);
CREATE INDEX IF NOT EXISTS bids_nft_idx         ON bids(nft_id);
CREATE INDEX IF NOT EXISTS bids_bidder_idx      ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS bids_created_idx     ON bids(created_at DESC);
CREATE INDEX IF NOT EXISTS activity_user_idx    ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS activity_nft_idx     ON activity_log(nft_id);
CREATE INDEX IF NOT EXISTS activity_created_idx ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS watchlist_user_idx   ON watchlist(user_id);

-- ── 4. ROW LEVEL SECURITY ─────────────────────────────────
ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections   ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_traits    ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids          ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_ownership ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log  ENABLE ROW LEVEL SECURITY;

-- Drop policies first so re-running is safe
DROP POLICY IF EXISTS "profiles_select"      ON profiles;
DROP POLICY IF EXISTS "profiles_insert"      ON profiles;
DROP POLICY IF EXISTS "profiles_update"      ON profiles;
DROP POLICY IF EXISTS "collections_select"   ON collections;
DROP POLICY IF EXISTS "collections_insert"   ON collections;
DROP POLICY IF EXISTS "collections_update"   ON collections;
DROP POLICY IF EXISTS "nfts_select"          ON nfts;
DROP POLICY IF EXISTS "nfts_insert"          ON nfts;
DROP POLICY IF EXISTS "nfts_update"          ON nfts;
DROP POLICY IF EXISTS "traits_select"        ON nft_traits;
DROP POLICY IF EXISTS "traits_insert"        ON nft_traits;
DROP POLICY IF EXISTS "bids_select"          ON bids;
DROP POLICY IF EXISTS "bids_insert"          ON bids;
DROP POLICY IF EXISTS "ownership_select"     ON nft_ownership;
DROP POLICY IF EXISTS "watchlist_crud"       ON watchlist;
DROP POLICY IF EXISTS "activity_select"      ON activity_log;
DROP POLICY IF EXISTS "activity_insert"      ON activity_log;

CREATE POLICY "profiles_select"    ON profiles    FOR SELECT USING (true);
CREATE POLICY "profiles_insert"    ON profiles    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update"    ON profiles    FOR UPDATE USING  (auth.uid() = id);

CREATE POLICY "collections_select" ON collections FOR SELECT USING (true);
CREATE POLICY "collections_insert" ON collections FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "collections_update" ON collections FOR UPDATE USING  (auth.uid() = creator_id);

CREATE POLICY "nfts_select"        ON nfts        FOR SELECT USING (true);
CREATE POLICY "nfts_insert"        ON nfts        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "nfts_update"        ON nfts        FOR UPDATE USING  (auth.uid() = creator_id);

CREATE POLICY "traits_select"      ON nft_traits  FOR SELECT USING (true);
CREATE POLICY "traits_insert"      ON nft_traits  FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT creator_id FROM nfts WHERE id = nft_id));

CREATE POLICY "bids_select"        ON bids        FOR SELECT USING (true);
CREATE POLICY "bids_insert"        ON bids        FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = bidder_id);

CREATE POLICY "ownership_select"   ON nft_ownership FOR SELECT USING (true);

CREATE POLICY "watchlist_crud"     ON watchlist
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "activity_select"    ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "activity_insert"    ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 5. GRANTS ─────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON collections, nfts, nft_traits, bids, nft_ownership, profiles TO anon;
GRANT SELECT ON collections, nfts, nft_traits, bids, nft_ownership, profiles TO authenticated;
GRANT INSERT, UPDATE ON profiles    TO authenticated;
GRANT INSERT         ON bids        TO authenticated;
GRANT INSERT, DELETE ON watchlist   TO authenticated;
GRANT INSERT         ON activity_log TO authenticated;
GRANT INSERT, UPDATE ON nfts        TO authenticated;
GRANT INSERT         ON nft_traits  TO authenticated;
GRANT INSERT, UPDATE ON nft_ownership TO authenticated;

-- ── 6. TRIGGERS ───────────────────────────────────────────
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

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- ── 7. SEED DATA ──────────────────────────────────────────

INSERT INTO collections (id, name, description, floor_price, total_volume) VALUES
  ('c0000001-0000-0000-0000-000000000001','Bloom Protocol',    'Generative geometry exploring emergence and entropy.',              0.95,48.2),
  ('c0000001-0000-0000-0000-000000000002','Nexus Series',      'Visual language of digital infrastructure.',                      1.80,32.8),
  ('c0000001-0000-0000-0000-000000000003','Sonic Series',      'Music visualised as on-chain art.',                               0.95,21.4),
  ('c0000001-0000-0000-0000-000000000004','Cosmos Series',     'Stellar nucleosynthesis through abstract generative art.',        3.20,14.6),
  ('c0000001-0000-0000-0000-000000000005','Silicon Dreams',    'Neural topology of distributed AI systems.',                      0.65,19.3),
  ('c0000001-0000-0000-0000-000000000006','Kepler Series',     'Exoplanet gravitational dances rendered as luminous paths.',      5.50,28.7),
  ('c0000001-0000-0000-0000-000000000007','Refraction',        'Light and optics transcribed into generative geometry.',          0.45,12.1),
  ('c0000001-0000-0000-0000-000000000008','Corona Series',     'Magnetic reconnection at stellar corona boundaries.',             4.80,22.5),
  ('c0000001-0000-0000-0000-000000000009','Pacific Series',    'Ocean-surface oscillation data from Oahu buoys.',                 2.10,16.4),
  ('c0000001-0000-0000-0000-000000000010','Metaversia Genesis','In-game artefacts from the open-world title Metaversia.',         0.80, 9.8),
  ('c0000001-0000-0000-0000-000000000011','Gold Lattice',      'Crystal growth patterns of real gold at 200x magnification.',    6.50,31.2),
  ('c0000001-0000-0000-0000-000000000012','AI Series',         'Neural topology of a distributed AI system.',                    1.95,18.9),
  ('c0000001-0000-0000-0000-000000000013','Schlieren Series',  'Long-exposure schlieren optics photography.',                    3.75,24.1),
  ('c0000001-0000-0000-0000-000000000014','BeatForge Records', 'Full unreleased EPs encoded as 4K visual waveforms.',            7.20,45.6)
ON CONFLICT (id) DO NOTHING;

INSERT INTO nfts (
  id,title,description,art_shape,art_stop_1,art_stop_2,
  creator_name,creator_handle,creator_verified,creator_gradient,
  collection_id,collection_name,price,usd_price,token_id,
  category,status,likes_count,views_count,is_live,badge
) VALUES
  ('00000000-0000-0000-0000-000000000001','Genesis Bloom #001','Genesis Bloom is the inaugural piece of the Bloom Protocol collection.','genesis','#e11d48','#c026d3','CryptoMaestro','@crypto_maestro',true,'linear-gradient(135deg,#e11d48,#c026d3)','c0000001-0000-0000-0000-000000000001','Bloom Protocol',12.5,'48,750','001','Art','auction',441,8420,true,NULL),
  ('00000000-0000-0000-0000-000000000002','Hexel Protocol #11','A tessellated lattice study exploring the tension between order and dissolution.','hex','#e11d48','#c026d3','0xArtist','@0x_artist',true,'linear-gradient(135deg,#e11d48,#f97316)',NULL,'Hexel Series',2.45,'9,555','011','Art','buy-now',127,2140,false,'Rare'),
  ('00000000-0000-0000-0000-000000000003','Grid Nexus #07','Grid Nexus explores the visual language of data infrastructure.','hex','#3b82f6','#06b6d4','DigitalDreamer','@digital_dreamer',false,'linear-gradient(135deg,#3b82f6,#06b6d4)','c0000001-0000-0000-0000-000000000002','Nexus Series',1.80,'7,020','007','Art','auction',89,1870,false,NULL),
  ('00000000-0000-0000-0000-000000000004','Sonic Drift #29','Sonic Drift translates frequency analysis from three unreleased tracks into visual waveform topographies.','wave','#f59e0b','#ef4444','WaveLabs','@wave_labs',true,'linear-gradient(135deg,#f59e0b,#ef4444)','c0000001-0000-0000-0000-000000000003','Sonic Series',0.95,'3,705','029','Music','buy-now',204,3210,false,'1 of 1'),
  ('00000000-0000-0000-0000-000000000005','Radiant Core #03','Radiant Core is an exploration of stellar nucleosynthesis through abstract generative art.','burst','#10b981','#3b82f6','0xCreator','@0x_creator',true,'linear-gradient(135deg,#10b981,#06b6d4)','c0000001-0000-0000-0000-000000000004','Cosmos Series',3.20,'12,480','003','Art','buy-now',56,980,false,'Featured'),
  ('00000000-0000-0000-0000-000000000006','Circuit Sage #88','A love letter to hand-etched PCB boards.','circuit','#8b5cf6','#ec4899','PixelMage','@pixel_mage',false,'linear-gradient(135deg,#8b5cf6,#ec4899)','c0000001-0000-0000-0000-000000000005','Silicon Dreams',0.65,'2,535','088','Virtual Worlds','auction',312,5670,true,NULL),
  ('00000000-0000-0000-0000-000000000007','Sol Orbit #003','Sol Orbit captures the gravitational dance of six exoplanets orbiting Kepler-442b.','orbit','#f97316','#fbbf24','SolarArtist','@solar_artist',true,'linear-gradient(135deg,#f97316,#fbbf24)','c0000001-0000-0000-0000-000000000006','Kepler Series',5.50,'21,450','003','Virtual Worlds','buy-now',441,7240,false,'Rare'),
  ('00000000-0000-0000-0000-000000000008','Prism Break #19','Prism Break deconstructs natural light refraction into discrete geometric events.','prism','#a855f7','#3b82f6','FractalLabs','@fractal_labs',false,'linear-gradient(135deg,#a855f7,#3b82f6)','c0000001-0000-0000-0000-000000000007','Refraction',1.15,'4,485','019','Photography','new',73,430,false,NULL),
  ('00000000-0000-0000-0000-000000000009','Plasma Gate #44','Plasma Gate portrays magnetic reconnection at a stellar corona boundary.','plasma','#0ea5e9','#6366f1','CathArt','@cath_art',true,'linear-gradient(135deg,#0ea5e9,#6366f1)','c0000001-0000-0000-0000-000000000008','Corona Series',4.80,'18,720','044','Art','buy-now',189,3880,false,'1 of 1'),
  ('00000000-0000-0000-0000-000000000010','Wave Rider #55','Wave Rider captures ocean-surface oscillation data from a buoy off Oahu.','wave','#e11d48','#f97316','NeonDreamer','@neon_dreamer',true,'linear-gradient(135deg,#e11d48,#f97316)','c0000001-0000-0000-0000-000000000009','Pacific Series',2.10,'8,190','055','Music','auction',167,2590,false,NULL),
  ('00000000-0000-0000-0000-000000000011','Burst Nova #12','Burst Nova is an in-game artefact from the upcoming open-world title Metaversia.','burst','#8b5cf6','#c026d3','0xCreative','@0x_creative',false,'linear-gradient(135deg,#8b5cf6,#c026d3)','c0000001-0000-0000-0000-000000000010','Metaversia Genesis',0.80,'3,120','012','Gaming','buy-now',98,1450,false,NULL),
  ('00000000-0000-0000-0000-000000000012','Gold Rush #99','Gold Rush is the 99th and final entry in the Gold Lattice series.','hex','#f59e0b','#f97316','GoldForge','@gold_forge',true,'linear-gradient(135deg,#f59e0b,#f97316)','c0000001-0000-0000-0000-000000000011','Gold Lattice',6.50,'25,350','099','Art','new',310,4120,false,'Final Drop'),
  ('00000000-0000-0000-0000-000000000013','Teal Matrix #33','Teal Matrix models the neural topology of a distributed AI system.','circuit','#06b6d4','#10b981','TealMind','@teal_mind',false,'linear-gradient(135deg,#06b6d4,#10b981)','c0000001-0000-0000-0000-000000000012','AI Series',1.95,'7,605','033','Virtual Worlds','auction',142,2030,false,NULL),
  ('00000000-0000-0000-0000-000000000014','Pink Haze #77','Pink Haze is a long-exposure composite captured through a homemade schlieren optics rig.','plasma','#ec4899','#f43f5e','RoseLab','@rose_lab',true,'linear-gradient(135deg,#ec4899,#f43f5e)','c0000001-0000-0000-0000-000000000013','Schlieren Series',3.75,'14,625','077','Photography','buy-now',277,4880,false,'Rare'),
  ('00000000-0000-0000-0000-000000000015','Crystal Prism #44','Crystal Prism is the entry-level piece in the Refraction Collection.','prism','#f59e0b','#a855f7','PrismStudio','@prism_studio',false,'linear-gradient(135deg,#f59e0b,#a855f7)','c0000001-0000-0000-0000-000000000007','Refraction',0.45,'1,755','044','Art','new',52,620,false,NULL),
  ('00000000-0000-0000-0000-000000000016','Sound Wave #08','Sound Wave #08 encodes an entire unreleased EP as a 4K visual waveform.','grid','#f59e0b','#ef4444','BeatForge','@beat_forge',true,'linear-gradient(135deg,#f59e0b,#ef4444)','c0000001-0000-0000-0000-000000000014','BeatForge Records',7.20,'28,080','008','Music','buy-now',389,6510,false,'Legendary')
ON CONFLICT (id) DO NOTHING;

INSERT INTO nft_traits (nft_id,label,value,rarity,display_order) VALUES
  ('00000000-0000-0000-0000-000000000001','Background','Deep Space','5% have this',0),
  ('00000000-0000-0000-0000-000000000001','Palette','Crimson-Magenta','8% have this',1),
  ('00000000-0000-0000-0000-000000000001','Energy','Transcendent','2% have this',2),
  ('00000000-0000-0000-0000-000000000001','Rarity','Legendary','1% have this',3),
  ('00000000-0000-0000-0000-000000000001','Edition','1 of 1','1% have this',4),
  ('00000000-0000-0000-0000-000000000001','Style','Generative','40% have this',5),
  ('00000000-0000-0000-0000-000000000002','Background','Nebula','12% have this',0),
  ('00000000-0000-0000-0000-000000000002','Palette','Crimson-Magenta','8% have this',1),
  ('00000000-0000-0000-0000-000000000002','Rarity','Rare','8% have this',2),
  ('00000000-0000-0000-0000-000000000002','Edition','1 of 10','10% have this',3),
  ('00000000-0000-0000-0000-000000000002','Style','Geometric','30% have this',4),
  ('00000000-0000-0000-0000-000000000003','Background','Void','18% have this',0),
  ('00000000-0000-0000-0000-000000000003','Palette','Azure-Cyan','15% have this',1),
  ('00000000-0000-0000-0000-000000000003','Rarity','Uncommon','20% have this',2),
  ('00000000-0000-0000-0000-000000000003','Edition','1 of 25','25% have this',3),
  ('00000000-0000-0000-0000-000000000004','Background','Starfield','10% have this',0),
  ('00000000-0000-0000-0000-000000000004','Palette','Gold-Red','12% have this',1),
  ('00000000-0000-0000-0000-000000000004','BPM','140','5% have this',2),
  ('00000000-0000-0000-0000-000000000004','Key','F# Minor','3% have this',3),
  ('00000000-0000-0000-0000-000000000004','Edition','1 of 1','1% have this',4),
  ('00000000-0000-0000-0000-000000000006','Background','Deep Space','5% have this',0),
  ('00000000-0000-0000-0000-000000000006','Palette','Violet-Pink','11% have this',1),
  ('00000000-0000-0000-0000-000000000006','Rarity','Rare','8% have this',2),
  ('00000000-0000-0000-0000-000000000006','Logic Gate','NAND Array','4% have this',3),
  ('00000000-0000-0000-0000-000000000007','Background','Solar Flare','4% have this',0),
  ('00000000-0000-0000-0000-000000000007','Palette','Orange-Gold','9% have this',1),
  ('00000000-0000-0000-0000-000000000007','Bodies','6 Planets','3% have this',2),
  ('00000000-0000-0000-0000-000000000007','Edition','1 of 3','3% have this',3),
  ('00000000-0000-0000-0000-000000000010','Background','Deep Space','5% have this',0),
  ('00000000-0000-0000-0000-000000000010','Palette','Crimson-Orange','7% have this',1),
  ('00000000-0000-0000-0000-000000000010','BPM','92','9% have this',2),
  ('00000000-0000-0000-0000-000000000010','Edition','1 of 20','20% have this',3),
  ('00000000-0000-0000-0000-000000000012','Background','Starfield','10% have this',0),
  ('00000000-0000-0000-0000-000000000012','Palette','Gold-Orange','9% have this',1),
  ('00000000-0000-0000-0000-000000000012','Rarity','Legendary','1% have this',2),
  ('00000000-0000-0000-0000-000000000012','Series No.','99 of 99','1% have this',3),
  ('00000000-0000-0000-0000-000000000016','Background','Deep Space','5% have this',0),
  ('00000000-0000-0000-0000-000000000016','Palette','Gold-Red','12% have this',1),
  ('00000000-0000-0000-0000-000000000016','Tracks','6','2% have this',2),
  ('00000000-0000-0000-0000-000000000016','License','Sync + Vinyl','1% have this',3)
ON CONFLICT DO NOTHING;

INSERT INTO bids (nft_id,bidder_name,bidder_gradient,amount,usd_value) VALUES
  ('00000000-0000-0000-0000-000000000001','CryptoMaestro','linear-gradient(135deg,#e11d48,#c026d3)',12.5,'48,750'),
  ('00000000-0000-0000-0000-000000000001','NeonDreamer',  'linear-gradient(135deg,#10b981,#3b82f6)',11.2,'43,680'),
  ('00000000-0000-0000-0000-000000000001','VoidWalker',   'linear-gradient(135deg,#f59e0b,#ef4444)', 9.8,'38,220'),
  ('00000000-0000-0000-0000-000000000001','PixelMage',    'linear-gradient(135deg,#8b5cf6,#ec4899)', 8.5,'33,150'),
  ('00000000-0000-0000-0000-000000000003','0xCreative',   'linear-gradient(135deg,#ec4899,#f43f5e)', 1.80,'7,020'),
  ('00000000-0000-0000-0000-000000000003','MetaForge',    'linear-gradient(135deg,#64748b,#334155)', 1.50,'5,850'),
  ('00000000-0000-0000-0000-000000000003','FractalLabs',  'linear-gradient(135deg,#a855f7,#3b82f6)', 1.20,'4,680'),
  ('00000000-0000-0000-0000-000000000006','SolarArtist',  'linear-gradient(135deg,#f97316,#fbbf24)', 0.65,'2,535'),
  ('00000000-0000-0000-0000-000000000006','CathArt',      'linear-gradient(135deg,#0ea5e9,#6366f1)', 0.48,'1,872'),
  ('00000000-0000-0000-0000-000000000006','MetaForge',    'linear-gradient(135deg,#64748b,#334155)', 0.32,'1,248'),
  ('00000000-0000-0000-0000-000000000010','VoidWalker',   'linear-gradient(135deg,#f59e0b,#ef4444)', 2.10,'8,190'),
  ('00000000-0000-0000-0000-000000000010','PixelMage',    'linear-gradient(135deg,#8b5cf6,#ec4899)', 1.85,'7,215'),
  ('00000000-0000-0000-0000-000000000010','SolarArtist',  'linear-gradient(135deg,#f97316,#fbbf24)', 1.60,'6,240'),
  ('00000000-0000-0000-0000-000000000010','CryptoMaestro','linear-gradient(135deg,#e11d48,#c026d3)', 1.30,'5,070'),
  ('00000000-0000-0000-0000-000000000013','DigitalNomad', 'linear-gradient(135deg,#3b82f6,#06b6d4)', 1.95,'7,605'),
  ('00000000-0000-0000-0000-000000000013','FractalLabs',  'linear-gradient(135deg,#a855f7,#3b82f6)', 1.70,'6,630'),
  ('00000000-0000-0000-0000-000000000013','WaveLabs',     'linear-gradient(135deg,#f59e0b,#ef4444)', 1.45,'5,655')
ON CONFLICT DO NOTHING;

-- ── 8. RELOAD API SCHEMA CACHE ────────────────────────────
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Done! All tables created, data seeded, grants applied.
--
-- After signing up, make yourself admin with:
--   UPDATE profiles SET role = 'admin' WHERE handle = 'your_handle';
-- ============================================================
