"use client";

import { useState, useEffect } from "react";
import { createClient }        from "@/lib/supabase/client";
import { timeAgo }             from "@/lib/supabaseToNft";

/* ── Mock fallback data (used when Supabase is unreachable) ─ */
const MOCK_VOL_BARS   = [42,65,38,80,55,70,90,48,75,88,60,95,72,85];
const MOCK_TX_BARS    = [55,70,48,82,65,78,91,60,74,86,68,94,77,88];

/* ── Types ───────────────────────────────────────────────── */
interface Analytics {
  user_count:        number;
  nft_count:         number;
  total_volume_eth:  number;
  volume_24h_eth:    number;
  volume_prev_24h:   number;
  platform_fees_eth: number;
  new_nfts_24h:      number;
  pending_deposits:  number;
  fee_pct:           number;
}
interface Seller {
  id: string; name: string; handle: string; gradient: string; volume: number;
}
interface Transaction {
  id: string; event_type: string; amount: number; nft_title: string | null;
  created_at: string; art_stop_1: string | null; art_stop_2: string | null;
  user_handle: string | null; user_name: string | null;
}
interface DayVolume { day: string; volume: number; tx_count: number; }

/* ── Helpers ─────────────────────────────────────────────── */
const ETH_USD = 3_900;

function usd(eth: number) {
  return (eth * ETH_USD).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function pctChange(now: number, prev: number): string {
  if (!prev) return now > 0 ? "▲ New activity" : "No activity yet";
  const pct = ((now - prev) / prev) * 100;
  return `${pct >= 0 ? "▲" : "▼"} ${Math.abs(pct).toFixed(1)}% vs previous 24h`;
}

/** Normalise an array of values to 4–100 for bar heights */
function toBars(values: number[], target = 14): number[] {
  const max = Math.max(...values, 0.001);
  const out = values.map((v) => Math.max(4, Math.round((v / max) * 100)));
  // Pad with 0 bars on the left if fewer than target days
  while (out.length < target) out.unshift(4);
  return out.slice(-target);
}

/* ── Mini bar chart component ────────────────────────────── */
function MiniChart({ bars, accent = false }: { bars: number[]; accent?: boolean }) {
  return (
    <div className="adm-chart">
      {bars.map((h, i) => (
        <div key={i} className={`adm-bar${accent ? " adm-bar--accent" : ""}`} style={{ height:`${h}%` }} />
      ))}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function AdminAnalyticsPage() {
  const [analytics,     setAnalytics]     = useState<Analytics | null>(null);
  const [sellers,       setSellers]       = useState<Seller[]>([]);
  const [transactions,  setTransactions]  = useState<Transaction[]>([]);
  const [volBars,       setVolBars]       = useState<number[]>(MOCK_VOL_BARS);
  const [txBars,        setTxBars]        = useState<number[]>(MOCK_TX_BARS);
  const [loading,       setLoading]       = useState(true);
  const [isLive,        setIsLive]        = useState(false);
  const [lastRefresh,   setLastRefresh]   = useState<Date | null>(null);

  async function fetchAll() {
    setLoading(true);
    const sb  = createClient();
    const sba = sb as any;

    try {
      const [statsRes, sellersRes, txRes, volRes] = await Promise.all([
        sba.rpc("get_admin_analytics"),
        sba.rpc("get_top_sellers",          { p_limit: 8  }),
        sba.rpc("get_recent_transactions",  { p_limit: 12 }),
        sba.rpc("get_daily_volume",         { p_days:  14 }),
      ]);

      if (statsRes.data && !(statsRes.data as any).error) {
        setAnalytics(statsRes.data as Analytics);
        setIsLive(true);
        setLastRefresh(new Date());
      }
      if (Array.isArray(sellersRes.data))     setSellers(sellersRes.data   as Seller[]);
      if (Array.isArray(txRes.data))          setTransactions(txRes.data   as Transaction[]);

      if (Array.isArray(volRes.data) && (volRes.data as DayVolume[]).length > 0) {
        const days = volRes.data as DayVolume[];
        setVolBars(toBars(days.map((d) => d.volume)));
        setTxBars(toBars(days.map((d) => d.tx_count)));
      }
    } catch {
      /* Network error — keep mock fallback already rendered */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  /* ── Derived metric cards ── */
  const metrics = analytics
    ? [
        {
          icon:"💎", label:"Total Platform Volume",
          value: analytics.total_volume_eth > 0
            ? `$${usd(analytics.total_volume_eth)}`
            : "$0",
          change: `${analytics.total_volume_eth.toFixed(4)} ETH all-time`,
          up: true,
        },
        {
          icon:"⚡", label:"24h Trading Volume",
          value: `$${usd(analytics.volume_24h_eth)}`,
          change: pctChange(analytics.volume_24h_eth, analytics.volume_prev_24h),
          up: analytics.volume_24h_eth >= analytics.volume_prev_24h,
        },
        {
          icon:"👥", label:"Registered Users",
          value: analytics.user_count.toLocaleString(),
          change: `${analytics.new_nfts_24h} new NFTs minted today`,
          up: true,
        },
        {
          icon:"💰", label:"Platform Fees (ETH)",
          value: analytics.platform_fees_eth > 0
            ? `${analytics.platform_fees_eth.toFixed(4)} ETH`
            : "0.0000 ETH",
          change: `${analytics.fee_pct}% of ${analytics.total_volume_eth.toFixed(4)} ETH volume`,
          up: true,
        },
        {
          icon:"🖼️", label:"Total NFTs Listed",
          value: analytics.nft_count.toLocaleString(),
          change: `${analytics.new_nfts_24h} minted in last 24h`,
          up: true,
        },
        {
          icon:"📥", label:"Pending Deposits",
          value: analytics.pending_deposits.toLocaleString(),
          change: analytics.pending_deposits > 0 ? "Requires admin action" : "All clear",
          up: analytics.pending_deposits === 0,
        },
      ]
    : [
        { icon:"💎", label:"Total Platform Volume",  value:"—", change:"Loading…", up:true },
        { icon:"⚡", label:"24h Trading Volume",      value:"—", change:"Loading…", up:true },
        { icon:"👥", label:"Registered Users",        value:"—", change:"Loading…", up:true },
        { icon:"💰", label:"Platform Fees (ETH)",    value:"—", change:"Loading…", up:true },
        { icon:"🖼️", label:"Total NFTs Listed",      value:"—", change:"Loading…", up:true },
        { icon:"📥", label:"Pending Deposits",        value:"—", change:"Loading…", up:true },
      ];

  const EVENT_COLOR: Record<string, { bg:string; color:string; border:string }> = {
    purchase: { bg:"rgba(16,185,129,0.1)",  color:"#34d399", border:"rgba(16,185,129,0.25)" },
    sale:     { bg:"var(--accent-muted)",   color:"var(--accent)", border:"var(--accent-border)" },
    mint:     { bg:"var(--accent2-muted)",  color:"var(--accent2-light)", border:"var(--accent2-border)" },
  };

  return (
    <>
      {/* ── Page header ── */}
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Analytics Overview</h1>
          <p className="adm-page-sub">
            {isLive
              ? `Live data · Refreshed ${lastRefresh ? lastRefresh.toLocaleTimeString() : "just now"}`
              : loading ? "Fetching live data…" : "Showing cached data"}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          {isLive && (
            <span style={{ fontSize:"0.75rem", color:"var(--accent)", fontWeight:600, display:"flex", alignItems:"center", gap:"0.375rem" }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:"var(--accent)", display:"inline-block" }} />
              LIVE
            </span>
          )}
          <button
            className="btn btn-secondary btn-sm"
            style={{ borderRadius:"9999px", fontSize:"0.8125rem" }}
            onClick={fetchAll}
            disabled={loading}
          >
            {loading ? "Refreshing…" : "↻ Refresh"}
          </button>
          <span className="adm-mode-badge">
            <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--gold)",display:"inline-block",boxShadow:"0 0 6px var(--gold)" }}/>
            Admin Mode Active
          </span>
        </div>
      </div>

      <div className="adm-page-body">

        {/* ── KPI Cards ── */}
        <div className="adm-section">
          <p className="adm-section-title">Platform Metrics</p>
          <div className="adm-metrics-grid">
            {metrics.map((m) => (
              <div key={m.label} className="adm-metric">
                <div className="adm-metric__icon">{m.icon}</div>
                <p className="adm-metric__label">{m.label}</p>
                <p className="adm-metric__value" style={{ fontSize: loading ? "1.25rem" : undefined }}>
                  {m.value}
                </p>
                <p className={`adm-metric__change adm-metric__change--${m.up ? "up" : "dn"}`}>
                  {m.up ? "▲" : "▼"} {m.change}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Volume Charts ── */}
        <div className="adm-section">
          <p className="adm-section-title">
            Volume Trends — last 14 days
            {!isLive && <span style={{ marginLeft:"0.5rem", fontSize:"0.75rem", color:"var(--text-muted)", textTransform:"none", letterSpacing:0 }}>(demo)</span>}
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px,1fr))", gap:"1rem" }}>
            {[
              { title:"Daily Trading Volume (ETH)", bars:volBars, accent:false },
              { title:"Daily Transactions",         bars:txBars,  accent:true  },
            ].map(({ title, bars, accent }) => (
              <div key={title} style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)", padding:"1.25rem" }}>
                <p style={{ fontWeight:700, fontSize:"0.9375rem", color:"var(--text-primary)", marginBottom:"0.75rem" }}>
                  {title}
                </p>
                <MiniChart bars={bars} accent={accent} />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:"0.5rem" }}>
                  {["14d ago","10d ago","7d ago","3d ago","today"].map((l) => (
                    <span key={l} style={{ fontSize:"0.625rem", color:"var(--text-muted)" }}>{l}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="adm-section">
          <p className="adm-section-title">
            Recent Transactions
            {isLive && transactions.length > 0 && (
              <span style={{ marginLeft:"0.5rem", fontSize:"0.75rem", color:"var(--text-muted)", textTransform:"none", letterSpacing:0 }}>
                {transactions.length} events
              </span>
            )}
          </p>

          {/* Empty state */}
          {!loading && isLive && transactions.length === 0 && (
            <div style={{ textAlign:"center", padding:"3rem 1rem", color:"var(--text-muted)" }}>
              <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>📭</p>
              <p>No transactions yet. Activity will appear here once users start buying and minting NFTs.</p>
            </div>
          )}

          {/* Table */}
          {(transactions.length > 0 || loading) && (
            <div className="adm-table-wrap">
              <table className="adm-table" style={{ minWidth:600 }}>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Item</th>
                    <th>User</th>
                    <th>Amount</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && transactions.length === 0 ? (
                    /* Skeleton rows */
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 5 }).map((_, j) => (
                          <td key={j}>
                            <div className="skeleton" style={{ height:"1rem", width: j === 1 ? "140px" : "80px" }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    transactions.map((tx) => {
                      const ec = EVENT_COLOR[tx.event_type] ?? EVENT_COLOR.purchase;
                      const stop1 = tx.art_stop_1 ?? "#333";
                      const stop2 = tx.art_stop_2 ?? "#666";
                      return (
                        <tr key={tx.id}>
                          {/* Event type */}
                          <td>
                            <span style={{ fontSize:"0.75rem", fontWeight:700, padding:"0.125rem 0.5rem", borderRadius:"9999px", background:ec.bg, color:ec.color, border:`1px solid ${ec.border}`, whiteSpace:"nowrap" }}>
                              {tx.event_type === "purchase" ? "🛍️ Purchase"
                               : tx.event_type === "sale"  ? "💰 Sale"
                               :                             "🎨 Mint"}
                            </span>
                          </td>

                          {/* NFT */}
                          <td>
                            <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
                              <div style={{ width:"2rem", height:"2rem", borderRadius:"0.375rem", flexShrink:0, background:`linear-gradient(135deg,${stop1},${stop2})` }} />
                              <span style={{ color:"var(--text-primary)", fontWeight:500, fontSize:"0.875rem", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:160 }}>
                                {tx.nft_title ?? "—"}
                              </span>
                            </div>
                          </td>

                          {/* User */}
                          <td style={{ fontFamily:"var(--font-mono)", fontSize:"0.8125rem" }}>
                            {tx.user_handle ? `@${tx.user_handle}` : tx.user_name ?? "—"}
                          </td>

                          {/* Amount */}
                          <td style={{ fontWeight:700, color: tx.event_type === "sale" ? "var(--accent)" : "var(--text-primary)", whiteSpace:"nowrap" }}>
                            {tx.amount > 0 ? `${tx.amount} ETH` : "—"}
                          </td>

                          {/* Time */}
                          <td style={{ fontSize:"0.8125rem", color:"var(--text-muted)", whiteSpace:"nowrap" }}>
                            {timeAgo(tx.created_at)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Top Sellers ── */}
        <div className="adm-section">
          <p className="adm-section-title">
            Top Earners
            {!isLive && <span style={{ marginLeft:"0.5rem", fontSize:"0.75rem", color:"var(--text-muted)", textTransform:"none", letterSpacing:0 }}>(by sales revenue)</span>}
          </p>

          {isLive && sellers.every((s) => s.volume === 0) && (
            <p style={{ fontSize:"0.9375rem", color:"var(--text-muted)", marginBottom:"1rem" }}>
              No sales recorded yet. Rankings will appear once users start selling NFTs.
            </p>
          )}

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(260px,1fr))", gap:"0.5rem" }}>
            {(sellers.length > 0 ? sellers : Array.from({ length: 6 }).map((_, i) => ({
              id: String(i), name:"—", handle:"loading", gradient:"linear-gradient(135deg,#333,#444)", volume:0,
            }))).map((s, i) => (
              <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"0.875rem", padding:"0.75rem 1rem", background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)" }}>
                <span style={{ fontSize:"0.75rem", fontWeight:700, color:"var(--text-muted)", width:"1.25rem", textAlign:"center", flexShrink:0 }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </span>
                <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"50%", background:s.gradient, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.5625rem", fontWeight:800, color:"#fff" }}>
                  {s.name ? s.name.slice(0, 2).toUpperCase() : "??"}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontWeight:600, fontSize:"0.875rem", color:"var(--text-primary)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                    {s.name || "—"}
                  </p>
                  <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>@{s.handle}</p>
                </div>
                <span style={{ fontWeight:700, fontSize:"0.875rem", color: s.volume > 0 ? "var(--accent)" : "var(--text-muted)", flexShrink:0, whiteSpace:"nowrap" }}>
                  {s.volume > 0 ? `${s.volume.toFixed(4)} ETH` : "0 ETH"}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
