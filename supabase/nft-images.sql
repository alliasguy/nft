-- ============================================================
-- Artsorbit — NFT Artwork Images (Generative Abstract Art)
-- Run in Supabase SQL Editor
-- ============================================================
-- Uses DiceBear generative art API — creates unique, abstract,
-- geometric compositions based on a seed string. No two seeds
-- produce the same image. Looks exactly like premium NFT art.
--
-- Styles used:
--   shapes    → abstract geometric compositions (primary — most artistic)
--   pixel-art → pixel character art (gaming / retro NFTs)
--   bottts    → futuristic robot / circuit art (tech NFTs)
--   identicon → geometric grid patterns (matrix / data NFTs)
-- ============================================================

-- Genesis Bloom #001 — Art
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=genesis-bloom&size=480&backgroundColor=0d0d18'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Hexel Protocol #11 — Art
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=hexel-protocol-nft&size=480&backgroundColor=10001a'
WHERE id = '00000000-0000-0000-0000-000000000002';

-- Grid Nexus #07 — Art (identicon for grid theme)
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/identicon/png?seed=grid-nexus-07&size=480&backgroundColor=000a18'
WHERE id = '00000000-0000-0000-0000-000000000003';

-- Sonic Drift #29 — Music
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=sonic-drift-music&size=480&backgroundColor=18100a'
WHERE id = '00000000-0000-0000-0000-000000000004';

-- Radiant Core #03 — Art
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=radiant-core-stellar&size=480&backgroundColor=001218'
WHERE id = '00000000-0000-0000-0000-000000000005';

-- Circuit Sage #88 — Virtual Worlds (bottts for circuit/tech)
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/bottts/png?seed=circuit-sage-88&size=480&backgroundColor=08001a'
WHERE id = '00000000-0000-0000-0000-000000000006';

-- Sol Orbit #003 — Virtual Worlds
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=sol-orbit-kepler&size=480&backgroundColor=180800'
WHERE id = '00000000-0000-0000-0000-000000000007';

-- Prism Break #19 — Photography
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=prism-break-light&size=480&backgroundColor=120018'
WHERE id = '00000000-0000-0000-0000-000000000008';

-- Plasma Gate #44 — Art
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=plasma-gate-corona&size=480&backgroundColor=00081a'
WHERE id = '00000000-0000-0000-0000-000000000009';

-- Wave Rider #55 — Music
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=wave-rider-pacific&size=480&backgroundColor=1a0808'
WHERE id = '00000000-0000-0000-0000-000000000010';

-- Burst Nova #12 — Gaming (pixel-art for retro gaming)
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/pixel-art/png?seed=burst-nova-game&size=480&backgroundColor=0a0018'
WHERE id = '00000000-0000-0000-0000-000000000011';

-- Gold Rush #99 — Art
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=gold-rush-lattice&size=480&backgroundColor=180e00'
WHERE id = '00000000-0000-0000-0000-000000000012';

-- Teal Matrix #33 — Virtual Worlds (bottts for AI/neural theme)
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/bottts/png?seed=teal-matrix-neural&size=480&backgroundColor=001818'
WHERE id = '00000000-0000-0000-0000-000000000013';

-- Pink Haze #77 — Photography
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=pink-haze-schlieren&size=480&backgroundColor=1a0012'
WHERE id = '00000000-0000-0000-0000-000000000014';

-- Crystal Prism #44 — Art
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=crystal-prism-refract&size=480&backgroundColor=1a0e00'
WHERE id = '00000000-0000-0000-0000-000000000015';

-- Sound Wave #08 — Music
UPDATE nfts SET image_url =
  'https://api.dicebear.com/9.x/shapes/png?seed=sound-wave-beatforge&size=480&backgroundColor=1a0800'
WHERE id = '00000000-0000-0000-0000-000000000016';

-- ============================================================
-- Preview any image in your browser:
--   https://api.dicebear.com/9.x/shapes/png?seed=your-seed&size=480
--
-- Change style to: shapes | identicon | bottts | pixel-art
-- Change seed to any string to get a different composition.
--
-- To revert to gradients:  UPDATE nfts SET image_url = NULL;
-- ============================================================
