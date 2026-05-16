import Link            from "next/link";
import NFTCard         from "@/components/NFTCard";
import SectionHeading  from "@/components/SectionHeading";
import TopSellers      from "@/components/TopSellers";
import Footer          from "@/components/Footer";
import ScrollReveal    from "@/components/ScrollReveal";
import { createClient } from "@/lib/supabase/server";
import { ALL_NFTS }    from "@/lib/mockData";
import { rowToNftItem } from "@/lib/supabaseToNft";
import type { NFTItem } from "@/lib/mockData";

/* UUID pattern — 8-4-4-4-12 hex digits */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Fisher-Yates shuffle — server-safe (runs once per request, not cached) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Fetch live NFTs — respects admin-chosen featured hero ── */
async function fetchHomeNfts() {
  try {
    const sb  = await createClient();
    const sba = sb as any;

    /* Read admin-chosen featured NFT id (may be empty string) */
    const { data: featSetting } = await sba
      .from("platform_settings")
      .select("value")
      .eq("key", "featured_nft_id")
      .maybeSingle();
    const featuredId: string = featSetting?.value ?? "";

    /* Fetch approved NFTs — newest first (DB handles ordering) */
    const { data, error } = await sba
      .from("nfts")
      .select("*")
      .eq("mod_status", "approved")
      .order("created_at", { ascending: false })
      .limit(40);

    if (error || !data || (data as any[]).length === 0) throw new Error("empty");

    const items: NFTItem[] = (data as any[]).map((r) => rowToNftItem(r));

    /* Hero: admin-chosen or newest approved NFT */
    let hero      = items[0];
    let restItems = items.slice(1);

    if (UUID_RE.test(featuredId)) {
      const featIdx = items.findIndex((n) => n.id === featuredId);
      if (featIdx !== -1) {
        hero      = items[featIdx];
        restItems = items.filter((_, i) => i !== featIdx);
      }
    }

    /* New Items = 4 most recently created (restItems already newest-first from DB) */
    const newItems = restItems.slice(0, 4);

    /* Trending = shuffled random selection from the remaining pool.
       If fewer than 4 remain after new items, pull from the full rest list. */
    const trendingPool = restItems.slice(4).length >= 4
      ? restItems.slice(4)
      : restItems;
    const trending = shuffle(trendingPool).slice(0, 4);

    return { hero, trending, newItems };
  } catch { /* network error — use mock */ }

  return {
    hero:     ALL_NFTS[0],
    trending: shuffle([...ALL_NFTS.slice(1)]).slice(0, 4),
    newItems: ALL_NFTS.slice(0, 4),
  };
}

function gradient(nft: NFTItem) {
  return `linear-gradient(135deg, ${nft.art.stops[0]} 0%, ${nft.art.stops[1]} 100%)`;
}

/* ================================================================
   PAGE
   ================================================================ */
