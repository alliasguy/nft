"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { useProfile }          from "@/hooks/useProfile";
import { createClient }        from "@/lib/supabase/client";
import { ALL_NFTS }            from "@/lib/mockData";
import type { ActivityLog }    from "@/lib/database.types";

/* Fallback mock data */
const MOCK: {
  type: ActivityLog["event_type"];
  icon: string;
  title: string;
  nft: (typeof ALL_NFTS)[number];
  amount?: string;
  time: string;
  txHash: string;
}[] = [
  { type:"purchase", icon:"🛍️", title:"Purchased",  nft:ALL_NFTS[1],  amount:"2.45 ETH",  time:"2 hrs ago",   txHash:"0xa3f2…c91d" },
  { type:"bid",      icon:"⚡",  title:"Bid placed", nft:ALL_NFTS[0],  amount:"11.80 ETH", time:"4 hrs ago",   txHash:"0x7e81…4f02" },
  { type:"sale",     icon:"💰",  title:"Sold",        nft:ALL_NFTS[6],  amount:"5.50 ETH",  time:"2 days ago",  txHash:"0xbc44…9a11" },
  { type:"bid",      icon:"⚡",  title:"Bid placed", nft:ALL_NFTS[9],  amount:"2.00 ETH",  time:"3 days ago",  txHash:"0x2f3a…7d50" },
  { type:"purchase", icon:"🛍️", title:"Purchased",  nft:ALL_NFTS[3],  amount:"0.95 ETH",  time:"5 days ago",  txHash:"0x98f1…c3e7" },
  { type:"mint",     icon:"🎨",  title:"Minted",     nft:ALL_NFTS[4],  amount:"0 ETH",     time:"8 days ago",  txHash:"0x41cd…8b2a" },
  { type:"like",     icon:"❤️",  title:"Liked",      nft:ALL_NFTS[14],                     time:"9 days ago",  txHash:"off-chain"   },
  { type:"sale",     icon:"🔄", title:"Transferred",  nft:ALL_NFTS[10],                     time:"12 days ago", txHash:"0x65ab…f1c3" },
  { type:"sale",     icon:"💰",  title:"Sold",        nft:ALL_NFTS[7],  amount:"1.15 ETH",  time:"15 days ago", txHash:"0xd0e2…5519" },
  { type:"bid",      icon:"⚡",  title:"Bid placed", nft:ALL_NFTS[5],  amount:"0.48 ETH",  time:"18 days ago", txHash:"0x3c71…aa4f" },
];

const EVENT_ICON: Record<ActivityLog["event_type"] | "transfer", string> = {
  purchase:"🛍️", sale:"💰", bid:"⚡", mint:"🎨", like:"❤️", list:"📋", follow:"👤", transfer:"🔄",
};

const FILTERS = ["All","Purchase","Sale","Bid","Mint","Transfer"] as const;

