"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { createClient }        from "@/lib/supabase/client";

interface BuySectionProps {
  nftId:       string;   /* Supabase UUID */
  nftTitle:    string;
  price:       string;
  usd:         string;
  isAuction:   boolean;
  initialLikes: number;
}

/* ── Icons ───────────────────────────────────────────────── */
function IconEth() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 1.5 5.25 12.375 12 16.5l6.75-4.125L12 1.5Z" opacity="0.85"/>
      <path d="M12 18 5.25 13.875 12 22.5l6.75-8.625L12 18Z"/>
    </svg>
  );
}
function IconHeart({ filled }: { filled: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

type BuyState = "idle" | "confirming" | "purchasing" | "purchased" | "error";

export default function BuySection({
  nftId, nftTitle, price, usd, isAuction, initialLikes,
}: BuySectionProps) {
  /* Like state */
  const [liked,     setLiked]     = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);

  /* Buy state */
  const [buyState,  setBuyState]  = useState<BuyState>("idle");
  const [errorMsg,  setErrorMsg]  = useState("");

  /* Ownership — does the signed-in user already own this? */
  const [alreadyOwned, setAlreadyOwned] = useState(false);

  /* User's available balance */
  const [userBalance, setUserBalance] = useState<number | null>(null);

  /* On mount: check like status, ownership, balance, and real like count */
  useEffect(() => {
    const sb = createClient();
    async function check() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return;

      const sba = sb as any;
      const [likeRes, ownRes, countRes, profRes] = await Promise.all([
        sba.from("nft_likes").select("user_id").eq("user_id", user.id).eq("nft_id", nftId).maybeSingle(),
        sba.from("nft_ownership").select("nft_id").eq("nft_id", nftId).eq("owner_id", user.id).maybeSingle(),
        sba.from("nft_likes").select("*", { count: "exact", head: true }).eq("nft_id", nftId),
        sba.from("profiles").select("balance").eq("id", user.id).single(),
      ]);

      if (likeRes.data)  setLiked(true);
      if (ownRes.data)   setAlreadyOwned(true);
      if (countRes.count !== null) setLikeCount(countRes.count + initialLikes);
      if (profRes.data)  setUserBalance((profRes.data as any).balance ?? 0);
    }
    check();
  }, [nftId, initialLikes]);

  /* ── Toggle like ── */
  async function toggleLike() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = `/login?next=/nft/${nftId}`; return; }

    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikeCount((c) => (nowLiked ? c + 1 : c - 1));

    try {
      if (nowLiked) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (sb.from("nft_likes") as any).insert({ user_id: user.id, nft_id: nftId });
      } else {
        await sb.from("nft_likes").delete().eq("user_id", user.id).eq("nft_id", nftId);
      }
    } catch {
      setLiked(!nowLiked);
      setLikeCount((c) => (nowLiked ? c - 1 : c + 1));
    }
  }

  /* ── Initiate buy ── */
  async function initiateBuy() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = `/login?next=/nft/${nftId}`; return; }
    setBuyState("confirming");
  }

  /* ── Confirm purchase (uses atomic RPC that checks and deducts balance) ── */
  async function confirmPurchase() {
    setBuyState("purchasing");
    setErrorMsg("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBuyState("error"); setErrorMsg("You must be logged in."); return; }

    const { data, error } = await (sb as any).rpc("purchase_nft_internal", {
      p_nft_id: nftId,
      p_price:  parseFloat(price),
    });

    if (error || !(data as any)?.success) {
      const msg = (data as any)?.error ?? error?.message ?? "Transaction failed.";
      setBuyState("error");
      setErrorMsg(msg);
      /* Refresh balance in case it changed */
      const { data: prof } = await (sb as any).from("profiles").select("balance").eq("id", user.id).single();
      if (prof) setUserBalance((prof as any).balance ?? 0);
    } else {
      setAlreadyOwned(true);
      setUserBalance((data as any).new_balance ?? null);
      setBuyState("purchased");
    }
  }

  /* ── Render ── */
  const fee    = (parseFloat(price) * 0.02).toFixed(3);
  const total  = (parseFloat(price) * 1.02).toFixed(3);
  const hasEnough = userBalance === null || userBalance >= parseFloat(price);

  return (
    <div>
      {/* ── Buy Box ── */}
      <div className="buy-box">

        {/* Auction countdown (when live) */}
        {isAuction && buyState === "idle" && (
          <div className="buy-box__countdown">
            <IconClock />
            <span className="buy-box__countdown-label">Auction ends in</span>
            <span className="buy-box__countdown-time">4h 32m 15s</span>
          </div>
        )}

        {/* ── IDLE: price + action buttons ── */}
        {(buyState === "idle" || buyState === "error") && (
          <>
            <p className="buy-box__label">
              {alreadyOwned ? "You own this" : isAuction ? "Current Bid" : "Buy Now Price"}
            </p>
            <div className="buy-box__price">
              <span className="buy-box__eth">{price}</span>
              <span className="buy-box__currency">ETH</span>
            </div>
            <p className="buy-box__usd">≈ ${usd} USD</p>

            {errorMsg && (
              <p style={{ fontSize:"0.875rem", color:"var(--error)", marginBottom:"0.75rem" }}>
                {errorMsg}
              </p>
            )}

            {/* Balance warning */}
            {!alreadyOwned && userBalance !== null && !hasEnough && (
              <div style={{ padding:"0.75rem 1rem", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"var(--radius-md)", marginBottom:"0.875rem", fontSize:"0.875rem", color:"#f87171" }}>
                <strong>Insufficient balance.</strong> You have {userBalance.toFixed(4)} ETH but need {price} ETH.{" "}
                <Link href="/wallet/deposit" style={{ color:"var(--accent)", fontWeight:700 }}>Deposit ETH →</Link>
              </div>
            )}

            {/* Balance info when sufficient */}
            {!alreadyOwned && userBalance !== null && hasEnough && (
              <div style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginBottom:"0.875rem" }}>
                Your balance: <strong style={{ color:"var(--text-primary)" }}>{userBalance.toFixed(4)} ETH</strong>
                {" "}→ after purchase: <strong style={{ color:"var(--text-primary)" }}>{(userBalance - parseFloat(price)).toFixed(4)} ETH</strong>
              </div>
            )}

            <div className="buy-box__actions">
              {alreadyOwned ? (
                <Link href="/dashboard/collected" className="btn btn-gradient btn-lg" style={{ justifyContent:"center" }}>
                  View in Your Collection →
                </Link>
              ) : (
                <button
                  className="btn btn-gradient btn-lg"
                  style={{ justifyContent:"center", gap:"0.5rem", opacity: hasEnough ? 1 : 0.45, cursor: hasEnough ? "pointer" : "not-allowed" }}
                  onClick={hasEnough ? initiateBuy : undefined}
                  disabled={!hasEnough}
                >
                  <IconEth />
                  {isAuction ? `Place Bid — ${price} ETH` : `Buy for ${price} ETH`}
                </button>
              )}
              {!alreadyOwned && (
                <button className="btn btn-secondary btn-lg" style={{ justifyContent:"center" }}>
                  Make Offer
                </button>
              )}
            </div>
          </>
        )}

        {/* ── CONFIRMING: show fee breakdown ── */}
        {buyState === "confirming" && (
          <>
            <p className="buy-box__label">Confirm Purchase</p>
            <div className="buy-box__price">
              <span className="buy-box__eth">{price}</span>
              <span className="buy-box__currency">ETH</span>
            </div>
            <p className="buy-box__usd">≈ ${usd} USD</p>

            {/* Fee breakdown */}
            <div style={{ background:"var(--bg-overlay)", borderRadius:"var(--radius-md)", padding:"0.875rem 1rem", marginBottom:"1.125rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {[
                { label:"Item price",        val:`${price} ETH`                             },
                { label:"Platform fee (2%)", val:`${fee} ETH`                              },
                { label:"Seller receives",   val:`${(parseFloat(price)*0.98).toFixed(3)} ETH` },
                { label:"You pay",           val:`${total} ETH`, bold:true                 },
              ].map(({ label, val, bold }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize:"0.875rem", fontWeight: bold ? 700 : 400, color: bold ? "var(--text-primary)" : "var(--text-secondary)" }}>
                    {val}
                  </span>
                </div>
              ))}
            </div>

            <div className="buy-box__actions">
              <button
                className="btn btn-gradient btn-lg"
                style={{ justifyContent:"center" }}
                onClick={confirmPurchase}
              >
                Confirm — {total} ETH
              </button>
              <button
                className="btn btn-secondary btn-lg"
                style={{ justifyContent:"center" }}
                onClick={() => setBuyState("idle")}
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── PURCHASING: loading ── */}
        {buyState === "purchasing" && (
          <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
            <div style={{ width:"2rem", height:"2rem", borderRadius:"50%", border:"2px solid var(--border-muted)", borderTopColor:"var(--accent)", margin:"0 auto 1rem", animation:"spin 0.8s linear infinite" }} />
            <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)" }}>Processing transaction…</p>
          </div>
        )}

        {/* ── PURCHASED: success ── */}
        {buyState === "purchased" && (
          <div style={{ textAlign:"center", padding:"1.25rem 0" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>🎉</div>
            <p style={{ fontSize:"1.125rem", fontWeight:800, color:"var(--text-primary)", marginBottom:"0.375rem" }}>
              Purchase Complete!
            </p>
            <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", marginBottom:"1.25rem" }}>
              <strong style={{ color:"var(--text-primary)" }}>{nftTitle}</strong> is now in your collection.
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              <Link href="/dashboard/collected" className="btn btn-gradient btn-lg" style={{ justifyContent:"center" }}>
                View My Collection →
              </Link>
              <Link href="/explore" className="btn btn-secondary btn-lg" style={{ justifyContent:"center" }}>
                Continue Exploring
              </Link>
            </div>
          </div>
        )}

      </div>

      {/* ── Like & share actions (below buy box) ── */}
      <div style={{ display:"flex", gap:"0.625rem", marginTop:"0.875rem" }}>
        <button
          className={`btn btn-secondary btn-sm${liked ? " btn-outline" : ""}`}
          style={{ flex:1, borderRadius:"9999px", gap:"0.375rem", borderColor: liked ? "var(--accent-border)" : undefined, color: liked ? "var(--accent)" : undefined }}
          onClick={toggleLike}
          aria-pressed={liked}
        >
          <IconHeart filled={liked} />
          {liked ? "Liked" : "Like"} · {likeCount.toLocaleString()}
        </button>
        <button
          className="btn btn-secondary btn-sm"
          style={{ flex:1, borderRadius:"9999px" }}
          onClick={() => navigator.share?.({ title: nftTitle, url: window.location.href }).catch(() => {})}
        >
          Share
        </button>
      </div>

      {/* Spin keyframe (inline so no globals needed) */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
