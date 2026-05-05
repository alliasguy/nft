"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { createClient }        from "@/lib/supabase/client";
import type { DepositRequest, WithdrawalRequest, ActivityLog } from "@/lib/database.types";

type TxRow =
  | { kind: "deposit";    data: DepositRequest    }
  | { kind: "withdrawal"; data: WithdrawalRequest }
  | { kind: "activity";   data: ActivityLog        };

const STATUS_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  approved:   { bg:"rgba(16,185,129,0.1)",  color:"#34d399",          border:"rgba(16,185,129,0.25)"  },
  completed:  { bg:"rgba(16,185,129,0.1)",  color:"#34d399",          border:"rgba(16,185,129,0.25)"  },
  pending:    { bg:"rgba(245,158,11,0.1)",  color:"#fbbf24",          border:"rgba(245,158,11,0.25)"  },
  processing: { bg:"rgba(245,158,11,0.1)",  color:"#fbbf24",          border:"rgba(245,158,11,0.25)"  },
  rejected:   { bg:"rgba(239,68,68,0.1)",   color:"#f87171",          border:"rgba(239,68,68,0.25)"   },
  purchase:   { bg:"var(--accent-muted)",   color:"var(--accent)",    border:"var(--accent-border)"   },
  sale:       { bg:"var(--accent-muted)",   color:"var(--accent)",    border:"var(--accent-border)"   },
  default:    { bg:"var(--bg-overlay)",     color:"var(--text-muted)","border":"var(--border)"        },
};

function StatusBadge({ s }: { s: string }) {
  const st = STATUS_STYLE[s] ?? STATUS_STYLE.default;
  return (
    <span style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.04em",
      padding:"0.1875rem 0.5rem", borderRadius:"9999px",
      background:st.bg, color:st.color, border:`1px solid ${st.border}` }}>
      {s}
    </span>
  );
}

