"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import NFTCard                 from "@/components/NFTCard";
import ScrollReveal            from "@/components/ScrollReveal";
import { useProfile }          from "@/hooks/useProfile";
import { createClient }        from "@/lib/supabase/client";
import { rowToCard }           from "@/lib/nftAdapter";
import type { NFTRow, ActivityLog } from "@/lib/database.types";

/* ── Skeleton bar helper ─────────────────────────────────── */
function Skel({ w = "60%", h = "1rem" }: { w?: string; h?: string }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: "0.375rem" }} />;
}

export default function DashboardOverview() {
  const { profile, userId, loading: profileLoading } = useProfile();

  /* ── Data states ── */
  const [ownedNFTs,    setOwnedNFTs]    = useState<NFTRow[] | null>(null);   // null = loading
  const [liveActivity, setLiveActivity] = useState<ActivityLog[] | null>(null);
  const [stats,        setStats]        = useState<{
    bidCount:      number | null;
    salesCount:    number | null;
    earningsEth:   number | null;
    watchlistCount:number | null;
  }>({ bidCount: null, salesCount: null, earningsEth: null, watchlistCount: null });

  const [copied, setCopied] = useState(false);

  /* ── Fetch everything once userId is known ── */
  useEffect(() => {
    if (!userId) return;
    const uid = userId;
    const sb  = createClient();
    const sba = sb as any;

    /* Owned NFTs */
    async function loadOwned() {
      const { data: ownership } = await sb
        .from("nft_ownership")
        .select("nft_id")
        .eq("owner_id", uid)
        .limit(8) as { data: { nft_id: string }[] | null };
      if (!ownership?.length) { setOwnedNFTs([]); return; }
      const ids = ownership.map((o) => o.nft_id);
      const { data: nfts } = await sb.from("nfts").select("*").in("id", ids).limit(8);
      setOwnedNFTs((nfts as NFTRow[]) ?? []);
    }

    /* Activity feed */
    async function loadActivity() {
      const { data } = await sb
        .from("activity_log")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(5);
      setLiveActivity((data as ActivityLog[]) ?? []);
    }

    /* Stats: bids placed, sales made, earnings, watchlist */
    async function loadStats() {
      const [bidsRes, salesCountRes, salesAmtRes, watchRes] = await Promise.all([
        sba.from("bids").select("*", { count: "exact", head: true }).eq("bidder_id", uid),
        sba.from("activity_log").select("*", { count: "exact", head: true })
          .eq("user_id", uid).eq("event_type", "sale"),
        sba.from("activity_log").select("amount").eq("user_id", uid).eq("event_type", "sale"),
        sba.from("watchlist").select("*", { count: "exact", head: true }).eq("user_id", uid),
      ]);

      const earningsEth = ((salesAmtRes.data ?? []) as { amount: number }[])
        .reduce((s, r) => s + Number(r.amount), 0);

      setStats({
        bidCount:       bidsRes.count     ?? 0,
        salesCount:     salesCountRes.count ?? 0,
        earningsEth,
        watchlistCount: watchRes.count    ?? 0,
      });
    }

    loadOwned();
    loadActivity();
    loadStats();
  }, [userId]);

  /* ── Derived display values ── */
  const displayName   = profile?.name     ?? "";
  const displayHandle = profile?.handle   ? `@${profile.handle}` : "";
  const rawWallet     = profile?.wallet_address ?? "";
  const displayWallet = rawWallet
    ? `${rawWallet.slice(0, 6)}…${rawWallet.slice(-4)}`
    : "No wallet linked";
  const joinedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";
  const initials = (profile?.name ?? "?").slice(0, 2).toUpperCase();

  /* ── Loading / empty flags ── */
  const nftsLoading      = ownedNFTs === null;
  const activityLoading  = liveActivity === null;
  const statsLoading     = stats.bidCount === null;
  const ownedCount       = ownedNFTs?.length ?? 0;
  const portfolioEth     = ownedNFTs?.reduce((s, n) => s + Number(n.price), 0) ?? 0;

  /* ── Stat card definitions ── */
  const STATS = [
    {
      icon: "💎", label: "Portfolio Value",
      value:  nftsLoading   ? null : portfolioEth > 0 ? `$${(portfolioEth * 3_900).toLocaleString()}` : "$0",
      change: nftsLoading   ? null : `${ownedCount} NFT${ownedCount !== 1 ? "s" : ""} owned`,
      up: true,
    },
    {
      icon: "🖼️", label: "NFTs Owned",
      value:  nftsLoading   ? null : String(ownedCount),
      change: nftsLoading   ? null : ownedCount ? "in your collection" : "Start collecting",
      up: true,
    },
    {
      icon: "⚡", label: "Active Bids",
      value:  statsLoading  ? null : String(stats.bidCount ?? 0),
      change: statsLoading  ? null : stats.bidCount ? "bids placed" : "No active bids",
      up: true,
    },
    {
      icon: "💰", label: "Total Sales",
      value:  statsLoading  ? null : String(stats.salesCount ?? 0),
      change: statsLoading  ? null : stats.salesCount ? "NFTs sold" : "None sold yet",
      up: true,
    },
    {
      icon: "❤️", label: "Watchlist",
      value:  statsLoading  ? null : String(stats.watchlistCount ?? 0),
      change: statsLoading  ? null : stats.watchlistCount ? "items saved" : "Nothing saved yet",
      up: true,
    },
    {
      icon: "📈", label: "Lifetime Earnings",
      value:  statsLoading  ? null : stats.earningsEth ? `${stats.earningsEth.toFixed(4)} ETH` : "0 ETH",
      change: statsLoading  ? null : stats.earningsEth ? "from all sales" : "Sell your first NFT",
      up: true,
    },
  ];

  function copyWallet() {
    navigator.clipboard.writeText(rawWallet || displayWallet).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2_000);
  }

  return (
    <>
      {/* ── Profile Banner ── */}
      <div className="db-banner">
        <div className="db-banner__gradient" />
        <div className="db-banner__shimmer" />
        <div className="db-banner__grid" />
      </div>

      {/* ── Profile info ── */}
      <div className="db-profile-block">
        <div className="db-profile-avatar-wrap">
          <div
            className="db-profile-avatar"
            style={{ background: "linear-gradient(135deg,#00f5d4,#f15bb5)" }}
            aria-hidden
          >
            {profileLoading ? "" : initials}
          </div>
        </div>

        {/* Name skeleton while loading */}
        {profileLoading ? (
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginBottom:"0.875rem" }}>
            <Skel w="160px" h="1.625rem" />
            <Skel w="100px" h="1rem" />
          </div>
        ) : (
          <>
            <p className="db-profile-name">{displayName || "Unnamed"}</p>
            <p className="db-profile-handle">{displayHandle || "—"}</p>
          </>
        )}

        <div className="db-profile-meta">
          <button
            className="db-profile-wallet"
            onClick={copyWallet}
            disabled={!rawWallet}
            title={rawWallet ? "Click to copy" : "Add a wallet address in Settings"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              {copied
                ? <path d="M20 6L9 17l-5-5"/>
                : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>}
            </svg>
            {profileLoading ? "—" : copied ? "Copied!" : displayWallet}
          </button>

          {!profileLoading && joinedDate && (
            <span style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>
              Member since {joinedDate}
            </span>
          )}

          {profile?.verified && (
            <span className="badge badge-accent" style={{ fontSize:"0.6875rem" }}>✓ Verified</span>
          )}
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="db-page-body">

        {/* ── Stat cards ── */}
        <ScrollReveal>
          <div className="db-section">
            <p className="db-section-title">At a Glance</p>
            <div className="db-stats-grid">
              {STATS.map((s) => (
                <div key={s.label} className="db-stat-card">
                  <div className="db-stat-card__icon">{s.icon}</div>
                  <p className="db-stat-card__label">{s.label}</p>
                  {s.value === null ? (
                    /* Loading skeleton inside the card */
                    <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", marginTop:"0.25rem" }}>
                      <Skel w="55%" h="1.625rem" />
                      <Skel w="80%" h="0.75rem" />
                    </div>
                  ) : (
                    <>
                      <p className="db-stat-card__value">{s.value}</p>
                      <p className="db-stat-card__change db-stat-card__change--up">
                        {s.change}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* ── Recent collection ── */}
        <ScrollReveal delay={80}>
          <div className="db-section">
            <p className="db-section-title">
              Recent Collection
              <Link href="/dashboard/collected" style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--accent)", letterSpacing:0, textTransform:"none", marginLeft:"auto" }}>
                View all →
              </Link>
            </p>

            {/* Loading skeleton grid */}
            {nftsLoading && (
              <div className="grid-nft">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-2xl)", overflow:"hidden" }}>
                    <div className="skeleton" style={{ width:"100%", aspectRatio:"1" }} />
                    <div style={{ padding:"1rem", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                      <Skel w="70%" h="1rem" />
                      <Skel w="45%" h="0.75rem" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!nftsLoading && ownedCount === 0 && (
              <div style={{ textAlign:"center", padding:"3rem 1rem", background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)" }}>
                <p style={{ fontSize:"3rem", marginBottom:"0.875rem", lineHeight:1 }}>🖼️</p>
                <p style={{ fontWeight:700, fontSize:"1.0625rem", color:"var(--text-primary)", marginBottom:"0.5rem" }}>
                  No NFTs collected yet
                </p>
                <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", marginBottom:"1.5rem", maxWidth:"36ch", margin:"0 auto 1.5rem" }}>
                  Browse the marketplace and place your first bid or buy to get started.
                </p>
                <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center", flexWrap:"wrap" }}>
                  <Link href="/explore" className="btn btn-gradient" style={{ borderRadius:"9999px" }}>
                    Browse Marketplace
                  </Link>
                  <Link href="/wallet/deposit" className="btn btn-secondary" style={{ borderRadius:"9999px" }}>
                    Deposit ETH First
                  </Link>
                </div>
              </div>
            )}

            {/* Real NFT grid */}
            {!nftsLoading && ownedCount > 0 && (
              <div className="grid-nft">
                {ownedNFTs!.map((nft) => (
                  <NFTCard key={nft.id} {...rowToCard(nft)} />
                ))}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* ── Recent activity ── */}
        <ScrollReveal delay={120}>
          <div className="db-section">
            <p className="db-section-title">
              Recent Activity
              <Link href="/dashboard/activity" style={{ fontSize:"0.8125rem", fontWeight:600, color:"var(--accent)", letterSpacing:0, textTransform:"none", marginLeft:"auto" }}>
                View all →
              </Link>
            </p>

            {/* Loading skeleton rows */}
            {activityLoading && (
              <div className="db-activity-list">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="db-activity-row">
                    <div className="skeleton" style={{ width:"2.5rem", height:"2.5rem", borderRadius:"50%", flexShrink:0 }} />
                    <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                      <Skel w="55%" />
                      <Skel w="35%" h="0.75rem" />
                    </div>
                    <Skel w="5rem" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty state */}
            {!activityLoading && liveActivity!.length === 0 && (
              <div style={{ textAlign:"center", padding:"2.5rem 1rem", background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)" }}>
                <p style={{ fontSize:"2rem", marginBottom:"0.625rem", lineHeight:1 }}>📋</p>
                <p style={{ fontWeight:600, fontSize:"1rem", color:"var(--text-primary)", marginBottom:"0.375rem" }}>
                  No activity yet
                </p>
                <p style={{ fontSize:"0.875rem", color:"var(--text-muted)" }}>
                  Your purchases, bids, sales, and likes will appear here.
                </p>
              </div>
            )}

            {/* Real activity rows */}
            {!activityLoading && liveActivity!.length > 0 && (
              <div className="db-activity-list">
                {liveActivity!.map((item) => (
                  <div key={item.id} className="db-activity-row">
                    <div className="db-activity-icon">
                      {item.event_type === "purchase" ? "🛍️"
                        : item.event_type === "sale"  ? "💰"
                        : item.event_type === "bid"   ? "⚡"
                        : item.event_type === "mint"  ? "🎨"
                        : item.event_type === "like"  ? "❤️"
                        : "🔄"}
                    </div>
                    <div className="db-activity-info">
                      <p className="db-activity-title">
                        <span className={`activity-badge activity-badge--${item.event_type}`} style={{ marginRight:"0.5rem" }}>
                          {item.event_type}
                        </span>
                        {item.nft_title ?? "NFT"}
                      </p>
                      <p className="db-activity-sub">
                        {new Date(item.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}
                      </p>
                    </div>
                    <div className="db-activity-right">
                      {item.amount != null && (
                        <p className="db-activity-amount">{item.amount} ETH</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </ScrollReveal>

      </div>
    </>
  );
}