export default async function Home() {
  const { hero: HERO_NFT, trending: TRENDING, newItems: NEW_ITEMS } = await fetchHomeNfts();
  return (
    <>
      {/* ══════════════════════════════════════════════════
          HERO — above the fold, uses mount animations
         ══════════════════════════════════════════════════ */}
      <section className="hero-section hero-bg">
        <div className="container">
          <div className="hero-grid">

            {/* Left: copy */}
            <div className="hero-text stagger">

              <h1 className="text-display animate-fade-in-up">
                Discover &amp;&nbsp;Collect<br />
                <span className="gradient-text">Extraordinary</span> NFTs
              </h1>

              <p className="animate-fade-in-up" style={{ fontSize: "1.125rem", color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: "46ch" }}>
                The premier marketplace for rare digital art — curated creators,
                on-chain provenance, and frictionless trading from wallet to wallet.
              </p>

              <div className="hero-cta animate-fade-in-up">
                <Link href="/explore" className="btn btn-gradient btn-xl" style={{ borderRadius: "var(--radius-full)" }}>
                  Explore Collection
                </Link>
                <Link href="/explore?status=new" className="btn btn-secondary btn-xl" style={{ borderRadius: "var(--radius-full)" }}>
                  Start Creating
                </Link>
              </div>

              <div className="hero-stats animate-fade-in-up">
                {[
                  { v: "1K+",   l: "Artworks"   },
                  { v: "120+",  l: "Creators"   },
                  { v: "$3.2K", l: "Total Volume"},
                ].map((s) => (
                  <div key={s.l} className="hero-stat">
                    <div className="hero-stat__value">{s.v}</div>
                    <div className="hero-stat__label">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: featured NFT card */}
            <div className="featured-wrap animate-fade-in">
              <div className="featured-glow" aria-hidden />

              <div className="featured-card">

                <div className="featured-card__header">
                  <div className="featured-card__creator-row">
                    <div
                      className="avatar avatar-sm"
                      style={{ background: HERO_NFT.creator.gradient, borderRadius: "var(--radius-full)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                      aria-hidden
                    >
                      <span style={{ color: "#fff", fontSize: "0.5625rem", fontWeight: 700 }}>
                        {HERO_NFT.creator.name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="featured-card__creator-name">{HERO_NFT.creator.name}</p>
                      <p className="featured-card__creator-role">{HERO_NFT.creator.handle}</p>
                    </div>
                  </div>
                </div>

                {/* Artwork — clicking navigates to the detail page */}
                <Link href={`/nft/${HERO_NFT.id}`} className="featured-card__artwork" style={{ display: "block", position: "relative" }}>
                  {HERO_NFT.image_url ? (
                    <img
                      src={HERO_NFT.image_url}
                      alt={HERO_NFT.title}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ position: "absolute", inset: 0, background: gradient(HERO_NFT) }} />
                  )}
                </Link>

                <div className="featured-card__info">
                  <p className="featured-card__title">{HERO_NFT.title}</p>
                  <div className="featured-card__meta">
                    <div>
                      <p className="featured-card__meta-label">Current Bid</p>
                      <p className="featured-card__meta-value featured-card__meta-value--accent">
                        {HERO_NFT.price} ETH
                      </p>
                    </div>
                    <div>
                      <p className="featured-card__meta-label">Ends In</p>
                      <p className="featured-card__meta-value">4h 32m</p>
                    </div>
                  </div>
                  <Link href={`/nft/${HERO_NFT.id}`} className="btn btn-gradient" style={{ width: "100%", justifyContent: "center" }}>
                    Place Bid
                  </Link>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TRENDING NOW — scroll reveal
         ══════════════════════════════════════════════════ */}
      <section className="section">
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          <ScrollReveal>
            <SectionHeading
              label="Hot right now"
              title="Trending Now"
              highlight="Trending"
              subtitle="Top pieces climbing the charts — curated live from on-chain activity and collector demand."
              href="/explore"
            />
          </ScrollReveal>

          <div className="grid-nft">
            {TRENDING.map((nft, i) => (
              <ScrollReveal key={nft.id} delay={i * 90}>
                <NFTCard
                  href={`/nft/${nft.id}`}
                  title={nft.title}
                  creator={{ name: nft.creator.name }}
                  price={nft.price}
                  likes={nft.likes}
                  isLive={nft.isLive}
                  badge={nft.badge}
                  image={nft.image_url ?? undefined}
                  gradient={gradient(nft)}
                />
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          NEW ITEMS — scroll reveal
         ══════════════════════════════════════════════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          <ScrollReveal>
            <SectionHeading
              label="Fresh mints"
              title="New Items"
              highlight="New"
              subtitle="First looks at the latest works — minted in the last 24 hours and available for immediate purchase."
              href="/explore"
            />
          </ScrollReveal>

          <div className="grid-nft">
            {NEW_ITEMS.map((nft, i) => (
              <ScrollReveal key={nft.id} delay={i * 90}>
                <NFTCard
                  href={`/nft/${nft.id}`}
                  title={nft.title}
                  creator={{ name: nft.creator.name }}
                  price={nft.price}
                  likes={nft.likes}
                  isLive={nft.isLive}
                  badge={nft.badge}
                  image={nft.image_url ?? undefined}
                  gradient={gradient(nft)}
                />
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TOP SELLERS — scroll reveal
         ══════════════════════════════════════════════════ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

          <ScrollReveal>
            <SectionHeading
              label="Last 30 days"
              title="Top Sellers"
              highlight="Top"
              subtitle="Ranked by verified on-chain trading volume. Standings refresh every 24 hours."
              href="/rankings"
            />
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <TopSellers />
          </ScrollReveal>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CALL-TO-ACTION BANNER — scroll reveal
         ══════════════════════════════════════════════════ */}
      <section className="section-sm">
        <div className="container">
          <ScrollReveal>
            <div
              className="gradient-border"
              style={{
                background: "var(--bg-surface)",
                padding: "clamp(2rem, 5vw, 3.5rem)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "1.5rem",
                textAlign: "center",
                borderRadius: "var(--radius-2xl)",
              }}
            >
              <p className="text-label">Join 38 000+ creators</p>
              <h2 className="text-headline" style={{ maxWidth: "18ch" }}>
                Ready to mint your <span className="gradient-text">first piece?</span>
              </h2>
              <p className="text-body" style={{ maxWidth: "48ch" }}>
                Upload your artwork, set your price, and reach a global audience of
                serious collectors — all in under five minutes.
              </p>
              <div style={{ display: "flex", gap: "0.875rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link href="/create" className="btn btn-gradient btn-lg" style={{ borderRadius: "var(--radius-full)" }}>
                  Start Minting
                </Link>
                <Link href="/explore" className="btn btn-secondary btn-lg" style={{ borderRadius: "var(--radius-full)" }}>
                  Browse the Market
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Footer />
    </>
  );
}
