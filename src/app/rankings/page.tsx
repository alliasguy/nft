import Footer      from "@/components/Footer";
import TopSellers  from "@/components/TopSellers";
import SectionHeading from "@/components/SectionHeading";

const PERIODS = ["24h", "7d", "30d", "All time"] as const;

export default function RankingsPage() {
  return (
    <>
      <div className="container section">

        {/* ── Header ── */}
        <div style={{ marginBottom: "2.5rem" }}>
          <SectionHeading
            label="On-chain verified"
            title="Top Sellers"
            highlight="Top"
            subtitle="Ranked by verified trading volume. Standings refresh every hour from on-chain data. Only completed sales count."
          />
        </div>

        {/* ── Period tabs ── */}
        <div
          style={{
            display: "flex",
            gap: "0.375rem",
            marginBottom: "2rem",
            padding: "0.25rem",
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-lg)",
            width: "fit-content",
          }}
        >
          {PERIODS.map((p, i) => (
            <button
              key={p}
              className={`btn btn-sm ${i === 2 ? "btn-primary" : "btn-ghost"}`}
              style={{ borderRadius: "calc(var(--radius-lg) - 0.125rem)", minWidth: "5rem" }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* ── Column headers ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.25rem 2.75rem 1fr auto",
            gap: "0.875rem",
            padding: "0.5rem 0.875rem",
            marginBottom: "0.25rem",
          }}
        >
          <span className="text-label">#</span>
          <span />
          <span className="text-label">Creator</span>
          <span className="text-label" style={{ textAlign: "right" }}>Volume / 24h Change</span>
        </div>

        {/* ── Table ── */}
        <TopSellers />

        {/* ── Footer note ── */}
        <p
          style={{
            marginTop: "2rem",
            fontSize: "0.8125rem",
            color: "var(--text-muted)",
            textAlign: "center",
          }}
        >
          Volume figures are denominated in ETH and sourced directly from on-chain transaction data.
          Wash trades are filtered automatically.
        </p>

      </div>
      <Footer />
    </>
  );
}
