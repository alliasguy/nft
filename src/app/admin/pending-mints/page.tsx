"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient }                      from "@/lib/supabase/client";

type MintFilter = "all" | "pending" | "approved" | "rejected";

interface PendingMint {
  id:              string;
  user_id:         string;
  title:           string;
  description:     string | null;
  art_shape:       string;
  art_stop_1:      string;
  art_stop_2:      string;
  price:           number;
  category:        string;
  sale_status:     string;
  collection_name: string | null;
  image_url:       string | null;
  royalty_pct:     number;
  minting_fee:     number;
  mint_status:     "pending" | "approved" | "rejected";
  admin_note:      string | null;
  nft_id:          string | null;
  created_at:      string;
  approved_at:     string | null;
  profiles?: { name: string; handle: string; balance: number } | null;
}

export default function AdminPendingMintsPage() {
  const [mints,   setMints]   = useState<PendingMint[]>([]);
  const [filter,  setFilter]  = useState<MintFilter>("pending");
  const [loading, setLoading] = useState(true);
  const [noteMap, setNoteMap] = useState<Record<string, string>>({});
  const [working, setWorking] = useState<string | null>(null);
  const [msg,     setMsg]     = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb    = createClient() as any;
    const query = sb
      .from("pending_mints")
      .select("*, profiles(name, handle, balance)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter !== "all") query.eq("mint_status", filter);
    const { data } = await query;
    setMints((data ?? []) as PendingMint[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function approve(mint: PendingMint) {
    setWorking(mint.id);
    const sb  = createClient() as any;
    const res = await sb.rpc("approve_pending_mint", { p_mint_id: mint.id });
    const ok  = !res.error && (res.data as any)?.success;
    if (ok) {
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:     "mint-approved",
          userId:   (res.data as any).user_id,
          nftTitle: mint.title,
        }),
      }).catch(() => {});
      setMsg({ id: mint.id, ok: true, text: "Mint approved — NFT created and fee deducted." });
      load();
    } else {
      setMsg({ id: mint.id, ok: false, text: (res.data as any)?.error ?? res.error?.message ?? "Failed" });
    }
    setWorking(null);
  }

  async function reject(mint: PendingMint) {
    setWorking(mint.id);
    const sb  = createClient() as any;
    const res = await sb.rpc("reject_pending_mint", {
      p_mint_id: mint.id,
      p_note:    noteMap[mint.id] ?? "",
    });
    const ok  = !res.error && (res.data as any)?.success;
    if (ok) {
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:     "mint-rejected",
          userId:   (res.data as any).user_id,
          nftTitle: mint.title,
          note:     noteMap[mint.id] ?? "",
        }),
      }).catch(() => {});
      setMsg({ id: mint.id, ok: true, text: "Mint request rejected." });
      load();
    } else {
      setMsg({ id: mint.id, ok: false, text: (res.data as any)?.error ?? res.error?.message ?? "Failed" });
    }
    setWorking(null);
  }

  const pendingCount = mints.filter(m => m.mint_status === "pending").length;

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Pending Mints</h1>
          <p className="adm-page-sub">NFT mint requests queued due to insufficient balance</p>
        </div>
        <span className="adm-mode-badge">
          <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--gold)",display:"inline-block",boxShadow:"0 0 6px var(--gold)" }}/>
          Admin Mode Active
        </span>
      </div>

      <div className="adm-page-body">

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
          {(["pending","all","approved","rejected"] as MintFilter[]).map((f) => (
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
              ⏳ {pendingCount} awaiting approval
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ color:"var(--text-muted)" }}>Loading…</p>
        ) : mints.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem", color:"var(--text-muted)" }}>
            <p style={{ fontSize:"2rem", marginBottom:"0.75rem" }}>🎨</p>
            <p>No {filter === "all" ? "" : filter} pending mints.</p>
          </div>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table" style={{ minWidth:860 }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>NFT</th>
                  <th>Fee / Balance</th>
                  <th>Price</th>
                  <th>Queued</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {mints.map((m) => {
                  const userBal  = m.profiles?.balance ?? 0;
                  const shortfall = Math.max(0, m.minting_fee - userBal);
                  const canApprove = userBal >= m.minting_fee;
                  return (
                    <tr key={m.id}>
                      {/* User */}
                      <td>
                        <p style={{ fontWeight:600, color:"var(--text-primary)" }}>
                          {m.profiles?.name ?? "Unknown"}
                        </p>
                        <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>
                          @{m.profiles?.handle ?? m.user_id.slice(0,8)}
                        </p>
                      </td>

                      {/* NFT info */}
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.625rem" }}>
                          {m.image_url ? (
                            <img src={m.image_url} alt={m.title}
                              style={{ width:36, height:36, objectFit:"cover", borderRadius:"0.375rem",
                                border:"1px solid var(--border-muted)", flexShrink:0 }} />
                          ) : (
                            <div style={{ width:36, height:36, borderRadius:"0.375rem", flexShrink:0,
                              background:`linear-gradient(135deg,${m.art_stop_1},${m.art_stop_2})` }} />
                          )}
                          <div>
                            <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9375rem" }}>
                              {m.title}
                            </p>
                            <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
                              {m.category}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Fee vs balance */}
                      <td>
                        <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>
                          Fee: <strong style={{ color:"var(--accent)" }}>{m.minting_fee} ETH</strong>
                        </p>
                        <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>
                          Bal: <strong style={{ color: canApprove ? "#34d399" : "#f87171" }}>
                            {userBal.toFixed(4)} ETH
                          </strong>
                        </p>
                        {!canApprove && m.mint_status === "pending" && (
                          <p style={{ fontSize:"0.75rem", color:"#fbbf24" }}>
                            -{shortfall.toFixed(4)} short
                          </p>
                        )}
                      </td>

                      {/* Price */}
                      <td style={{ fontWeight:700, color:"var(--text-primary)", whiteSpace:"nowrap" }}>
                        {m.price} ETH
                      </td>

                      {/* Date */}
                      <td style={{ fontSize:"0.8125rem", whiteSpace:"nowrap" }}>
                        {new Date(m.created_at).toLocaleDateString("en-US", {
                          month:"short", day:"numeric", hour:"2-digit", minute:"2-digit"
                        })}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`adm-status adm-status--${
                          m.mint_status === "pending"  ? "pending"  :
                          m.mint_status === "approved" ? "approved" : "rejected"
                        }`}>
                          {m.mint_status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        {m.mint_status === "pending" ? (
                          <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem", minWidth:180 }}>
                            <div style={{ display:"flex", gap:"0.375rem" }}>
                              <button
                                className="adm-btn-approve"
                                style={{ flex:1, borderRadius:"0.375rem", padding:"0.375rem 0.5rem",
                                  fontSize:"0.8125rem", opacity: canApprove ? 1 : 0.5 }}
                                disabled={working === m.id}
                                title={canApprove ? "Approve and mint" : `User needs ${shortfall.toFixed(4)} more ETH`}
                                onClick={() => approve(m)}
                              >
                                {working === m.id ? "…" : "✓ Approve"}
                              </button>
                              <button
                                className="adm-btn-flag"
                                style={{ flex:1, borderRadius:"0.375rem", padding:"0.375rem 0.5rem", fontSize:"0.8125rem" }}
                                disabled={working === m.id}
                                onClick={() => reject(m)}
                              >
                                {working === m.id ? "…" : "✕ Reject"}
                              </button>
                            </div>
                            {!canApprove && (
                              <p style={{ fontSize:"0.7rem", color:"#fbbf24" }}>
                                Balance too low — approve will fail until user deposits more.
                              </p>
                            )}
                            <input
                              placeholder="Optional rejection note…"
                              value={noteMap[m.id] ?? ""}
                              onChange={(e) => setNoteMap((prev) => ({ ...prev, [m.id]: e.target.value }))}
                              style={{ fontSize:"0.75rem", padding:"0.25rem 0.5rem",
                                background:"var(--bg-elevated)", border:"1px solid var(--border)",
                                borderRadius:"0.375rem", color:"var(--text-primary)",
                                fontFamily:"var(--font-sans)", width:"100%" }}
                            />
                            {msg?.id === m.id && (
                              <p style={{ fontSize:"0.75rem", color: msg.ok ? "#34d399" : "#f87171" }}>
                                {msg.text}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div>
                            {m.admin_note && (
                              <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", maxWidth:160 }}>
                                {m.admin_note}
                              </p>
                            )}
                            {m.approved_at && (
                              <p style={{ fontSize:"0.75rem", color:"var(--text-muted)" }}>
                                {new Date(m.approved_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
