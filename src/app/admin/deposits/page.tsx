"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient }                      from "@/lib/supabase/client";
import type { DepositRequest }               from "@/lib/database.types";

type Filter = "all" | "pending" | "approved" | "rejected";

interface DepositWithProfile extends DepositRequest {
  profiles?: { name: string; handle: string } | null;
}

export default function AdminDepositsPage() {
  const [deposits, setDeposits] = useState<DepositWithProfile[]>([]);
  const [filter,   setFilter]   = useState<Filter>("pending");
  const [loading,  setLoading]  = useState(true);
  const [noteMap,  setNoteMap]  = useState<Record<string, string>>({});
  const [working,  setWorking]  = useState<string | null>(null);
  const [msg,      setMsg]      = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const sb = createClient();
    const query = sb
      .from("deposit_requests")
      .select("*, profiles(name, handle)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") query.eq("status", filter);
    const { data } = await query;
    setDeposits((data ?? []) as DepositWithProfile[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: string) {
    setWorking(id);
    const sb  = createClient();
    const res = await (sb as any).rpc("approve_deposit", { p_deposit_id: id });
    const ok  = !res.error && (res.data as any)?.success;
    setMsg({ id, ok, text: ok ? "Deposit approved and balance credited." : (res.data as any)?.error ?? res.error?.message ?? "Failed" });
    setWorking(null);
    if (ok) load();
  }

  async function reject(id: string) {
    setWorking(id);
    const sb  = createClient();
    const res = await (sb as any).rpc("reject_deposit", { p_deposit_id: id, p_note: noteMap[id] ?? "" });
    const ok  = !res.error && (res.data as any)?.success;
    setMsg({ id, ok, text: ok ? "Deposit rejected." : (res.data as any)?.error ?? res.error?.message ?? "Failed" });
    setWorking(null);
    if (ok) load();
  }

  const counts = {
    all:      deposits.length,
    pending:  deposits.filter((d) => d.status === "pending").length,
    approved: deposits.filter((d) => d.status === "approved").length,
    rejected: deposits.filter((d) => d.status === "rejected").length,
  };

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Deposit Requests</h1>
          <p className="adm-page-sub">Review and approve or reject user deposit submissions</p>
        </div>
        <span className="adm-mode-badge">
          <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--gold)",display:"inline-block",boxShadow:"0 0 6px var(--gold)" }}/>
          Admin Mode Active
        </span>
      </div>

      <div className="adm-page-body">

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
          {(["pending","all","approved","rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter===f?"btn-primary":"btn-secondary"}`}
              style={{ borderRadius:"9999px", fontSize:"0.8125rem", textTransform:"capitalize" }}
              onClick={() => setFilter(f)}
            >
              {f} {f === "all" ? `(${deposits.length})` : ""}
            </button>
          ))}
          {counts.pending > 0 && (
            <span style={{ marginLeft:"auto", fontSize:"0.875rem", color:"#fbbf24", fontWeight:600, display:"flex", alignItems:"center" }}>
              ⚠️ {counts.pending} pending
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ color:"var(--text-muted)" }}>Loading…</p>
        ) : deposits.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"var(--text-muted)" }}>
            <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>📭</p>
            <p>No {filter === "all" ? "" : filter} deposits found.</p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table" style={{ minWidth:760 }}>
              <thead>
                <tr>
                  <th>User</th><th>Amount</th><th>Tx Hash</th>
                  <th>From Address</th><th>Submitted</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <div>
                        <p style={{ fontWeight:600, color:"var(--text-primary)" }}>{d.profiles?.name ?? "Unknown"}</p>
                        <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>@{d.profiles?.handle ?? d.user_id.slice(0,8)}</p>
                      </div>
                    </td>
                    <td style={{ fontWeight:700, color:"#34d399" }}>{d.amount} ETH</td>
                    <td style={{ fontFamily:"var(--font-mono)", fontSize:"0.8125rem", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {d.tx_hash ?? "—"}
                    </td>
                    <td style={{ fontFamily:"var(--font-mono)", fontSize:"0.8125rem", maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {d.from_address ?? "—"}
                    </td>
                    <td style={{ fontSize:"0.8125rem", whiteSpace:"nowrap" }}>
                      {new Date(d.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </td>
                    <td><span className={`adm-status adm-status--${d.status}`}>{d.status}</span></td>
                    <td>
                      {d.status === "pending" ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem", minWidth:160 }}>
                          <div style={{ display:"flex", gap:"0.375rem" }}>
                            <button
                              className="adm-btn-approve"
                              style={{ flex:1, borderRadius:"0.375rem", padding:"0.375rem 0.5rem", fontSize:"0.8125rem" }}
                              disabled={working === d.id}
                              onClick={() => approve(d.id)}
                            >
                              {working === d.id ? "…" : "✓ Approve"}
                            </button>
                            <button
                              className="adm-btn-flag"
                              style={{ flex:1, borderRadius:"0.375rem", padding:"0.375rem 0.5rem", fontSize:"0.8125rem" }}
                              disabled={working === d.id}
                              onClick={() => reject(d.id)}
                            >
                              {working === d.id ? "…" : "✕ Reject"}
                            </button>
                          </div>
                          <input
                            placeholder="Optional rejection note…"
                            value={noteMap[d.id] ?? ""}
                            onChange={(e) => setNoteMap((m) => ({ ...m, [d.id]: e.target.value }))}
                            style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"0.375rem", color:"var(--text-primary)", fontFamily:"var(--font-sans)", width:"100%" }}
                          />
                          {msg?.id === d.id && (
                            <p style={{ fontSize:"0.75rem", color: msg.ok ? "#34d399" : "#f87171" }}>{msg.text}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {d.admin_note && <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", maxWidth:160 }}>{d.admin_note}</p>}
                          {d.confirmed_at && <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{new Date(d.confirmed_at).toLocaleDateString()}</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
