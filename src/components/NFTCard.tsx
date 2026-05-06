"use client";

import { useState, useCallback } from "react";
import Link                      from "next/link";
import { createClient }          from "@/lib/supabase/client";

export interface NFTCardProps {
  href?:     string;
  image?:    string;
  gradient?: string;
  title:     string;
  creator:   { name: string; avatar?: string };
  price:     string;
  currency?: string;
  badge?:    string;
  likes?:    number;
  isLive?:   boolean;
  /** True when the signed-in user owns this NFT (collected/created pages).
   *  Hides the Buy button and shows Sell / Relist controls instead. */
  isOwned?:  boolean;
}

/* ── Helpers ───────────────────────────────��─────────────── */

/**
 * Derive the Supabase UUID for a given NFT from its href.
 * - Real UUIDs (/nft/00000000-…) pass through unchanged.
 * - Short seeded IDs (/nft/1 … /nft/16) are converted to the
 *   padded UUID format used in setup.sql.
 */
function extractNftUUID(href?: string): string | null {
  if (!href) return null;
  const id = href.split("/").pop() ?? "";
  if (!id) return null;
  if (/^[0-9a-f]{8}-/i.test(id)) return id;         // already a UUID
  const n = parseInt(id, 10);
  if (!isNaN(n)) return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
  return id;
}

/* ── Icons ───────────────────────────────────────────────── */
function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function IconEth() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-label="ETH">
      <path d="M12 1.5 5.25 12.375 12 16.5l6.75-4.125L12 1.5Z" opacity="0.85" />
      <path d="M12 18 5.25 13.875 12 22.5l6.75-8.625L12 18Z" />
    </svg>
  );
}
function IconBuy() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ── Buy state machine ───────────────────────────────────── */
type BuyState = "idle" | "confirming" | "purchasing" | "purchased" | "error";

/* ── Component ───────────────────────────────────────────── */
/* ── Sell / relist state ─────────────────────────────── */
type SellState = "idle" | "listing" | "relisting" | "listed" | "error";

