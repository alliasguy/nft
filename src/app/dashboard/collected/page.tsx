"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import NFTCard                 from "@/components/NFTCard";
import { useProfile }          from "@/hooks/useProfile";
import { createClient }        from "@/lib/supabase/client";
import { rowToCard }           from "@/lib/nftAdapter";
import { ALL_NFTS }            from "@/lib/mockData";
import type { NFTRow }         from "@/lib/database.types";

const MOCK_IDS   = ["2","4","7","9","11","12","14","16"];
const MOCK_NFTS  = ALL_NFTS.filter((n) => MOCK_IDS.includes(n.id));

function mockGradient(nft: (typeof ALL_NFTS)[number]) {
  return `linear-gradient(135deg, ${nft.art.stops[0]} 0%, ${nft.art.stops[1]} 100%)`;
}

export default function CollectedPage() {
  const { userId, loading: profileLoading } = useProfile();
  const [nfts,    setNfts]    = useState<NFTRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const uid = userId; // narrowed to string
    const sb  = createClient();
    async function load() {
      try {
        const { data: ownership } = await sb
          .from("nft_ownership")
          .select("nft_id")
          .eq("owner_id", uid) as { data: { nft_id: string }[] | null };

        if (!ownership?.length) { setNfts([]); return; }

        const ids = ownership.map((o) => o.nft_id);
        const { data } = await sb.from("nfts").select("*").in("id", ids);
        setNfts((data as NFTRow[]) ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const isDemo    = !profileLoading && nfts !== null && nfts.length === 0;
  const display   = nfts?.length ? nfts : null;
  const totalEth  = nfts?.reduce((s, n) => s + Number(n.price), 0).toFixed(2) ?? "0.00";

  return (
    <>
      <div className="db-page-header">
        <h1 className="db-page-title">Collected</h1>
        <p className="db-page-sub">
          {loading || profileLoading
            ? "Loading your collection…"
            : nfts?.length
              ? `${nfts.length} NFT${nfts.length !== 1 ? "s" : ""} · estimated value ${totalEth} ETH`
              : "No NFTs collected yet — demo data shown below"}
        </p>
      </div>

      <div className="db-page-body">

        {/* Demo notice */}
        {isDemo && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.875rem 1.125rem", background:"var(--accent-muted)", border:"1px solid var(--accent-border)", borderRadius:"var(--radius-lg)", marginBottom:"1.5rem", fontSize:"0.9375rem", color:"var(--accent-light)" }}>
            <span>💡</span>
            <span>
              You haven&apos;t collected any NFTs yet — showing <strong>demo data</strong>.{" "}
              <Link href="/explore" style={{ color:"var(--accent)", fontWeight:700, textDecoration:"underline" }}>
                Browse the marketplace
              </Link>{" "}
              to add your first piece.
            </span>
          </div>
        )}

        {/* Sort / filter bar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
          <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
            {["All","Art","Music","Virtual Worlds","Photography","Gaming"].map((c, i) => (
              <button
                key={c}
                className={`btn btn-sm ${i === 0 ? "btn-primary" : "btn-secondary"}`}
                style={{ borderRadius:"9999px", fontSize:"0.8125rem" }}
              >
                {c}
              </button>
            ))}
          </div>
          <select className="select" style={{ fontSize:"0.875rem" }}>
            <option>Recently Acquired</option>
            <option>Price: High to Low</option>
            <option>Price: Low to High</option>
            <option>Most Liked</option>
          </select>
        </div>

        {/* NFT Grid — isOwned hides Buy and shows Sell */}
        <div className="grid-nft">
          {display
            ? display.map((nft) => <NFTCard key={nft.id} {...rowToCard(nft)} isOwned />)
            : MOCK_NFTS.map((nft) => (
                <NFTCard
                  key={nft.id}
                  href={`/nft/${nft.id}`}
                  title={nft.title}
                  creator={{ name: nft.creator.name }}
                  price={nft.price}
                  likes={nft.likes}
                  badge={nft.badge}
                  isLive={nft.isLive}
                  gradient={mockGradient(nft)}
                  isOwned
                />
              ))
          }
        </div>

      </div>
    </>
  );
}
