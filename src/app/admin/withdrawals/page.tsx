"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient }                      from "@/lib/supabase/client";
import type { WithdrawalRequest }            from "@/lib/database.types";

type Filter = "all" | "pending" | "completed" | "rejected";

interface WithdrawalWithProfile extends WithdrawalRequest {
  profiles?: { name: string; handle: string } | null;
}

export default function AdminWithdrawalsPage() {
  const [requests, setRequests] = useState<WithdrawalWithProfile[]>([]);
  const [filter,   setFilter]   = useState<Filter>("pending");
  const [loading,  setLoading]  = useState(true);
  const [noteMap,  setNoteMap]  = useState<Record<string, string>>({});
  const [working,  setWorking]  = useState<string | null>(null);
  const [msg,      setMsg]      = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const sb    = createClient();
    const query = sb
      .from("withdrawal_requests")
      .select("*, profiles(name, handle)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") query.eq("status", filter);
    const { data } = await query;
    setRequests((data ?? []) as WithdrawalWithProfile[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function complete(id: string) {
    setWorking(id);
    const sb  = createClient();
    const res = await (sb as any).rpc("complete_withdrawal", { p_withdrawal_id: id });
    const ok  = !res.error && (res.data as any)?.success;
    setMsg({ id, ok, text: ok ? "Marked as completed. Balance deducted." : (res.data as any)?.error ?? res.error?.message ?? "Failed" });
    setWorking(null);
    if (ok) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "withdrawal-completed", userId: req.user_id, amount: String(req.amount), toAddress: req.to_address }),
        }).catch(() => {});
      }
      load();
    }
  }

  async function reject(id: string) {
    setWorking(id);
    const sb  = createClient();
    const res = await (sb as any).rpc("reject_withdrawal", { p_withdrawal_id: id, p_note: noteMap[id] ?? "" });
    const ok  = !res.error && (res.data as any)?.success;
    setMsg({ id, ok, text: ok ? "Withdrawal rejected." : (res.data as any)?.error ?? res.error?.message ?? "Failed" });
    setWorking(null);
    if (ok) {
      const req = requests.find((r) => r.id === id);
      if (req) {
        fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "withdrawal-rejected", userId: req.user_id, amount: String(req.amount), note: noteMap[id] ?? "" }),
        }).catch(() => {});
      }
      load();
    }
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Withdrawal Requests</h1>
          <p className="adm-page-sub">Process user withdrawal requests — send ETH to their provided address, then mark as completed</p>
        </div>
        <span className="adm-mode-badge">
          <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--gold)",display:"inline-block",boxShadow:"0 0 6px var(--gold)" }}/>
          Admin Mode Active
        </span>
      </div>

      <div className="adm-page-body">

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
          {(["pending","all","completed","rejected"] as Filter[]).map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter===f?"btn-primary":"btn-secondary"}`}
              style={{ borderRadius:"9999px", fontSize:"0.8125rem", textTransform:"capitalize" }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
          {pendingCount > 0 && (
            <span style={{ marginLeft:"auto", fontSize:"0.875rem", color:"#fbbf24", fontWeight:600, display:"flex", alignItems:"center" }}>
              ⚠️ {pendingCount} pending
            </span>
          )}
        </div>

        {/* Instructions */}
        {filter === "pending" && pendingCount > 0 && (
          <div style={{ padding:"1rem 1.25rem", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:"var(--radius-lg)", marginBottom:"1.5rem", fontSize:"0.875rem", color:"#fbbf24", lineHeight:1.65 }}>
            <strong>Workflow:</strong> Send ETH from the platform wallet to the user's address below, then click <strong>"Mark Completed"</strong>. The user's balance will be deducted automatically.
          </div>
        )}

        {loading ? (
          <p style={{ color:"var(--text-muted)" }}>Loading…</p>
        ) : requests.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"var(--text-muted)" }}>
            <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>✅</p>
            <p>No {filter === "all" ? "" : filter} withdrawal requests.</p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table" style={{ minWidth:780 }}>
              <thead>
                <tr>
                  <th>User</th><th>Amount</th><th>Send To (User's Wallet)</th>
                  <th>Requested</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div>
                        <p style={{ fontWeight:600, color:"var(--text-primary)" }}>{r.profiles?.name ?? "Unknown"}</p>
                        <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>@{r.profiles?.handle ?? r.user_id.slice(0,8)}</p>
                      </div>
                    </td>
                    <td style={{ fontWeight:700, color:"#f87171" }}>{r.amount} ETH</td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        <span style={{ fontFamily:"var(--font-mono)", fontSize:"0.8125rem", color:"var(--accent)" }}>
                          {r.to_address.slice(0,10)}…{r.to_address.slice(-6)}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(r.to_address).catch(()=>{})}
                          style={{ fontSize:"0.6875rem", padding:"0.125rem 0.375rem", background:"var(--bg-overlay)", border:"1px solid var(--border)", borderRadius:"0.25rem", color:"var(--text-muted)", cursor:"pointer" }}
                        >
                          Copy
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize:"0.8125rem", whiteSpace:"nowrap" }}>
                      {new Date(r.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                    </td>
                    <td><span className={`adm-status adm-status--${r.status}`}>{r.status}</span></td>
                    <td>
                      {r.status === "pending" ? (
                        <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem", minWidth:180 }}>
                          <div style={{ display:"flex", gap:"0.375rem" }}>
                            <button
                              className="adm-btn-approve"
                              style={{ flex:1, borderRadius:"0.375rem", padding:"0.375rem 0.5rem", fontSize:"0.8125rem" }}
                              disabled={working === r.id}
                              onClick={() => complete(r.id)}
                            >
                              {working === r.id ? "…" : "✓ Mark Sent"}
                            </button>
                            <button
                              className="adm-btn-flag"
                              style={{ flex:1, borderRadius:"0.375rem", padding:"0.375rem 0.5rem", fontSize:"0.8125rem" }}
                              disabled={working === r.id}
                              onClick={() => reject(r.id)}
                            >
                              {working === r.id ? "…" : "✕ Reject"}
                            </button>
                          </div>
                          <input
                            placeholder="Optional note…"
                            value={noteMap[r.id] ?? ""}
                            onChange={(e) => setNoteMap((m) => ({ ...m, [r.id]: e.target.value }))}
                            style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"0.375rem", color:"var(--text-primary)", fontFamily:"var(--font-sans)", width:"100%" }}
                          />
                          {msg?.id === r.id && (
                            <p style={{ fontSize:"0.75rem", color: msg.ok ? "#34d399" : "#f87171" }}>{msg.text}</p>
                          )}
                        </div>
                      ) : (
                        <div>
                          {r.admin_note && <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{r.admin_note}</p>}
                          {r.processed_at && <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>{new Date(r.processed_at).toLocaleDateString()}</p>}
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
