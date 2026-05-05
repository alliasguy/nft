import { notFound }    from "next/navigation";
import Link             from "next/link";
import ArtworkSVG       from "@/components/ArtworkSVG";
import BuySection       from "@/components/BuySection";
import { createClient } from "@/lib/supabase/server";
import { ALL_NFTS }     from "@/lib/mockData";
import {
  rowToNftItem, mockIdToUUID, isUUID,
  type SupabaseTrait, type SupabaseBid,
} from "@/lib/supabaseToNft";

/* Allow dynamic params so newly-minted NFTs (UUID IDs) are renderable */
export const dynamicParams = true;

/* Pre-render the 16 seeded NFT pages at build time */
export async function generateStaticParams() {
  return ALL_NFTS.map((n) => ({ id: n.id }));
}

/* ── tiny shared icons ───────────────────────────────────── */
function IconShare() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}
function IconHeart() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function IconEth() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.5 5.25 12.375 12 16.5l6.75-4.125L12 1.5Z" opacity="0.85"/>
      <path d="M12 18 5.25 13.875 12 22.5l6.75-8.625L12 18Z"/>
    </svg>
  );
}
function IconVerified() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 2l2.4 3.2 4 .8-2.8 3.2.4 4-3.6-1.6-3.6 1.6.4-4L6.6 6l4-.8z"
        fill="#e11d48" stroke="#e11d48" strokeWidth="0.5"/>
      <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

