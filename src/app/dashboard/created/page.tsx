"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import NFTCard                 from "@/components/NFTCard";
import { useProfile }          from "@/hooks/useProfile";
import { createClient }        from "@/lib/supabase/client";
import { rowToCard }           from "@/lib/nftAdapter";
import type { NFTRow }         from "@/lib/database.types";

export default function CreatedPage() {
  const { userId, loading: profileLoading } = useProfile();
  const [nfts,    setNfts]    = useState<NFTRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const uid = userId;
    const sba = createClient() as any;
    async function load() {
      try {
        /* 1. All NFTs this user created */
        const { data: created } = await sba
          .from("nfts")
          .select("*")
          .eq("creator_id", uid)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!created || created.length === 0) { setNfts([]); return; }

        /* 2. Which of those have been sold to someone else? */
        const ids = (created as NFTRow[]).map((n) => n.id);
        const { data: ownership } = await sba
          .from("nft_ownership")
          .select("nft_id, owner_id")
          .in("nft_id", ids);

        const ownerMap = new Map(
          ((ownership ?? []) as { nft_id: string; owner_id: string }[])
            .map(({ nft_id, owner_id }) => [nft_id, owner_id])
        );

        /* Keep NFTs where: no ownership record (never sold)
                         OR ownership record points back to creator */
        const stillOwned = (created as NFTRow[]).filter((n) => {
          const current = ownerMap.get(n.id);
          return !current || current === uid;
        });

        setNfts(stillOwned);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const isEmpty = !loading && !profileLoading && nfts !== null && nfts.length === 0;
  const totalEarnings = nfts?.reduce((s, n) => s + Number(n.price), 0).toFixed(2) ?? "0.00";

  return (
    <>
      <div className="db-page-header">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", width:"100%" }}>
          <div>
            <h1 className="db-page-title">Created</h1>
            <p className="db-page-sub">
              {loading || profileLoading
                ? "Loading…"
                : nfts?.length
                  ? `${nfts.length} NFT${nfts.length !== 1 ? "s" : ""} minted · ${totalEarnings} ETH listed value`
                  : "No NFTs created yet"}
            </p>
          </div>
          <Link href="/create" className="btn btn-gradient btn-sm" style={{ borderRadius:"9999px", flexShrink:0 }}>
            + Mint New NFT
          </Link>
        </div>
      </div>

      <div className="db-page-body">

        {/* Empty state */}
        {isEmpty && (
          <div style={{ textAlign:"center", padding:"5rem 1rem" }}>
            <p style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🎨</p>
            <p className="text-title" style={{ marginBottom:"0.625rem", color:"var(--text-primary)" }}>
              No NFTs minted yet
            </p>
            <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", marginBottom:"1.75rem", maxWidth:"40ch", margin:"0 auto 1.75rem" }}>
              Start creating and your minted works will appear here.
            </p>
            <Link href="/create" className="btn btn-gradient" style={{ borderRadius:"9999px" }}>
              Mint Your First NFT
            </Link>
          </div>
        )}

        {/* Creator stats */}
        {nfts && nfts.length > 0 && (
          <>
            <div className="db-stats-grid" style={{ marginBottom:"2rem" }}>
              {[
                { label:"Total Created",  value: String(nfts.length) },
                { label:"Listed Value",   value: `${totalEarnings} ETH` },
                { label:"Auctions Live",  value: String(nfts.filter(n=>n.is_live).length)   },
                { label:"Buy Now",        value: String(nfts.filter(n=>n.status==="buy-now").length) },
              ].map((s) => (
                <div key={s.label} className="db-stat-card">
                  <p className="db-stat-card__label">{s.label}</p>
                  <p className="db-stat-card__value" style={{ fontSize:"1.375rem" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* NFT grid — isOwned shows Sell instead of Buy */}
            <div className="grid-nft">
              {nfts.map((nft) => (
                <div key={nft.id} style={{ position:"relative" }}>
                  <NFTCard {...rowToCard(nft)} isOwned />
                  <div style={{ position:"absolute", top:"0.75rem", left:"0.75rem", zIndex:3 }}>
                    <button
                      className="btn btn-sm"
                      style={{ background:"rgba(0,0,0,0.65)", backdropFilter:"blur(8px)", color:"#fff", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"9999px", fontSize:"0.75rem", padding:"0.25rem 0.75rem" }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}

              {/* Add more card */}
              <Link
                href="/create"
                style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", aspectRatio:"1", background:"var(--bg-surface)", border:"2px dashed var(--border)", borderRadius:"var(--radius-2xl)", color:"var(--text-muted)", gap:"0.75rem", textDecoration:"none", fontSize:"0.9375rem", fontWeight:600, transition:"border-color 200ms ease, color 200ms ease, background 200ms ease" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor="var(--accent-border)"; el.style.color="var(--accent)"; el.style.background="var(--accent-muted)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor="var(--border)"; el.style.color="var(--text-muted)"; el.style.background="var(--bg-surface)"; }}
              >
                <span style={{ fontSize:"2rem", lineHeight:1 }}>+</span>
                Mint New NFT
              </Link>
            </div>
          </>
        )}

      </div>
    </>
  );
}
