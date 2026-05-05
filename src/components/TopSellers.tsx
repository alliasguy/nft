const SELLERS = [
  { rank: 1,  name: "CryptoMaestro",  handle: "@crypto_maestro",  volume: "125.4",  change: "+12.5", up: true,  grad: "135deg,#e11d48,#c026d3" },
  { rank: 2,  name: "DigitalNomad",   handle: "@digital_nomad",   volume: "98.2",   change: "+8.3",  up: true,  grad: "135deg,#3b82f6,#06b6d4" },
  { rank: 3,  name: "VoidWalker",     handle: "@void_walker",     volume: "87.6",   change: "-2.1",  up: false, grad: "135deg,#f59e0b,#ef4444" },
  { rank: 4,  name: "NeonDreamer",    handle: "@neon_dreamer",    volume: "74.3",   change: "+15.2", up: true,  grad: "135deg,#10b981,#3b82f6" },
  { rank: 5,  name: "PixelMage",      handle: "@pixel_mage",      volume: "65.9",   change: "+6.7",  up: true,  grad: "135deg,#8b5cf6,#ec4899" },
  { rank: 6,  name: "SolarArtist",    handle: "@solar_artist",    volume: "54.2",   change: "+3.4",  up: true,  grad: "135deg,#f97316,#fbbf24" },
  { rank: 7,  name: "FractalLabs",    handle: "@fractal_labs",    volume: "48.7",   change: "-1.8",  up: false, grad: "135deg,#a855f7,#3b82f6" },
  { rank: 8,  name: "CathArt",        handle: "@cath_art",        volume: "41.3",   change: "+9.1",  up: true,  grad: "135deg,#0ea5e9,#6366f1" },
  { rank: 9,  name: "0xCreative",     handle: "@0x_creative",     volume: "35.8",   change: "+22.4", up: true,  grad: "135deg,#ec4899,#f43f5e" },
  { rank: 10, name: "MetaForge",      handle: "@meta_forge",      volume: "28.4",   change: "-4.2",  up: false, grad: "135deg,#64748b,#334155" },
];

function RankDisplay({ rank }: { rank: number }) {
  const cls = rank <= 3 ? ` seller-rank--${rank}` : "";
  /* Unicode medal symbols for top 3 */
  const label = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : String(rank);
  return <span className={`seller-rank${cls}`}>{label}</span>;
}

export default function TopSellers() {
  return (
    <div className="sellers-grid">
      {SELLERS.map((s) => {
        const initials = s.name.slice(0, 2).toUpperCase();
        return (
          <div key={s.rank} className="seller-row">

            <RankDisplay rank={s.rank} />

            {/* Avatar */}
            <div className="seller-avatar-wrap">
              <div
                className="seller-avatar"
                style={{ background: `linear-gradient(${s.grad})` }}
                aria-hidden
              >
                <span style={{
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: "0.6875rem",
                  letterSpacing: "0.03em",
                }}>
                  {initials}
                </span>
              </div>
            </div>

            {/* Name & handle */}
            <div className="seller-info">
              <p className="seller-name">{s.name}</p>
              <p className="seller-handle">{s.handle}</p>
            </div>

            {/* Volume & change */}
            <div className="seller-stats">
              <p className="seller-volume">{s.volume} ETH</p>
              <p className={`seller-change seller-change--${s.up ? "up" : "down"}`}>
                {s.up ? "▲" : "▼"} {s.change.replace(/[+-]/, "")}%
              </p>
            </div>

          </div>
        );
      })}
    </div>
  );
}
