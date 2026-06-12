"use client";

import { useState, useEffect } from "react";
import { createClient }        from "@/lib/supabase/client";
import type { Profile }        from "@/lib/database.types";
import { IcoKey, IcoBan, IcoUndo, IcoUserPlus, IcoUserMinus, IcoCheck } from "@/components/icons";

type DisplayStatus = "user" | "admin" | "suspended";
type Filter        = DisplayStatus | "all";

const FILTER_TABS: { key: Filter; label: string }[] = [
  { key:"all",       label:"All"       },
  { key:"user",      label:"Users"     },
  { key:"admin",     label:"Admins"    },
  { key:"suspended", label:"Suspended" },
];

function gradientFromId(id: string): string {
  const hues: [string,string][] = [
    ["#e11d48","#c026d3"],["#3b82f6","#06b6d4"],["#f59e0b","#ef4444"],
    ["#10b981","#3b82f6"],["#8b5cf6","#ec4899"],["#f97316","#fbbf24"],
    ["#a855f7","#3b82f6"],["#0ea5e9","#6366f1"],["#ec4899","#f43f5e"],
    ["#64748b","#334155"],
  ];
  const n = parseInt(id.replace(/-/g,"").slice(0,8), 16) || 0;
  const [c1,c2] = hues[n % hues.length];
  return `linear-gradient(135deg,${c1},${c2})`;
}

interface ProfileWithEmail extends Profile {
  email?: string;
  is_suspended?: boolean;
}