export default function WalletPage() {
  const [balance,      setBalance]     = useState<number | null>(null);
  const [pending,      setPending]     = useState(0);
  const [deposits,     setDeposits]    = useState<DepositRequest[]>([]);
  const [withdrawals,  setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activity,     setActivity]    = useState<ActivityLog[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [userId,       setUserId]      = useState<string | null>(null);

  useEffect(() => {
    const sb = createClient();
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { window.location.href = "/login?next=/wallet"; return; }
      setUserId(user.id);

      const sba = sb as any;
      const [profRes, depRes, wdRes, actRes] = await Promise.all([
        sba.from("profiles").select("balance, pending_balance").eq("id", user.id).single(),
        sba.from("deposit_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        sba.from("withdrawal_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
        sba.from("activity_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      if (profRes.data) {
        setBalance((profRes.data as any).balance ?? 0);
        setPending((profRes.data as any).pending_balance ?? 0);
      }
      setDeposits((depRes.data ?? []) as DepositRequest[]);
      setWithdrawals((wdRes.data ?? []) as WithdrawalRequest[]);
      setActivity((actRes.data ?? []) as ActivityLog[]);
      setLoading(false);
    }
    load();
  }, []);

  /* Merge all rows for unified history */
  const history: TxRow[] = [
    ...deposits.map((d)   => ({ kind: "deposit"    as const, data: d })),
    ...withdrawals.map((w) => ({ kind: "withdrawal" as const, data: w })),
    ...activity.map((a)    => ({ kind: "activity"   as const, data: a })),
  ].sort((a, b) => {
    const aDate = a.kind === "activity" ? a.data.created_at : a.data.created_at;
    const bDate = b.kind === "activity" ? b.data.created_at : b.data.created_at;
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const usdVal = balance !== null ? (balance * 3900).toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—";

  if (loading) {
    return (
      <div className="container section" style={{ textAlign:"center", color:"var(--text-muted)" }}>
        <p>Loading wallet…</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)" }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom:"2rem" }}>
        <p className="text-label" style={{ marginBottom:"0.375rem" }}>Internal Wallet</p>
        <h1 className="text-headline">My Wallet</h1>
      </div>

      {/* ── Balance cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:"1rem", marginBottom:"2rem" }}>

        {/* Current balance */}
        <div style={{ background:"var(--bg-surface)", border:"1px solid var(--accent-border)", borderRadius:"var(--radius-card)", padding:"1.5rem", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"var(--accent-muted)", pointerEvents:"none" }} />
          <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--accent)", marginBottom:"0.5rem", position:"relative" }}>
            Available Balance
          </p>
          <p style={{ fontSize:"2.5rem", fontWeight:900, letterSpacing:"-0.03em", color:"var(--text-primary)", lineHeight:1, position:"relative" }}>
            {balance !== null ? balance.toFixed(4) : "—"}
            <span style={{ fontSize:"1.125rem", fontWeight:600, color:"var(--text-secondary)", marginLeft:"0.375rem" }}>ETH</span>
          </p>
          <p style={{ fontSize:"0.9375rem", color:"var(--text-muted)", marginTop:"0.375rem", position:"relative" }}>
            ≈ ${usdVal} USD
          </p>
        </div>

        {/* Pending balance */}
        {pending > 0 && (
          <div style={{ background:"var(--bg-surface)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:"var(--radius-card)", padding:"1.5rem" }}>
            <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"#fbbf24", marginBottom:"0.5rem" }}>
              Pending (awaiting confirmation)
            </p>
            <p style={{ fontSize:"2rem", fontWeight:800, color:"var(--text-primary)", lineHeight:1 }}>
              {pending.toFixed(4)}
              <span style={{ fontSize:"1rem", color:"var(--text-secondary)", marginLeft:"0.375rem" }}>ETH</span>
            </p>
          </div>
        )}

      </div>

      {/* ── Quick actions ── */}
      <div style={{ display:"flex", gap:"1rem", marginBottom:"2.5rem", flexWrap:"wrap" }}>
        <Link href="/wallet/deposit" className="btn btn-gradient btn-lg" style={{ borderRadius:"9999px", gap:"0.5rem" }}>
          ↓ Deposit ETH
        </Link>
        <Link
          href="/wallet/withdraw"
          className={`btn btn-secondary btn-lg`}
          style={{ borderRadius:"9999px", gap:"0.5rem", opacity: balance === 0 ? 0.5 : 1, pointerEvents: balance === 0 ? "none" : "auto" }}
        >
          ↑ Withdraw ETH
        </Link>
      </div>

      {/* ── Transaction history ── */}
      <div>
        <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"1rem", display:"flex", alignItems:"center", gap:"0.5rem" }}>
          Transaction History
          <span style={{ flex:1, height:1, background:"var(--border-muted)" }} />
        </p>

        {history.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 1rem", color:"var(--text-muted)" }}>
            <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>📭</p>
            <p style={{ fontSize:"0.9375rem" }}>No transactions yet.</p>
            <Link href="/wallet/deposit" style={{ color:"var(--accent)", fontWeight:600, fontSize:"0.9375rem", marginTop:"1rem", display:"inline-block" }}>
              Make your first deposit →
            </Link>
          </div>
        ) : (
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)", borderRadius:"var(--radius-card)", overflow:"hidden" }}>
            {history.map((row, i) => {
              const isLast = i === history.length - 1;
              if (row.kind === "deposit") {
                const d = row.data;
                return (
                  <div key={d.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.9375rem 1.25rem", borderBottom: isLast ? "none" : "1px solid var(--border-muted)" }}>
                    <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"50%", background:"rgba(16,185,129,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>↓</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9375rem" }}>Deposit</p>
                      {d.tx_hash && <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{d.tx_hash}</p>}
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontWeight:700, color:"#34d399", fontSize:"0.9375rem" }}>+{d.amount} ETH</p>
                      <StatusBadge s={d.status} />
                    </div>
                  </div>
                );
              }
              if (row.kind === "withdrawal") {
                const w = row.data;
                return (
                  <div key={w.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.9375rem 1.25rem", borderBottom: isLast ? "none" : "1px solid var(--border-muted)" }}>
                    <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"50%", background:"rgba(239,68,68,0.1)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>↑</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9375rem" }}>Withdrawal</p>
                      <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>{w.to_address.slice(0,12)}…</p>
                    </div>
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontWeight:700, color:"#f87171", fontSize:"0.9375rem" }}>-{w.amount} ETH</p>
                      <StatusBadge s={w.status} />
                    </div>
                  </div>
                );
              }
              const a = row.data as ActivityLog;
              return (
                <div key={a.id} style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.9375rem 1.25rem", borderBottom: isLast ? "none" : "1px solid var(--border-muted)" }}>
                  <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"50%", background:"var(--bg-elevated)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"1rem", flexShrink:0 }}>
                    {a.event_type === "purchase" ? "🛍️" : a.event_type === "sale" ? "💰" : "⚡"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9375rem", textTransform:"capitalize" }}>{a.event_type}</p>
                    <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>{a.nft_title ?? "NFT"}</p>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    {a.amount != null && (
                      <p style={{ fontWeight:700, color: a.event_type === "sale" ? "#34d399" : "var(--text-primary)", fontSize:"0.9375rem" }}>
                        {a.event_type === "purchase" ? "-" : "+"}{a.amount} ETH
                      </p>
                    )}
                    <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
                      {new Date(a.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric" })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
