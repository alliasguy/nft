-- ============================================================
-- NFTX — Supabase Storage Bucket for NFT Assets
-- Run in Supabase SQL Editor
-- ============================================================
-- Alternatively create via: Dashboard → Storage → New bucket
--   Name: nft-assets  |  Public bucket: ON  |  Max file size: 50MB
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'nft-assets',
  'nft-assets',
  true,          -- public read (NFT images must be viewable by anyone)
  52428800,      -- 50 MB per file
  ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
    'image/webp', 'image/svg+xml',
    'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
    'audio/mp4',  'audio/aac', 'audio/flac'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ── RLS Policies ──────────────────────────────────────────
-- Drop first so the script is safe to re-run
DROP POLICY IF EXISTS "nft-assets public read"  ON storage.objects;
DROP POLICY IF EXISTS "nft-assets auth upload"  ON storage.objects;
DROP POLICY IF EXISTS "nft-assets owner delete" ON storage.objects;

-- Public: anyone may read (download) files
CREATE POLICY "nft-assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'nft-assets');

-- Authenticated users may upload into their own sub-folder:
--   nft-assets/{user_id}/{filename}
CREATE POLICY "nft-assets auth upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id  = 'nft-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users may delete only their own files
CREATE POLICY "nft-assets owner delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id  = 'nft-assets'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

NOTIFY pgrst, 'reload schema';