export default function ActivityPage() {
  const { userId, loading: profileLoading } = useProfile();
  const [activity, setActivity] = useState<ActivityLog[] | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<typeof FILTERS[number]>("All");

  useEffect(() => {
    if (!userId) return;
    const uid = userId; // narrowed to string
    const sb  = createClient();
    async function load() {
      try {
        const { data } = await sb
          .from("activity_log")
          .select("*")
          .eq("user_id", uid)
          .order("created_at", { ascending: false })
          .limit(50);
        setActivity((data as ActivityLog[]) ?? []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  const isDemo   = !profileLoading && activity !== null && activity.length === 0;
  const hasReal  = activity && activity.length > 0;

  /* Filter real rows by type */
  const filteredReal = hasReal
    ? activity.filter((a) => filter === "All" || a.event_type === filter.toLowerCase())
    : [];

  return (
    <>
      <div className="db-page-header">
        <h1 className="db-page-title">Activity</h1>
        <p className="db-page-sub">
          {loading || profileLoading
            ? "Loading…"
            : hasReal
              ? `${activity.length} event${activity.length !== 1 ? "s" : ""} in your history`
              : "No activity yet — showing demo data"}
        </p>
      </div>

      <div className="db-page-body">

        {/* Demo notice */}
        {isDemo && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", padding:"0.875rem 1.125rem", background:"var(--accent-muted)", border:"1px solid var(--accent-border)", borderRadius:"var(--radius-lg)", marginBottom:"1.5rem", fontSize:"0.9375rem", color:"var(--accent-light)" }}>
            <span>💡</span>
            <span>No transactions recorded yet — showing <strong>demo data</strong>. Your activity will appear here automatically as you buy, sell, and bid.</span>
          </div>
        )}

        {/* Filter chips */}
        <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap", marginBottom:"1.5rem" }}>
          {FILTERS.map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter===f ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius:"9999px", fontSize:"0.8125rem" }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Column headers */}
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:"0.5rem", padding:"0.5rem 1.25rem", borderBottom:"1px solid var(--border-muted)", marginBottom:"0.25rem" }}>
          {["Item","Type","Amount","Time"].map((h) => (
            <span key={h} style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--text-muted)" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Real activity rows */}
        {hasReal && (
          <div className="db-activity-list" style={{ borderRadius:"var(--radius-card)" }}>
            {filteredReal.map((item) => (
              <div key={item.id} className="db-activity-row">
                <div style={{ display:"flex", alignItems:"center", gap:"0.875rem", flex:2, minWidth:0 }}>
                  <div className="db-activity-icon" style={{ fontSize:"1rem" }}>
                    {EVENT_ICON[item.event_type] ?? "🔄"}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <p className="db-activity-title">{item.nft_title ?? "NFT"}</p>
                    <p className="db-activity-sub" style={{ fontFamily:"var(--font-mono)", fontSize:"0.6875rem" }}>
                      on-chain
                    </p>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <span className={`activity-badge activity-badge--${item.event_type}`}>
                    {item.event_type}
                  </span>
                </div>
                <div style={{ flex:1 }}>
                  {item.amount
                    ? <span style={{ fontWeight:700, fontSize:"0.9375rem", color:"var(--text-primary)" }}>{item.amount} ETH</span>
                    : <span style={{ color:"var(--text-muted)" }}>—</span>
                  }
                </div>
                <div style={{ flex:1, textAlign:"right" }}>
                  <span className="db-activity-time">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mock activity rows (fallback) */}
        {!hasReal && (
          <div className="db-activity-list" style={{ borderRadius:"var(--radius-card)" }}>
            {MOCK.filter((m) => filter === "All" || m.type === filter.toLowerCase()).map((item, i) => (
              <div key={i} className="db-activity-row">
                <div style={{ display:"flex", alignItems:"center", gap:"0.875rem", flex:2, minWidth:0 }}>
                  <div
                    style={{ width:"2.75rem", height:"2.75rem", borderRadius:"0.5rem", flexShrink:0, background:`linear-gradient(135deg,${item.nft.art.stops[0]},${item.nft.art.stops[1]})`, border:"1px solid var(--border-muted)" }}
                    aria-hidden
                  />
                  <div style={{ minWidth:0 }}>
                    <p className="db-activity-title">{item.nft.title}</p>
                    <p className="db-activity-sub" style={{ fontFamily:"var(--font-mono)", fontSize:"0.6875rem" }}>{item.txHash}</p>
                  </div>
                </div>
                <div style={{ flex:1 }}>
                  <span className={`activity-badge activity-badge--${item.type}`}>
                    {item.icon} {item.title}
                  </span>
                </div>
                <div style={{ flex:1 }}>
                  {item.amount && item.amount !== "0 ETH"
                    ? <span style={{ fontWeight:700, fontSize:"0.9375rem", color: item.type==="sale" ? "var(--accent)" : "var(--text-primary)" }}>{item.amount}</span>
                    : <span style={{ color:"var(--text-muted)" }}>—</span>
                  }
                </div>
                <div style={{ flex:1, textAlign:"right" }}>
                  <span className="db-activity-time">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
