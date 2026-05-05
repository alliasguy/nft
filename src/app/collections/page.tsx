import Link          from "next/link";
import SectionHeading from "@/components/SectionHeading";
import NFTCard        from "@/components/NFTCard";
import Footer         from "@/components/Footer";
import { ALL_NFTS }   from "@/lib/mockData";

/* Group the 16 mock NFTs into 4 "collections" */
const COLLECTIONS = [
  {
    id:          "bloom-protocol",
    name:        "Bloom Protocol",
    description: "A meditation on emergence and entropy — ten generative pieces exploring the lifecycle of digital matter.",
    items:       ALL_NFTS.filter((n) => n.collection === "Bloom Protocol" || n.collection === "Cosmos Series" || n.collection === "Corona Series"),
    cover:       ALL_NFTS[0],
    floorPrice:  "0.95",
    volume:      "48.2",
  },
  {
    id:          "silicon-dreams",
    name:        "Silicon Dreams",
    description: "Virtual worlds and digital architectures rendered from live infrastructure data and neural-net topologies.",
    items:       ALL_NFTS.filter((n) => ["Silicon Dreams", "AI Series", "Kepler Series"].includes(n.collection)),
    cover:       ALL_NFTS[5],
    floorPrice:  "0.65",
    volume:      "32.8",
  },
  {
    id:          "sonic-series",
    name:        "Sonic & BeatForge",
    description: "Music visualised as on-chain art — each piece encodes unreleased audio stems, spectral data, and sync licences.",
    items:       ALL_NFTS.filter((n) => ["Sonic Series", "Pacific Series", "BeatForge Records"].includes(n.collection)),
    cover:       ALL_NFTS[3],
    floorPrice:  "0.95",
    volume:      "21.4",
  },
  {
    id:          "refraction",
    name:        "Refraction",
    description: "Light, optics, and long-exposure photography transcribed into generative geometry. Science made collectible.",
    items:       ALL_NFTS.filter((n) => ["Refraction", "Schlieren Series"].includes(n.collection)),
    cover:       ALL_NFTS[7],
    floorPrice:  "0.45",
    volume:      "14.6",
  },
];

function gradient(nft: (typeof ALL_NFTS)[number]) {
  return `linear-gradient(135deg, ${nft.art.stops[0]} 0%, ${nft.art.stops[1]} 100%)`;
}

export default function CollectionsPage() {
  return (
    <>
      <div className="container section">

        {/* ── Page heading ── */}
        <div style={{ marginBottom: "3rem" }}>
          <SectionHeading
            label="Curated drops"
            title="Collections"
            highlight="Collections"
            subtitle="Hand-picked groupings of works from the world's most innovative digital artists. Each collection tells a complete story."
          />
        </div>

        {/* ── Collections list ── */}
        {COLLECTIONS.map((col) => (
          <div
            key={col.id}
            style={{
              marginBottom: "4rem",
              paddingBottom: "4rem",
              borderBottom: "1px solid var(--border-muted)",
            }}
          >
            {/* Collection header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "1.5rem",
                flexWrap: "wrap",
                marginBottom: "1.5rem",
              }}
            >
              <div>
                <p className="text-label" style={{ marginBottom: "0.375rem" }}>
                  {col.items.length} item{col.items.length !== 1 ? "s" : ""}
                </p>
                <h2 className="text-title">{col.name}</h2>
                <p className="text-body-sm" style={{ marginTop: "0.375rem", maxWidth: "55ch" }}>
                  {col.description}
                </p>
                <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.875rem", flexWrap: "wrap" }}>
                  <div>
                    <span className="text-label">Floor</span>
                    <p style={{ fontWeight: 700, color: "var(--text-primary)", marginTop: "0.125rem" }}>
                      {col.floorPrice} ETH
                    </p>
                  </div>
                  <div>
                    <span className="text-label">Volume</span>
                    <p style={{ fontWeight: 700, color: "var(--text-primary)", marginTop: "0.125rem" }}>
                      {col.volume} ETH
                    </p>
                  </div>
                </div>
              </div>
              <Link href="/explore" className="btn btn-secondary btn-sm">
                View all in Explore →
              </Link>
            </div>

            {/* NFT cards */}
            <div className="grid-nft">
              {col.items.slice(0, 4).map((nft) => (
                <NFTCard
                  key={nft.id}
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
              ))}
            </div>
          </div>
        ))}

      </div>
      <Footer />
    </>
  );
}