export default function NFTCard({
  href,
  image,
  gradient = "linear-gradient(135deg, #00f5d4 0%, #f15bb5 100%)",
  title,
  creator,
  price,
  currency = "ETH",
  badge,
  likes    = 0,
  isLive   = false,
  isOwned  = false,
}: NFTCardProps) {
  const nftUUID = extractNftUUID(href);

  /* Like state */
  const [liked,     setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [likeMsg,   setLikeMsg]   = useState<string | null>(null);

  /* Buy state (for non-owned cards) */
  const [buyState, setBuyState] = useState<BuyState>("idle");

  /* Sell/relist state (for owned cards) */
  const [sellState, setSellState]   = useState<SellState>("idle");
  const [sellPrice, setSellPrice]   = useState(price);
  const [sellType,  setSellType]    = useState<"buy-now"|"auction">("buy-now");
  const [sellErr,   setSellErr]     = useState("");

  /* ── Like toggle ── */
  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();

    const sb    = createClient();
    const { data: { user } } = await sb.auth.getUser();

    if (!user) {
      // Show inline prompt instead of hard-redirecting
      setLikeMsg("Log in to like");
      setTimeout(() => setLikeMsg(null), 2200);
      return;
    }

    // Optimistic update
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikeCount((c) => (nowLiked ? c + 1 : c - 1));

    if (!nftUUID) return;

    try {
      if (nowLiked) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (sb.from("nft_likes") as any).insert({ user_id: user.id, nft_id: nftUUID });
      } else {
        await sb.from("nft_likes").delete()
          .eq("user_id", user.id)
          .eq("nft_id", nftUUID);
      }
    } catch {
      // Revert on failure
      setLiked(!nowLiked);
      setLikeCount((c) => (nowLiked ? c - 1 : c + 1));
    }
  }, [liked, nftUUID]);

  /* ── Relist / sell ── */
  const handleRelist = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nftUUID) return;
    const parsedPrice = parseFloat(sellPrice);
    if (!parsedPrice || parsedPrice <= 0) { setSellErr("Enter a valid price."); return; }
    setSellState("relisting");
    setSellErr("");
    const sb = createClient();
    const { data, error } = await (sb as any).rpc("relist_nft", {
      p_nft_id:  nftUUID,
      p_price:   parsedPrice,
      p_status:  sellType,
    });
    if (error || !(data as any)?.success) {
      setSellErr((data as any)?.error ?? error?.message ?? "Failed to list.");
      setSellState("error");
    } else {
      setSellState("listed");
    }
  }, [nftUUID, sellPrice, sellType]);

  /* ── Buy: open confirmation (with balance check) ── */
  const handleBuyClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) {
      window.location.href = `/login?next=${encodeURIComponent(href ?? "/")}`;
      return;
    }
    /* Check balance before confirming */
    const { data: prof } = await (sb as any).from("profiles").select("balance").eq("id", user.id).single();
    const balance = (prof as any)?.balance ?? 0;
    if (balance < parseFloat(price)) {
      /* Show inline insufficient balance message instead of confirming */
      setBuyState("error");
      return;
    }
    setBuyState("confirming");
  }, [href, price]);

  /* ── Buy: confirm purchase ── */
  const handleConfirmBuy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nftUUID) return;

    setBuyState("purchasing");

    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBuyState("error"); return; }

    /* Use the atomic RPC — checks balance + deducts + records ownership atomically */
    const { data, error } = await (sb as any).rpc("purchase_nft_internal", {
      p_nft_id: nftUUID,
      p_price:  parseFloat(price),
    });

    if (error || !(data as any)?.success) {
      setBuyState("error");
    } else {
      setBuyState("purchased");
    }
  }, [nftUUID, price, title]);

  const initials = creator.name.slice(0, 2).toUpperCase();

  return (
    <article className="nft-card" aria-label={`NFT: ${title}`}>

      {/* Full-card link overlay */}
      {href && buyState === "idle" && (
        <Link
          href={href}
          aria-label={`View details for ${title}`}
          style={{ position: "absolute", inset: 0, zIndex: 0, borderRadius: "inherit" }}
          tabIndex={-1}
        />
      )}

      {/* ── Media ── */}
      <div className="nft-card__media">

        {image ? (
          <img src={image} alt={title} loading="lazy"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              objectFit: "cover",
              transition: "transform 500ms cubic-bezier(0.25,0.46,0.45,0.94)",
            }} />
        ) : (
          <div className="nft-card__art-placeholder" style={{ background: gradient }} aria-hidden />
        )}

        {/* Hover overlay — hidden for owned cards */}
        {!isOwned && buyState === "idle" && (
          <div className="nft-card__overlay" aria-hidden>
            <button
              className="btn btn-primary"
              style={{ width:"100%", gap:"0.5rem" }}
              tabIndex={-1}
              onClick={handleBuyClick}
            >
              <IconBuy /> Buy Now
            </button>
          </div>
        )}

        {/* Badges */}
        <div className="nft-card__badges">
          {badge ? (
            <span className="badge badge-gold">{badge}</span>
          ) : null}
        </div>

        {/* Like button — CSS class keeps it position:absolute top-right; no inline position override */}
        <button
          className={`nft-card__like${liked ? " nft-card__like--active" : ""}`}
          onClick={handleLike}
          aria-label={liked ? `Unlike ${title}` : `Like ${title}`}
          aria-pressed={liked}
        >
          <IconHeart filled={liked} />
          <span>{likeCount}</span>
        </button>

        {/* "Log in to like" inline message */}
        {likeMsg && (
          <div style={{ position:"absolute", bottom:"0.75rem", left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"9999px", padding:"0.25rem 0.875rem", fontSize:"0.75rem", fontWeight:600, color:"var(--text-primary)", whiteSpace:"nowrap", zIndex:3 }}>
            {likeMsg}
          </div>
        )}

      </div>

      {/* ── Body ── */}
      <div className="nft-card__body">

        <div className="nft-card__creator">
          <div className="avatar avatar-sm nft-card__avatar"
            style={!creator.avatar ? { background: gradient } : undefined} aria-hidden>
            {creator.avatar ? (
              <img src={creator.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            ) : (
              <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:"100%", height:"100%", fontSize:"0.5625rem", fontWeight:700, color:"#fff" }}>
                {initials}
              </span>
            )}
          </div>
          <span className="nft-card__creator-name">by {creator.name}</span>
        </div>

        <p className="nft-card__name">{title}</p>

        {/* ── OWNED footer — sell / relist flow ── */}
        {isOwned && sellState === "idle" && (
          <div className="nft-card__footer">
            <div>
              <p className="nft-card__price-label">Your listing price</p>
              <p className="nft-card__price"><IconEth /> {price}&nbsp;{currency}</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              style={{ borderRadius:"var(--radius-lg)", fontSize:"0.8125rem", position:"relative", zIndex:1,
                borderColor:"var(--accent-border)", color:"var(--accent)" }}
              onClick={(e) => { e.stopPropagation(); setSellState("listing"); }}
              aria-label={`Sell or relist ${title}`}
            >
              Sell
            </button>
          </div>
        )}

        {isOwned && sellState === "listing" && (
          <div style={{ paddingTop:"0.625rem", borderTop:"1px solid var(--border-muted)" }}>
            {/* Sale type toggle */}
            <div style={{ display:"flex", gap:"0.375rem", marginBottom:"0.5rem" }}>
              {(["buy-now","auction"] as const).map((t) => (
                <button key={t} type="button"
                  onClick={(e) => { e.stopPropagation(); setSellType(t); }}
                  style={{ flex:1, padding:"0.3125rem", fontSize:"0.6875rem", fontWeight:700,
                    borderRadius:"0.375rem", cursor:"pointer", fontFamily:"var(--font-sans)",
                    border:`1.5px solid ${sellType===t ? "var(--accent-border)" : "var(--border)"}`,
                    background: sellType===t ? "var(--accent-muted)" : "var(--bg-elevated)",
                    color:      sellType===t ? "var(--accent)"       : "var(--text-muted)",
                    position:"relative", zIndex:1,
                  }}>
                  {t === "buy-now" ? "Buy Now" : "Auction"}
                </button>
              ))}
            </div>
            {/* Price input */}
            <div style={{ display:"flex", gap:"0.375rem", alignItems:"center" }}>
              <div style={{ position:"relative", flex:1 }}>
                <input
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  type="number" step="0.001" min="0.001" placeholder="Price (ETH)"
                  style={{ width:"100%", background:"var(--bg-elevated)", border:"1px solid var(--border)",
                    borderRadius:"0.375rem", padding:"0.3125rem 2rem 0.3125rem 0.5rem",
                    color:"var(--text-primary)", fontSize:"0.8125rem", fontFamily:"var(--font-sans)",
                    outline:"none", position:"relative", zIndex:1 }}
                />
                <span style={{ position:"absolute", right:"0.5rem", top:"50%", transform:"translateY(-50%)",
                  fontSize:"0.6875rem", color:"var(--text-muted)", fontWeight:600, pointerEvents:"none" }}>
                  ETH
                </span>
              </div>
              <button className="btn btn-primary btn-sm"
                style={{ borderRadius:"0.375rem", fontSize:"0.75rem", padding:"0.3125rem 0.625rem", position:"relative", zIndex:1 }}
                onClick={handleRelist}>
                List
              </button>
              <button className="btn btn-ghost btn-sm"
                style={{ borderRadius:"0.375rem", fontSize:"0.75rem", padding:"0.3125rem 0.5rem", position:"relative", zIndex:1 }}
                onClick={(e) => { e.stopPropagation(); setSellState("idle"); setSellErr(""); }}>
                ✕
              </button>
            </div>
            {sellErr && <p style={{ fontSize:"0.75rem", color:"var(--error)", marginTop:"0.25rem" }}>{sellErr}</p>}
          </div>
        )}

        {isOwned && sellState === "relisting" && (
          <div style={{ paddingTop:"0.625rem", borderTop:"1px solid var(--border-muted)", textAlign:"center" }}>
            <span style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>Listing…</span>
          </div>
        )}

        {isOwned && (sellState === "listed" || sellState === "error") && (
          <div style={{ paddingTop:"0.625rem", borderTop:`1px solid ${sellState === "listed" ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}` }}>
            <p style={{ fontSize:"0.8125rem", color: sellState === "listed" ? "#34d399" : "#f87171", fontWeight:600 }}>
              {sellState === "listed"
                ? `✓ Listed for ${sellPrice} ETH (${sellType === "buy-now" ? "Buy Now" : "Auction"})`
                : sellErr || "Listing failed"}
            </p>
            <button className="btn btn-ghost btn-sm"
              style={{ fontSize:"0.75rem", marginTop:"0.25rem", position:"relative", zIndex:1 }}
              onClick={(e) => { e.stopPropagation(); setSellState("idle"); setSellErr(""); }}>
              {sellState === "listed" ? "Relist again" : "Try again"}
            </button>
          </div>
        )}

        {/* ── NON-OWNED footer — buy flow ── */}
        {!isOwned && buyState === "idle" && (
          <div className="nft-card__footer">
            <div>
              <p className="nft-card__price-label">Current Price</p>
              <p className="nft-card__price">
                <IconEth /> {price}&nbsp;{currency}
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              style={{ borderRadius:"var(--radius-lg)", fontSize:"0.8125rem", position:"relative", zIndex:1 }}
              onClick={handleBuyClick}
              aria-label={`Buy ${title} for ${price} ${currency}`}
            >
              Buy
            </button>
          </div>
        )}

        {/* Insufficient balance error */}
        {buyState === "error" && (
          <div style={{ paddingTop:"0.625rem", borderTop:"1px solid rgba(239,68,68,0.25)" }}>
            <p style={{ fontSize:"0.75rem", color:"#f87171", marginBottom:"0.375rem" }}>
              Insufficient balance.
            </p>
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <a href="/wallet/deposit" style={{ flex:1, fontSize:"0.75rem", fontWeight:700, color:"var(--accent)", textDecoration:"none", position:"relative", zIndex:1 }}>
                Deposit ETH →
              </a>
              <button
                className="btn btn-ghost btn-sm"
                style={{ fontSize:"0.75rem", position:"relative", zIndex:1, padding:"0" }}
                onClick={(e) => { e.stopPropagation(); setBuyState("idle"); }}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Confirming: inline confirm row */}
        {buyState === "confirming" && (
          <div style={{ display:"flex", gap:"0.5rem", alignItems:"center", paddingTop:"0.625rem", borderTop:"1px solid var(--border-muted)" }}>
            <span style={{ flex:1, fontSize:"0.8125rem", color:"var(--text-secondary)", fontWeight:600 }}>
              Confirm {price} {currency}?
            </span>
            <button
              className="btn btn-primary btn-sm"
              style={{ borderRadius:"9999px", fontSize:"0.75rem", position:"relative", zIndex:1 }}
              onClick={handleConfirmBuy}
            >
              ✓ Yes
            </button>
            <button
              className="btn btn-ghost btn-sm"
              style={{ borderRadius:"9999px", fontSize:"0.75rem", position:"relative", zIndex:1 }}
              onClick={(e) => { e.stopPropagation(); setBuyState("idle"); }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Purchasing: spinner row */}
        {buyState === "purchasing" && (
          <div style={{ paddingTop:"0.625rem", borderTop:"1px solid var(--border-muted)", textAlign:"center" }}>
            <span style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>Processing…</span>
          </div>
        )}

        {/* Purchased: success row */}
        {buyState === "purchased" && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", paddingTop:"0.625rem", borderTop:"1px solid rgba(16,185,129,0.25)", background:"rgba(16,185,129,0.06)", borderRadius:"0 0 var(--radius-card) var(--radius-card)", margin:"0 -1.125rem -0.75rem", padding:"0.625rem 1.125rem 0.75rem" }}>
            <IconCheck />
            <span style={{ flex:1, fontSize:"0.8125rem", color:"#34d399", fontWeight:600 }}>
              Added to your collection!
            </span>
            {href && (
              <Link href="/dashboard/collected" style={{ fontSize:"0.75rem", color:"var(--accent)", fontWeight:600, position:"relative", zIndex:1 }}>
                View →
              </Link>
            )}
          </div>
        )}

      </div>
    </article>
  );
}