export default function UsersPage() {
  const [users,         setUsers]         = useState<ProfileWithEmail[]>([]);
  const [emailMap,      setEmailMap]      = useState<Record<string,string>>({});
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<Filter>("all");
  const [search,        setSearch]        = useState("");
  const [working,       setWorking]       = useState<string | null>(null);
  const [actionMsg,     setActionMsg]     = useState<{id:string;text:string;ok:boolean}|null>(null);
  const [currentUserId, setCurrentUserId] = useState<string|null>(null);

  /* Password modal state */
  const [pwTarget,   setPwTarget]   = useState<ProfileWithEmail|null>(null);
  const [newPw,      setNewPw]      = useState("");
  const [pwStatus,   setPwStatus]   = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [pwError,    setPwError]    = useState("");

  /* Direct credit modal state */
  const [creditTarget, setCreditTarget] = useState<ProfileWithEmail|null>(null);
  const [creditAmt,    setCreditAmt]    = useState("");
  const [creditNote,   setCreditNote]   = useState("");
  const [creditStatus, setCreditStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [creditError,  setCreditError]  = useState("");

  /* Direct debit modal state */
  const [debitTarget, setDebitTarget] = useState<ProfileWithEmail|null>(null);
  const [debitAmt,    setDebitAmt]    = useState("");
  const [debitNote,   setDebitNote]   = useState("");
  const [debitStatus, setDebitStatus] = useState<"idle"|"saving"|"saved"|"error">("idle");
  const [debitError,  setDebitError]  = useState("");

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    const sb = createClient() as any;
    async function load() {
      const [profilesRes, emailsRes] = await Promise.all([
        sb.from("profiles").select("*").order("created_at", { ascending: false }),
        sb.rpc("admin_list_user_emails"),
      ]);
      if (!profilesRes.error && profilesRes.data) setUsers(profilesRes.data as ProfileWithEmail[]);
      if (!emailsRes.error && emailsRes.data) {
        const map: Record<string,string> = {};
        (emailsRes.data as { id:string; email:string }[]).forEach(r => { map[r.id] = r.email; });
        setEmailMap(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  function getStatus(u: ProfileWithEmail): DisplayStatus {
    if (u.is_suspended) return "suspended";
    return (u.role as DisplayStatus) ?? "user";
  }

  async function toggleSuspend(u: ProfileWithEmail) {
    const isSuspended = getStatus(u) === "suspended";
    setWorking(u.id);
    const sb  = createClient() as any;
    const res = await sb.rpc("admin_update_user", { p_user_id: u.id, p_suspended: isSuspended ? false : true });
    if ((res.data as any)?.success) {
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, is_suspended: !isSuspended } : p));
      setActionMsg({ id: u.id, ok: true, text: isSuspended ? "User restored." : "User suspended." });
    } else {
      setActionMsg({ id: u.id, ok: false, text: (res.data as any)?.error ?? res.error?.message ?? "Action failed." });
    }
    setWorking(null);
  }

  async function verify(u: ProfileWithEmail) {
    setWorking(u.id);
    const sb  = createClient() as any;
    const res = await sb.rpc("admin_update_user", { p_user_id: u.id, p_verified: true });
    if ((res.data as any)?.success) {
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, verified: true } : p));
      setActionMsg({ id: u.id, ok: true, text: "User verified." });
    } else {
      setActionMsg({ id: u.id, ok: false, text: (res.data as any)?.error ?? "Action failed." });
    }
    setWorking(null);
  }

  async function setRole(u: ProfileWithEmail, newRole: "admin" | "user") {
    setWorking(u.id);
    const sb  = createClient() as any;
    const res = await sb.rpc("admin_update_user", { p_user_id: u.id, p_role: newRole });
    if ((res.data as any)?.success) {
      setUsers(prev => prev.map(p => p.id === u.id ? { ...p, role: newRole } : p));
      setActionMsg({ id: u.id, ok: true, text: newRole === "admin" ? "Promoted to admin." : "Demoted to user." });
    } else {
      setActionMsg({ id: u.id, ok: false, text: (res.data as any)?.error ?? "Action failed." });
    }
    setWorking(null);
  }

  async function handleDirectCredit(e: React.FormEvent) {
    e.preventDefault();
    if (!creditTarget) return;
    const amount = parseFloat(creditAmt);
    if (!amount || amount <= 0) { setCreditError("Enter a valid amount."); return; }
    setCreditStatus("saving"); setCreditError("");
    const sb  = createClient() as any;
    const res = await sb.rpc("admin_direct_credit", {
      p_user_id: creditTarget.id,
      p_amount:  amount,
      p_note:    creditNote.trim(),
    });
    if ((res.data as any)?.success) {
      setUsers(prev => prev.map(p =>
        p.id === creditTarget.id ? { ...p, balance: (res.data as any).new_balance } : p
      ));
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:   "direct-credit",
          userId: creditTarget.id,
          amount: String(amount),
          note:   creditNote.trim(),
        }),
      }).catch(() => {});
      setCreditStatus("saved");
      setTimeout(() => { setCreditStatus("idle"); setCreditTarget(null); setCreditAmt(""); setCreditNote(""); }, 1800);
    } else {
      setCreditError((res.data as any)?.error ?? res.error?.message ?? "Failed.");
      setCreditStatus("error");
    }
  }

  async function handleDirectDebit(e: React.FormEvent) {
    e.preventDefault();
    if (!debitTarget) return;
    const amount = parseFloat(debitAmt);
    if (!amount || amount <= 0) { setDebitError("Enter a valid amount."); return; }
    setDebitStatus("saving"); setDebitError("");
    const sb  = createClient() as any;
    const res = await sb.rpc("admin_direct_debit", {
      p_user_id: debitTarget.id,
      p_amount:  amount,
      p_note:    debitNote.trim(),
    });
    if ((res.data as any)?.success) {
      setUsers(prev => prev.map(p =>
        p.id === debitTarget.id ? { ...p, balance: (res.data as any).new_balance } : p
      ));
      fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type:   "direct-debit",
          userId: debitTarget.id,
          amount: String(amount),
          note:   debitNote.trim(),
        }),
      }).catch(() => {});
      setDebitStatus("saved");
      setTimeout(() => { setDebitStatus("idle"); setDebitTarget(null); setDebitAmt(""); setDebitNote(""); }, 1800);
    } else {
      setDebitError((res.data as any)?.error ?? res.error?.message ?? "Failed.");
      setDebitStatus("error");
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!pwTarget || newPw.length < 6) return;
    setPwStatus("saving"); setPwError("");
    try {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: pwTarget.id, newPassword: newPw }),
      });
      const json = await res.json();
      if (json.ok) { setPwStatus("saved"); setNewPw(""); setTimeout(() => { setPwStatus("idle"); setPwTarget(null); }, 1500); }
      else          { setPwError(json.error ?? "Failed"); setPwStatus("error"); }
    } catch {
      setPwError("Network error"); setPwStatus("error");
    }
  }

  const filtered = users.filter(u => {
    const st  = getStatus(u);
    const ok  = filter === "all" || st === filter;
    const sq  = search.toLowerCase();
    const hit = !sq || u.name?.toLowerCase().includes(sq) || u.handle?.toLowerCase().includes(sq)
      || (emailMap[u.id] ?? "").toLowerCase().includes(sq);
    return ok && hit;
  });

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">User Management</h1>
          <p className="adm-page-sub">
            {loading ? "Loading…" : `${users.length} registered users`}
          </p>
        </div>
        <span className="adm-mode-badge">
          <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--gold)",display:"inline-block",boxShadow:"0 0 6px var(--gold)" }}/>
          Admin Mode Active
        </span>
      </div>

      <div className="adm-page-body">

        {/* Search + filter */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.25rem", flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1, minWidth:220 }}>
            <span style={{ position:"absolute", left:"1rem", top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", pointerEvents:"none" }}>🔍</span>
            <input className="adm-input" style={{ paddingLeft:"2.5rem" }}
              placeholder="Search by name, handle, or email…"
              value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
            {FILTER_TABS.map(({ key, label }) => (
              <button key={key}
                className={`btn btn-sm ${filter===key?"btn-primary":"btn-secondary"}`}
                style={{ borderRadius:"9999px", fontSize:"0.8125rem" }}
                onClick={() => setFilter(key)}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p style={{ color:"var(--text-muted)" }}>Loading users from database…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color:"var(--text-muted)", padding:"2rem 0" }}>No users found.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table" style={{ minWidth:820 }}>
              <thead>
                <tr>
                  <th>User</th><th>Email</th><th>Balance</th><th>Joined</th>
                  <th>Role</th><th>Verified</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const st      = getStatus(u);
                  const grad    = gradientFromId(u.id);
                  const initials= (u.name ?? "?").slice(0,2).toUpperCase();
                  const email   = emailMap[u.id] ?? "—";
                  return (
                    <tr key={u.id}>
                      {/* User */}
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                          <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"50%", background:grad,
                            flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:"0.5625rem", fontWeight:800, color:"#fff" }}>
                            {initials}
                          </div>
                          <div>
                            <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9375rem" }}>{u.name}</p>
                            <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>@{u.handle}</p>
                          </div>
                        </div>
                      </td>
                      {/* Email */}
                      <td style={{ fontSize:"0.8125rem", color:"var(--text-secondary)", maxWidth:180,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {email}
                      </td>
                      {/* Balance */}
                      <td style={{ fontWeight:700, color:(u.balance??0)>0?"var(--accent)":"var(--text-muted)", whiteSpace:"nowrap" }}>
                        {(u.balance??0).toFixed(4)} ETH
                      </td>
                      {/* Joined */}
                      <td style={{ fontSize:"0.8125rem", whiteSpace:"nowrap" }}>
                        {new Date(u.created_at).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}
                      </td>
                      {/* Role */}
                      <td>
                        <span className={`adm-status adm-status--${
                          st==="admin"?"verified":st==="suspended"?"suspended":"active"
                        }`}>
                          {st}
                        </span>
                      </td>
                      {/* Verified */}
                      <td>
                        <span style={{ fontSize:"1rem" }}>{u.verified?"✓":"—"}</span>
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                          <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
                            {!u.verified && st!=="suspended" && (
                              <button className="adm-btn-approve"
                                style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem" }}
                                disabled={working===u.id} onClick={()=>verify(u)}>
                                {working===u.id?"…":<><IcoCheck /> Verify</>}
                              </button>
                            )}
                            {st!=="admin" && st!=="suspended" && (
                              <button className="adm-btn-approve"
                                style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem",
                                  background:"rgba(254,228,64,0.1)", color:"var(--gold)", borderColor:"rgba(254,228,64,0.3)" }}
                                disabled={working===u.id} onClick={()=>setRole(u,"admin")}>
                                {working===u.id?"…":<><IcoUserPlus /> Make Admin</>}
                              </button>
                            )}
                            {st==="admin" && u.id!==currentUserId && (
                              <button className="adm-btn-flag"
                                style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem" }}
                                disabled={working===u.id} onClick={()=>setRole(u,"user")}>
                                {working===u.id?"…":<><IcoUserMinus /> Remove Admin</>}
                              </button>
                            )}
                            <button className="adm-btn-flag"
                              style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem" }}
                              disabled={working===u.id||u.id===currentUserId}
                              onClick={()=>toggleSuspend(u)}>
                              {working===u.id?"…":st==="suspended"?<><IcoUndo /> Restore</>:<><IcoBan /> Suspend</>}
                            </button>
                            <button
                              style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem",
                                background:"rgba(59,130,246,0.1)", color:"#60a5fa",
                                border:"1px solid rgba(59,130,246,0.3)", cursor:"pointer",
                                fontFamily:"var(--font-sans)", fontWeight:600 }}
                              onClick={()=>{ setPwTarget(u); setNewPw(""); setPwStatus("idle"); setPwError(""); }}>
                              <IcoKey /> Set Password
                            </button>
                            <button
                              style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem",
                                background:"rgba(52,211,153,0.1)", color:"#34d399",
                                border:"1px solid rgba(52,211,153,0.3)", cursor:"pointer",
                                fontFamily:"var(--font-sans)", fontWeight:600 }}
                              onClick={()=>{ setCreditTarget(u); setCreditAmt(""); setCreditNote(""); setCreditStatus("idle"); setCreditError(""); }}>
                              + Credit
                            </button>
                            <button
                              style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem",
                                background:"rgba(248,113,113,0.1)", color:"#f87171",
                                border:"1px solid rgba(248,113,113,0.3)", cursor:"pointer",
                                fontFamily:"var(--font-sans)", fontWeight:600 }}
                              onClick={()=>{ setDebitTarget(u); setDebitAmt(""); setDebitNote(""); setDebitStatus("idle"); setDebitError(""); }}>
                              − Debit
                            </button>
                          </div>
                          {actionMsg?.id===u.id && (
                            <p style={{ fontSize:"0.75rem", color:actionMsg.ok?"#34d399":"#f87171" }}>
                              {actionMsg.text}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Direct Credit Modal ── */}
      {creditTarget && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center",
          justifyContent:"center", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)" }}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)",
            borderRadius:"var(--radius-card)", padding:"1.75rem", width:"100%", maxWidth:400, margin:"1rem" }}>
            {creditStatus === "saved" ? (
              <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>✅</p>
                <p style={{ fontWeight:700, color:"var(--text-primary)" }}>Balance credited!</p>
              </div>
            ) : (
              <>
                <p style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-primary)", marginBottom:"0.25rem" }}>
                  Direct Credit
                </p>
                <p style={{ fontSize:"0.875rem", color:"var(--text-muted)", marginBottom:"1.25rem" }}>
                  Crediting <strong style={{ color:"var(--text-primary)" }}>{creditTarget.name}</strong>
                  {" "}— current balance:{" "}
                  <strong style={{ color:"var(--accent)" }}>{(creditTarget.balance ?? 0).toFixed(4)} ETH</strong>
                </p>
                {creditError && <p style={{ fontSize:"0.875rem", color:"var(--error)", marginBottom:"0.75rem" }}>{creditError}</p>}
                <form onSubmit={handleDirectCredit} style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                  <div>
                    <label style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)",
                      display:"block", marginBottom:"0.375rem" }}>Amount (ETH)</label>
                    <input className="adm-input" type="number" step="0.0001" min="0.0001"
                      placeholder="e.g. 0.5"
                      value={creditAmt} onChange={(e) => setCreditAmt(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)",
                      display:"block", marginBottom:"0.375rem" }}>Note (optional)</label>
                    <input className="adm-input" placeholder="Reason for credit…"
                      value={creditNote} onChange={(e) => setCreditNote(e.target.value)} />
                  </div>
                  <button type="submit" className="adm-save-btn" disabled={creditStatus === "saving"}
                    style={{ padding:"0.625rem", background:"rgba(52,211,153,0.15)", color:"#34d399",
                      border:"1px solid rgba(52,211,153,0.3)" }}>
                    {creditStatus === "saving" ? "Crediting…" : "Credit Balance"}
                  </button>
                  <button type="button" className="btn btn-secondary"
                    style={{ width:"100%", justifyContent:"center" }}
                    onClick={() => setCreditTarget(null)}>
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Direct Debit Modal ── */}
      {debitTarget && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center",
          justifyContent:"center", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)" }}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)",
            borderRadius:"var(--radius-card)", padding:"1.75rem", width:"100%", maxWidth:400, margin:"1rem" }}>
            {debitStatus === "saved" ? (
              <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>✅</p>
                <p style={{ fontWeight:700, color:"var(--text-primary)" }}>Balance debited!</p>
              </div>
            ) : (
              <>
                <p style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-primary)", marginBottom:"0.25rem" }}>
                  Direct Debit
                </p>
                <p style={{ fontSize:"0.875rem", color:"var(--text-muted)", marginBottom:"1.25rem" }}>
                  Debiting <strong style={{ color:"var(--text-primary)" }}>{debitTarget.name}</strong>
                  {" "}— current balance:{" "}
                  <strong style={{ color:"var(--accent)" }}>{(debitTarget.balance ?? 0).toFixed(4)} ETH</strong>
                </p>
                {debitError && <p style={{ fontSize:"0.875rem", color:"var(--error)", marginBottom:"0.75rem" }}>{debitError}</p>}
                <form onSubmit={handleDirectDebit} style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                  <div>
                    <label style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)",
                      display:"block", marginBottom:"0.375rem" }}>Amount (ETH)</label>
                    <input className="adm-input" type="number" step="0.0001" min="0.0001"
                      placeholder="e.g. 0.5"
                      value={debitAmt} onChange={(e) => setDebitAmt(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)",
                      display:"block", marginBottom:"0.375rem" }}>Note (optional)</label>
                    <input className="adm-input" placeholder="Reason for debit…"
                      value={debitNote} onChange={(e) => setDebitNote(e.target.value)} />
                  </div>
                  <button type="submit" className="adm-save-btn" disabled={debitStatus === "saving"}
                    style={{ padding:"0.625rem", background:"rgba(248,113,113,0.15)", color:"#f87171",
                      border:"1px solid rgba(248,113,113,0.3)" }}>
                    {debitStatus === "saving" ? "Debiting…" : "Debit Balance"}
                  </button>
                  <button type="button" className="btn btn-secondary"
                    style={{ width:"100%", justifyContent:"center" }}
                    onClick={() => setDebitTarget(null)}>
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Set Password Modal ── */}
      {pwTarget && (
        <div style={{ position:"fixed", inset:0, zIndex:50, display:"flex", alignItems:"center",
          justifyContent:"center", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(6px)" }}>
          <div style={{ background:"var(--bg-elevated)", border:"1px solid var(--border)",
            borderRadius:"var(--radius-card)", padding:"1.75rem", width:"100%", maxWidth:400, margin:"1rem" }}>
            {pwStatus==="saved" ? (
              <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>✅</p>
                <p style={{ fontWeight:700, color:"var(--text-primary)" }}>Password updated!</p>
              </div>
            ) : (
              <>
                <p style={{ fontWeight:700, fontSize:"1rem", color:"var(--text-primary)", marginBottom:"0.25rem" }}>
                  Set Password
                </p>
                <p style={{ fontSize:"0.875rem", color:"var(--text-muted)", marginBottom:"1.25rem" }}>
                  Setting new password for <strong style={{ color:"var(--text-primary)" }}>{pwTarget.name}</strong>
                </p>
                {pwError && <p style={{ fontSize:"0.875rem", color:"var(--error)", marginBottom:"0.75rem" }}>{pwError}</p>}
                <form onSubmit={handleSetPassword} style={{ display:"flex", flexDirection:"column", gap:"0.875rem" }}>
                  <input className="adm-input" type="password" placeholder="New password (min 6 chars)"
                    value={newPw} onChange={(e)=>setNewPw(e.target.value)} minLength={6} required />
                  <button type="submit" className="adm-save-btn" disabled={pwStatus==="saving"}
                    style={{ padding:"0.625rem" }}>
                    {pwStatus==="saving"?"Saving…":"Save Password"}
                  </button>
                  <button type="button" className="btn btn-secondary"
                    style={{ width:"100%", justifyContent:"center" }}
                    onClick={()=>setPwTarget(null)}>
                    Cancel
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