/* ── page ────────────────────────────────────────────────── */
export default async function NFTDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  /* ── 1. Derive the Supabase UUID for this NFT ── */
  // Short IDs ("1"–"16") are from mock data; real minted NFTs use full UUIDs.
  const supabaseId = isUUID(id) ? id : mockIdToUUID(id);

  /* ── 2. Try Supabase first ── */
  let nft = null as ReturnType<typeof rowToNftItem> | null;

  if (supabaseId) {
    try {
      const sb = await createClient();
      const sba = sb as any;
      const [rowRes, traitRes, bidRes] = await Promise.all([
        sba.from("nfts").select("*").eq("id", supabaseId).single(),
        sba.from("nft_traits").select("*").eq("nft_id", supabaseId).order("display_order"),
        sba.from("bids").select("*").eq("nft_id", supabaseId).order("created_at", { ascending: false }),
      ]);
      if (rowRes.data) {
        nft = rowToNftItem(
          rowRes.data,
          (traitRes.data ?? []) as SupabaseTrait[],
          (bidRes.data  ?? []) as SupabaseBid[],
        );
      }
    } catch {
      /* Network error — fall through to mock */
    }
  }

  /* ── 3. Fall back to mock data ── */
  if (!nft) {
    const mock = ALL_NFTS.find((n) => n.id === id);
    if (mock) nft = mock;
  }

  if (!nft) notFound();

  const {
    title, art, creator, price, usd, description,
    category, status, likes, collection, tokenId,
    views, traits, bids, image_url,
  } = nft;

  const isAudio   = !!image_url?.match(/\.(mp3|wav|ogg|flac|aac|m4a)(\?|$)/i);
  const isAuction = status === "auction";

  return (
    <div className="container">
      {/* ── Back breadcrumb ── */}
      <div style={{ paddingTop: "clamp(1.5rem,4vw,2.5rem)" }}>
        <Link href="/explore" className="btn btn-ghost btn-sm"
          style={{ display: "inline-flex", gap: "0.375rem", paddingLeft: "0.5rem" }}>
          <IconArrowLeft /> Back to Explore
        </Link>
      </div>

      {/* ── Two-column layout ── */}
      <div className="detail-layout">

        {/* ════════════════════════════════════════
            LEFT — artwork + properties
            ════════════════════════════════════════ */}
        <div className="detail-artwork">

          {/* Large artwork frame — shows upload, audio player, or generated SVG */}
          <div className="detail-artwork__frame" style={{ position:"relative" }}>
            {image_url && !isAudio ? (
              /* Real uploaded image */
              <img
                src={image_url}
                alt={title}
                style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}
              />
            ) : image_url && isAudio ? (
              /* Audio NFT — show gradient art + player overlay */
              <>
                <ArtworkSVG shape={art.shape} stops={art.stops} />
                <div style={{
                  position:"absolute", bottom:0, left:0, right:0,
                  background:"rgba(0,0,0,0.75)", backdropFilter:"blur(12px)",
                  padding:"1rem 1.25rem",
                }}>
                  <p style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.08em",
                    textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"0.5rem" }}>
                    🎵 Audio NFT
                  </p>
                  <audio
                    controls
                    src={image_url}
                    style={{ width:"100%", height:"36px", accentColor:"var(--accent)" }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </>
            ) : (
              /* Generative SVG art */
              <ArtworkSVG shape={art.shape} stops={art.stops} />
            )}
          </div>

          {/* Action row */}
          <div className="detail-artwork__actions">
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              <IconShare /> Share
            </button>
            <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
              👁 {views.toLocaleString()} Views
            </button>
          </div>

          {/* ── Properties / Traits ── */}
          <div style={{ marginTop: "2rem" }}>
            <p className="detail-section__title" style={{ marginBottom: "0.875rem" }}>Properties</p>
            <div className="traits-grid">
              {traits.map((tr) => (
                <div key={tr.label} className="trait-card">
                  <p className="trait-card__label">{tr.label}</p>
                  <p className="trait-card__value">{tr.value}</p>
                  <p className="trait-card__rarity">{tr.rarity}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════
            RIGHT — metadata + buy + bids
            ════════════════════════════════════════ */}
        <div>

          {/* ── Creator + title ── */}
          <div className="detail-section" style={{ borderTop: "none", paddingTop: 0 }}>

            {/* Creator row */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.125rem" }}>
              <div
                className="avatar avatar-lg"
                style={{ background: creator.gradient, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                aria-hidden
              >
                <span style={{ color: "#fff", fontSize: "0.6875rem", fontWeight: 700 }}>
                  {creator.name.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.125rem" }}>
                  Created by
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.375rem" }}>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", fontSize: "1rem" }}>
                    {creator.name}
                  </span>
                  {creator.verified && <IconVerified />}
                </div>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>{creator.handle}</p>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-headline" style={{ marginBottom: "0.875rem", fontSize: "clamp(1.5rem,3vw,2.25rem)" }}>
              {title}
            </h1>

            {/* Meta badges */}
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className="badge badge-neutral">{category}</span>
              <span className="badge badge-neutral">{collection}</span>
              <span className="badge badge-neutral">Token #{tokenId}</span>
              {isAuction && (
                <span className="badge badge-accent">
                  <span className="nft-card__live-dot" />
                  &nbsp;Live Auction
                </span>
              )}
            </div>
          </div>

          {/* ── Buy Box (interactive Client Component) ── */}
          <div className="detail-section">
            <BuySection
              nftId={
                /* Real UUID → pass through; short mock ID ("1"–"16") → pad to seeded UUID */
                /^[0-9a-f]{8}-/i.test(id)
                  ? id
                  : `00000000-0000-0000-0000-${String(Math.max(1, parseInt(id, 10) || 1)).padStart(12, "0")}`
              }
              nftTitle={title}
              price={price}
              usd={usd}
              isAuction={isAuction}
              initialLikes={likes}
            />
          </div>

          {/* ── Description ── */}
          <div className="detail-section">
            <div className="detail-section__heading">
              <p className="detail-section__title">Description</p>
            </div>
            <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>
              {description}
            </p>
          </div>

          {/* ── Bid / Activity History ── */}
          <div className="detail-section">
            <div className="detail-section__heading">
              <p className="detail-section__title">Activity</p>
              <span className="badge badge-neutral">{bids.length} events</span>
            </div>

            <div className="bid-history">
              {bids.map((bid, i) => (
                <div key={i} className="bid-row">
                  {/* Bidder avatar */}
                  <div
                    className="bid-row__avatar"
                    style={{ background: bid.gradient }}
                    aria-hidden
                  >
                    {bid.bidder.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Event description */}
                  <div className="bid-row__info">
                    <p className="bid-row__event">
                      {i === 0 ? "Highest bid by" : "Bid placed by"}&nbsp;
                      <span className="bid-row__bidder">{bid.bidder}</span>
                    </p>
                    <p className="bid-row__time">{bid.time}</p>
                  </div>

                  {/* Amount */}
                  <div className="bid-row__amount">
                    <p className="bid-row__eth">{bid.amount} ETH</p>
                    <p className="bid-row__usd">${bid.usd}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
