"use client";

import { useState, useEffect, useCallback } from "react";
import Link                                  from "next/link";
import { createClient }                      from "@/lib/supabase/client";
import { nameGradient }                      from "@/lib/supabaseToNft";

interface BuySectionProps {
  nftId:        string;
  nftTitle:     string;
  price:        string;
  usd:          string;
  isAuction:    boolean;
  initialLikes: number;
  creatorId?:   string | null;
}

interface BidRow {
  id:              string;
  bidder_id:       string;
  bidder_name:     string;
  bidder_gradient: string | null;
  amount:          number;
  created_at:      string;
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

type BuyState  = "idle" | "confirming" | "purchasing" | "purchased" | "error";
type BidStatus = "idle" | "placing" | "placed" | "withdrawing" | "error";

export default function BuySection({
  nftId, nftTitle, price, usd, isAuction, initialLikes, creatorId,
}: BuySectionProps) {
  /* ── Shared state ── */
  const [liked,        setLiked]        = useState(false);
  const [likeCount,    setLikeCount]    = useState(initialLikes);
  const [alreadyOwned, setAlreadyOwned] = useState(false);
  const [userBalance,  setUserBalance]  = useState<number | null>(null);
  const [userId,       setUserId]       = useState<string | null>(null);

  /* ── Buy-now state ── */
  const [buyState,  setBuyState]  = useState<BuyState>("idle");
  const [errorMsg,  setErrorMsg]  = useState("");

  /* ── Auction / bid state ── */
  const [bids,        setBids]        = useState<BidRow[]>([]);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [bidAmount,   setBidAmount]   = useState(price);   // default = min bid
  const [bidStatus,   setBidStatus]   = useState<BidStatus>("idle");
  const [bidError,    setBidError]    = useState("");
  const [userBid,     setUserBid]     = useState<BidRow | null>(null);   // user's own current bid
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [acceptMsg,   setAcceptMsg]   = useState<{ ok: boolean; text: string } | null>(null);

  /* ── Derived ── */
  // alreadyOwned is set correctly in check() by comparing against the actual
  // nft_ownership record — so no extra creatorId fallback needed here.
  const isOwner    = alreadyOwned;
  const hasEnough  = userBalance === null || userBalance >= parseFloat(bidAmount || "0");
  const minBid     = parseFloat(price);

  /* ── Load bids (auction NFTs only) ── */
  const loadBids = useCallback(async (uid: string | null) => {
    if (!isAuction) return;
    setBidsLoading(true);
    const sb = createClient() as any;
    const { data } = await sb
      .from("nft_bids")
      .select("id, bidder_id, amount, created_at, profiles(name)")
      .eq("nft_id", nftId)
      .eq("status", "pending")
      .order("amount", { ascending: false });

    if (data) {
      const rows: BidRow[] = (data as any[]).map((b) => {
        const name = b.profiles?.name ?? "Anonymous";
        return {
          id:              b.id,
          bidder_id:       b.bidder_id,
          bidder_name:     name,
          bidder_gradient: nameGradient(name),
          amount:          b.amount,
          created_at:      b.created_at,
        };
      });
      setBids(rows);
      if (uid) setUserBid(rows.find((b) => b.bidder_id === uid) ?? null);
    }
    setBidsLoading(false);
  }, [nftId, isAuction]);

  /* ── Mount: check auth, ownership, likes, balance ── */
  useEffect(() => {
    const sb = createClient();
    async function check() {
      const { data: { user } } = await sb.auth.getUser();
      const uid = user?.id ?? null;
      setUserId(uid);

      if (!uid) {
        if (isAuction) loadBids(null);
        return;
      }

      const sba = sb as any;
      const [likeRes, currentOwnerRes, countRes, profRes] = await Promise.all([
        sba.from("nft_likes").select("user_id").eq("user_id", uid).eq("nft_id", nftId).maybeSingle(),
        /* Fetch the actual current owner — no user filter — so we can correctly
           handle: (a) no ownership record → creator owns it, (b) record exists
           for someone else → creator has sold it and no longer owns it.         */
        sba.from("nft_ownership").select("owner_id").eq("nft_id", nftId).maybeSingle(),
        sba.from("nft_likes").select("*", { count: "exact", head: true }).eq("nft_id", nftId),
        sba.from("profiles").select("balance").eq("id", uid).single(),
      ]);

      if (likeRes.data) setLiked(true);
      if (countRes.count !== null) setLikeCount(countRes.count + initialLikes);
      if (profRes.data) setUserBalance((profRes.data as any).balance ?? 0);

      /* Ownership truth table:
         - nft_ownership has a row → whoever it points to is the owner
         - nft_ownership has no row → the creator (creatorId) is still the owner  */
      const currentOwner: string | null = (currentOwnerRes.data as any)?.owner_id ?? null;
      const owned = currentOwner
        ? currentOwner === uid            // sold before: check if this user bought it
        : uid === (creatorId ?? "__none__"); // never sold: creator is the owner
      setAlreadyOwned(owned);

      if (isAuction) loadBids(uid);
    }
    check();
  }, [nftId, initialLikes, isAuction, loadBids]);

  /* ── Like toggle ── */
  async function toggleLike() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = `/login?next=/nft/${nftId}`; return; }
    const nowLiked = !liked;
    setLiked(nowLiked);
    setLikeCount((c) => (nowLiked ? c + 1 : c - 1));
    try {
      if (nowLiked) {
        await (sb.from("nft_likes") as any).insert({ user_id: user.id, nft_id: nftId });
      } else {
        await sb.from("nft_likes").delete().eq("user_id", user.id).eq("nft_id", nftId);
      }
    } catch {
      setLiked(!nowLiked);
      setLikeCount((c) => (nowLiked ? c - 1 : c + 1));
    }
  }

  /* ── Buy-now flow ── */
  async function initiateBuy() {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = `/login?next=/nft/${nftId}`; return; }
    setBuyState("confirming");
  }

  async function confirmPurchase() {
    setBuyState("purchasing"); setErrorMsg("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setBuyState("error"); setErrorMsg("You must be logged in."); return; }

    const { data, error } = await (sb as any).rpc("purchase_nft_internal", {
      p_nft_id: nftId,
      p_price:  parseFloat(price),
    });

    if (error || !(data as any)?.success) {
      setBuyState("error");
      setErrorMsg((data as any)?.error ?? error?.message ?? "Transaction failed.");
      const { data: prof } = await (sb as any).from("profiles").select("balance").eq("id", user.id).single();
      if (prof) setUserBalance((prof as any).balance ?? 0);
    } else {
      setAlreadyOwned(true);
      setUserBalance((data as any).new_balance ?? null);
      setBuyState("purchased");
    }
  }

  /* ── Place bid ── */
  async function handlePlaceBid() {
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= 0)  { setBidError("Enter a valid amount."); return; }
    if (amount < minBid)          { setBidError(`Minimum bid is ${price} ETH.`); return; }
    if (userBalance !== null && userBalance < amount) {
      setBidError("Insufficient balance."); return;
    }

    setBidStatus("placing"); setBidError("");
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { window.location.href = `/login?next=/nft/${nftId}`; return; }

    const { data, error } = await (sb as any).rpc("place_bid", {
      p_nft_id: nftId,
      p_amount: amount,
    });

    if (error || !(data as any)?.success) {
      setBidError((data as any)?.error ?? error?.message ?? "Bid failed.");
      setBidStatus("error");
    } else {
      setBidStatus("placed");
      loadBids(user.id);
      setTimeout(() => setBidStatus("idle"), 2500);
    }
  }

  /* ── Withdraw bid ── */
  async function handleWithdrawBid() {
    if (!userBid) return;
    setBidStatus("withdrawing");
    const sb = createClient() as any;
    const { data, error } = await sb.rpc("withdraw_bid", { p_bid_id: userBid.id });
    if (!error && (data as any)?.success) {
      setUserBid(null);
      setBids((prev) => prev.filter((b) => b.id !== userBid.id));
      setBidStatus("idle");
    } else {
      setBidError((data as any)?.error ?? error?.message ?? "Failed to withdraw.");
      setBidStatus("error");
    }
  }

  /* ── Accept bid (owner) ── */
  async function handleAcceptBid(bidId: string) {
    setAcceptingId(bidId); setAcceptMsg(null);
    const sb = createClient() as any;
    const { data, error } = await sb.rpc("accept_bid", { p_bid_id: bidId });
    const ok = !error && (data as any)?.success;
    if (ok) {
      setAcceptMsg({ ok: true, text: `✓ Bid accepted! You received ${(data as any).net_received?.toFixed(4)} ETH.` });
      setBids([]);
      // Refresh balance
      sb.auth.getUser().then(({ data: { user } }: any) => {
        if (!user) return;
        sb.from("profiles").select("balance").eq("id", user.id).single()
          .then(({ data: prof }: any) => { if (prof) setUserBalance(prof.balance ?? 0); });
      });
    } else {
      setAcceptMsg({ ok: false, text: (data as any)?.error ?? error?.message ?? "Failed to accept bid." });
    }
    setAcceptingId(null);
  }

  /* ── Reject bid (owner) ── */
  async function handleRejectBid(bidId: string) {
    const sb = createClient() as any;
    const { data, error } = await sb.rpc("reject_bid", { p_bid_id: bidId });
    if (!error && (data as any)?.success) {
      setBids((prev) => prev.filter((b) => b.id !== bidId));
    } else {
      setAcceptMsg({ ok: false, text: (data as any)?.error ?? error?.message ?? "Failed." });
    }
  }

  /* ── Fee preview ── */
  const fee   = (parseFloat(price) * 0.02).toFixed(3);
  const total = (parseFloat(price) * 1.02).toFixed(3);

  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */
  return (
    <div>
      <div className="buy-box">

        {/* ╔══════════════════════════════════════════════╗
            ║  AUCTION — OWNER: Manage incoming bids       ║
            ╚══════════════════════════════════════════════╝ */}
        {isAuction && isOwner && (
          <>
            <p className="buy-box__label">Your Auction — Incoming Bids</p>
            <div className="buy-box__price">
              <span className="buy-box__eth">{price}</span>
              <span className="buy-box__currency">ETH</span>
              <span style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginLeft:"0.5rem" }}>minimum</span>
            </div>

            {acceptMsg && (
              <div style={{ padding:"0.75rem 1rem", borderRadius:"var(--radius-md)", marginBottom:"0.875rem",
                background: acceptMsg.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
                border:`1px solid ${acceptMsg.ok ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
                fontSize:"0.875rem", color: acceptMsg.ok ? "#34d399" : "#f87171" }}>
                {acceptMsg.text}
              </div>
            )}

            {bidsLoading ? (
              <p style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}>Loading bids…</p>
            ) : bids.length === 0 ? (
              <div style={{ textAlign:"center", padding:"1.5rem 0", color:"var(--text-muted)" }}>
                <p style={{ fontSize:"1.5rem", marginBottom:"0.375rem" }}>📭</p>
                <p style={{ fontSize:"0.875rem" }}>No bids yet. Share this listing to attract buyers.</p>
              </div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"0.875rem" }}>
                {bids.map((bid, i) => (
                  <div key={bid.id} style={{
                    display:"flex", alignItems:"center", gap:"0.75rem",
                    padding:"0.75rem 0.875rem", borderRadius:"var(--radius-md)",
                    background: i === 0 ? "var(--accent-muted)" : "var(--bg-overlay)",
                    border:`1px solid ${i === 0 ? "var(--accent-border)" : "var(--border-muted)"}`,
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width:"2rem", height:"2rem", borderRadius:"50%", flexShrink:0,
                      background: bid.bidder_gradient ?? "linear-gradient(135deg,#333,#555)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"0.5rem", fontWeight:700, color:"#fff",
                    }} aria-hidden>
                      {bid.bidder_name.slice(0,2).toUpperCase()}
                    </div>
                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, fontSize:"0.875rem", color:"var(--text-primary)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {bid.bidder_name}
                        {i === 0 && <span style={{ marginLeft:"0.375rem", fontSize:"0.6875rem", color:"var(--accent)", fontWeight:700 }}>HIGHEST</span>}
                      </p>
                      <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
                        {new Date(bid.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Amount */}
                    <p style={{ fontWeight:800, fontSize:"1rem", color: i === 0 ? "var(--accent)" : "var(--text-primary)", flexShrink:0 }}>
                      {bid.amount} ETH
                    </p>
                    {/* Actions */}
                    <div style={{ display:"flex", gap:"0.25rem", flexShrink:0 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ borderRadius:"9999px", fontSize:"0.75rem", padding:"0.3125rem 0.625rem" }}
                        disabled={acceptingId === bid.id}
                        onClick={() => handleAcceptBid(bid.id)}
                      >
                        {acceptingId === bid.id ? "…" : "✓ Accept"}
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ borderRadius:"9999px", fontSize:"0.75rem", padding:"0.3125rem 0.5rem", color:"var(--text-muted)" }}
                        onClick={() => handleRejectBid(bid.id)}
                        title="Dismiss bid"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ╔══════════════════════════════════════════════╗
            ║  AUCTION — NON-OWNER: Place / manage bid     ║
            ╚══════════════════════════════════════════════╝ */}
        {isAuction && !isOwner && (
          <>
            <p className="buy-box__label">
              {userBid ? "Your Current Bid" : "Place a Bid"}
            </p>
            <div className="buy-box__price">
              <span className="buy-box__eth">{userBid ? userBid.amount.toFixed(4) : price}</span>
              <span className="buy-box__currency">ETH</span>
              {!userBid && <span style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginLeft:"0.5rem" }}>minimum</span>}
            </div>

            {/* Existing bids count */}
            {bids.length > 0 && (
              <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginBottom:"0.875rem" }}>
                {bids.length} active bid{bids.length !== 1 ? "s" : ""} · Highest: <strong style={{ color:"var(--accent)" }}>{bids[0].amount} ETH</strong>
              </p>
            )}

            {/* Balance warning */}
            {userBalance !== null && !hasEnough && (
              <div style={{ padding:"0.75rem 1rem", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"var(--radius-md)", marginBottom:"0.875rem", fontSize:"0.875rem", color:"#f87171" }}>
                <strong>Insufficient balance.</strong> You have {userBalance.toFixed(4)} ETH.{" "}
                <Link href="/wallet/deposit" style={{ color:"var(--accent)", fontWeight:700 }}>Deposit ETH →</Link>
              </div>
            )}

            {bidStatus === "placed" ? (
              <div style={{ padding:"0.875rem 1rem", background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.25)", borderRadius:"var(--radius-md)", marginBottom:"0.875rem", fontSize:"0.875rem", color:"#34d399" }}>
                ✓ Bid placed! The owner will be notified.
              </div>
            ) : (
              <>
                {/* Bid amount input */}
                <div style={{ position:"relative", marginBottom:"0.875rem" }}>
                  <input
                    type="number"
                    min={minBid}
                    step="0.001"
                    value={bidAmount}
                    onChange={(e) => { setBidAmount(e.target.value); setBidError(""); }}
                    className="db-input"
                    style={{ paddingRight:"3.5rem" }}
                    placeholder={price}
                  />
                  <span style={{ position:"absolute", right:"0.875rem", top:"50%", transform:"translateY(-50%)", fontSize:"0.8125rem", fontWeight:700, color:"var(--text-muted)", pointerEvents:"none" }}>
                    ETH
                  </span>
                </div>

                {bidError && (
                  <p style={{ fontSize:"0.8125rem", color:"var(--error)", marginBottom:"0.5rem" }}>{bidError}</p>
                )}

                {userBalance !== null && (
                  <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginBottom:"0.875rem" }}>
                    Your balance: <strong style={{ color:"var(--text-primary)" }}>{userBalance.toFixed(4)} ETH</strong>
                  </p>
                )}

                <div className="buy-box__actions">
                  <button
                    className="btn btn-gradient btn-lg"
                    style={{ justifyContent:"center", gap:"0.5rem" }}
                    onClick={handlePlaceBid}
                    disabled={bidStatus === "placing"}
                  >
                    <IconEth />
                    {bidStatus === "placing"
                      ? "Placing…"
                      : userBid
                        ? `Update Bid — ${bidAmount || price} ETH`
                        : `Place Bid — ${bidAmount || price} ETH`}
                  </button>

                  {userBid && (
                    <button
                      className="btn btn-secondary btn-lg"
                      style={{ justifyContent:"center", color:"#f87171", borderColor:"rgba(239,68,68,0.3)" }}
                      onClick={handleWithdrawBid}
                      disabled={bidStatus === "withdrawing"}
                    >
                      {bidStatus === "withdrawing" ? "Withdrawing…" : "Withdraw Bid"}
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* ╔══════════════════════════════════════════════╗
            ║  BUY-NOW flow (all existing states)          ║
            ╚══════════════════════════════════════════════╝ */}
        {!isAuction && (buyState === "idle" || buyState === "error") && (
          <>
            <p className="buy-box__label">
              {alreadyOwned ? "You own this" : "Buy Now Price"}
            </p>
            <div className="buy-box__price">
              <span className="buy-box__eth">{price}</span>
              <span className="buy-box__currency">ETH</span>
            </div>
            <p className="buy-box__usd">≈ ${usd} USD</p>

            {errorMsg && <p style={{ fontSize:"0.875rem", color:"var(--error)", marginBottom:"0.75rem" }}>{errorMsg}</p>}

            {!alreadyOwned && userBalance !== null && userBalance < parseFloat(price) && (
              <div style={{ padding:"0.75rem 1rem", background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"var(--radius-md)", marginBottom:"0.875rem", fontSize:"0.875rem", color:"#f87171" }}>
                <strong>Insufficient balance.</strong> You have {userBalance.toFixed(4)} ETH but need {price} ETH.{" "}
                <Link href="/wallet/deposit" style={{ color:"var(--accent)", fontWeight:700 }}>Deposit ETH →</Link>
              </div>
            )}

            {!alreadyOwned && userBalance !== null && userBalance >= parseFloat(price) && (
              <div style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginBottom:"0.875rem" }}>
                Your balance: <strong style={{ color:"var(--text-primary)" }}>{userBalance.toFixed(4)} ETH</strong>
                {" "}→ after: <strong style={{ color:"var(--text-primary)" }}>{(userBalance - parseFloat(price)).toFixed(4)} ETH</strong>
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
                  style={{ justifyContent:"center", gap:"0.5rem",
                    opacity: userBalance !== null && userBalance < parseFloat(price) ? 0.45 : 1,
                    cursor:  userBalance !== null && userBalance < parseFloat(price) ? "not-allowed" : "pointer" }}
                  onClick={userBalance === null || userBalance >= parseFloat(price) ? initiateBuy : undefined}
                  disabled={userBalance !== null && userBalance < parseFloat(price)}
                >
                  <IconEth /> Buy for {price} ETH
                </button>
              )}
            </div>
          </>
        )}

        {!isAuction && buyState === "confirming" && (
          <>
            <p className="buy-box__label">Confirm Purchase</p>
            <div className="buy-box__price">
              <span className="buy-box__eth">{price}</span>
              <span className="buy-box__currency">ETH</span>
            </div>
            <p className="buy-box__usd">≈ ${usd} USD</p>
            <div style={{ background:"var(--bg-overlay)", borderRadius:"var(--radius-md)", padding:"0.875rem 1rem", marginBottom:"1.125rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {[
                { label:"Item price",        val:`${price} ETH` },
                { label:"Platform fee (2%)", val:`${fee} ETH`  },
                { label:"Seller receives",   val:`${(parseFloat(price)*0.98).toFixed(3)} ETH` },
                { label:"You pay",           val:`${total} ETH`, bold:true },
              ].map(({ label, val, bold }) => (
                <div key={label} style={{ display:"flex", justifyContent:"space-between" }}>
                  <span style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>{label}</span>
                  <span style={{ fontSize:"0.875rem", fontWeight: bold ? 700 : 400, color: bold ? "var(--text-primary)" : "var(--text-secondary)" }}>{val}</span>
                </div>
              ))}
            </div>
            <div className="buy-box__actions">
              <button className="btn btn-gradient btn-lg" style={{ justifyContent:"center" }} onClick={confirmPurchase}>
                Confirm — {total} ETH
              </button>
              <button className="btn btn-secondary btn-lg" style={{ justifyContent:"center" }} onClick={() => setBuyState("idle")}>
                Cancel
              </button>
            </div>
          </>
        )}

        {!isAuction && buyState === "purchasing" && (
          <div style={{ textAlign:"center", padding:"1.5rem 0" }}>
            <div style={{ width:"2rem", height:"2rem", borderRadius:"50%", border:"2px solid var(--border-muted)", borderTopColor:"var(--accent)", margin:"0 auto 1rem", animation:"spin 0.8s linear infinite" }} />
            <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)" }}>Processing transaction…</p>
          </div>
        )}

        {!isAuction && buyState === "purchased" && (
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

      {/* ── Like & share ── */}
      <div style={{ display:"flex", gap:"0.625rem", marginTop:"0.875rem" }}>
        <button
          className={`btn btn-secondary btn-sm${liked ? " btn-outline" : ""}`}
          style={{ flex:1, borderRadius:"9999px", gap:"0.375rem",
            borderColor: liked ? "var(--accent-border)" : undefined,
            color:       liked ? "var(--accent)"       : undefined }}
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

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
