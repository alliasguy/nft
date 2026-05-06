"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import SectionHeading          from "@/components/SectionHeading";
import NFTCard                 from "@/components/NFTCard";
import Footer                  from "@/components/Footer";
import { createClient }        from "@/lib/supabase/client";
import { rowToNftItem }        from "@/lib/supabaseToNft";
import { ALL_NFTS }            from "@/lib/mockData";
import type { NFTItem }        from "@/lib/mockData";

function gradient(nft: NFTItem) {
  return `linear-gradient(135deg, ${nft.art.stops[0]} 0%, ${nft.art.stops[1]} 100%)`;
}

/* Group NFTs by collection_name */
function buildCollections(items: NFTItem[]) {
  const map = new Map<string, NFTItem[]>();
  items.forEach((n) => {
    /* Trim whitespace so "Bloom Protocol " and "Bloom Protocol" are the same key */
    const key = (n.collection || "Uncategorised").trim();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(n);
  });
  return Array.from(map.entries())
    .filter(([, nfts]) => nfts.length > 0)
    .map(([name, nfts]) => ({
      /* Use the raw name as the key — it is already unique from the Map */
      id:          name,
      name,
      description: `${nfts.length} item${nfts.length !== 1 ? "s" : ""} in this collection`,
      items:       nfts,
      floorPrice:  Math.min(...nfts.map((n) => parseFloat(n.price))).toFixed(2),
      volume:      nfts.reduce((s, n) => s + parseFloat(n.price), 0).toFixed(1),
    }));
}

/* Mock fallback collections */
const MOCK_COLLECTIONS = buildCollections(ALL_NFTS);

export default function CollectionsPage() {
  const [collections, setCollections] = useState(MOCK_COLLECTIONS);
  const [isLive,      setIsLive]      = useState(false);

  useEffect(() => {
    const sb = createClient() as any;
    async function load() {
      const { data, error } = await sb
        .from("nfts")
        .select("*")
        .eq("mod_status", "approved")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!error && data && data.length > 0) {
        /* User-created NFTs first */
        const sorted = [...(data as any[])].sort((a, b) => {
          if (!!a.creator_id !== !!b.creator_id) return a.creator_id ? -1 : 1;
          return 0;
        });
        const items: NFTItem[] = sorted.map((r: any) => rowToNftItem(r));
        const live = buildCollections(items);
        if (live.length > 0) { setCollections(live); setIsLive(true); }
      }
    }
    load();
  }, []);

  return (
    <>
      <div className="container section">

        <div style={{ marginBottom: "3rem" }}>
          <SectionHeading
            label="Curated drops"
            title="Collections"
            highlight="Collections"
            subtitle={`${isLive ? "Live" : "Demo"} — curated groupings from the world's most innovative digital artists.`}
          />
        </div>

        {collections.map((col) => (
          <div
            key={col.id}
            style={{
              marginBottom: "4rem",
              paddingBottom: "4rem",
              borderBottom: "1px solid var(--border-muted)",
            }}
          >
            {/* Collection header */}
            <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between",
              gap:"1.5rem", flexWrap:"wrap", marginBottom:"1.5rem" }}>
              <div>
                <p className="text-label" style={{ marginBottom:"0.375rem" }}>
                  {col.items.length} item{col.items.length !== 1 ? "s" : ""}
                </p>
                <h2 className="text-title">{col.name}</h2>
                <p className="text-body-sm" style={{ marginTop:"0.375rem", maxWidth:"55ch" }}>
                  {col.description}
                </p>
                <div style={{ display:"flex", gap:"1.5rem", marginTop:"0.875rem", flexWrap:"wrap" }}>
                  <div>
                    <span className="text-label">Floor</span>
                    <p style={{ fontWeight:700, color:"var(--text-primary)", marginTop:"0.125rem" }}>
                      {col.floorPrice} ETH
                    </p>
                  </div>
                  <div>
                    <span className="text-label">Volume</span>
                    <p style={{ fontWeight:700, color:"var(--text-primary)", marginTop:"0.125rem" }}>
                      {col.volume} ETH
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/explore" className="btn btn-secondary btn-sm">
                View all in Explore →
              </Link>
            </div>

            {/* NFT cards — up to 4 per collection */}
            <div className="grid-nft">
              {col.items.slice(0, 4).map((nft) => (
                <NFTCard
                  key={nft.id}
                  href={`/nft/${nft.id}`}
                  title={nft.title}
                  creator={{ name: nft.creator.name }}
                  price={nft.price}
                  likes={nft.likes}
                  badge={nft.badge}
                  image={nft.image_url ?? undefined}
                  gradient={gradient(nft)}
                />
              ))}
            </div>
          </div>
        ))}

      </div>
      <Footer />
    </>
  );
}
