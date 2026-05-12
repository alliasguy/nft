"use client";

import { useState, useEffect } from "react";
import { createClient }        from "@/lib/supabase/client";
import type { Profile }        from "@/lib/database.types";

type UserStatus = "user" | "admin" | "suspended";

const FILTER_TABS: { key: UserStatus | "all"; label: string }[] = [
  { key:"all",       label:"All"       },
  { key:"user",      label:"Users"     },
  { key:"admin",     label:"Admins"    },
  { key:"suspended", label:"Suspended" },
];

/* Deterministic gradient from a UUID */
function gradientFromId(id: string): string {
  const hues = [
    ["#e11d48","#c026d3"], ["#3b82f6","#06b6d4"], ["#f59e0b","#ef4444"],
    ["#10b981","#3b82f6"], ["#8b5cf6","#ec4899"], ["#f97316","#fbbf24"],
    ["#a855f7","#3b82f6"], ["#0ea5e9","#6366f1"], ["#ec4899","#f43f5e"],
    ["#64748b","#334155"],
  ];
  const n = parseInt(id.replace(/-/g, "").slice(0, 8), 16) || 0;
  const [c1, c2] = hues[n % hues.length];
  return `linear-gradient(135deg,${c1},${c2})`;
}

export default function UsersPage() {
  const [users,    setUsers]    = useState<Profile[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<UserStatus | "all">("all");
  const [search,   setSearch]   = useState("");
  /* Local overrides for suspend/verify until a proper admin RPC is wired */
  const [overrides,    setOverrides]    = useState<Record<string, UserStatus>>({});
  const [working,      setWorking]      = useState<string | null>(null);
  const [actionMsg,    setActionMsg]    = useState<{ id:string; text:string; ok:boolean } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    const sb = createClient();
    async function load() {
      const { data, error } = await (sb as any)
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setUsers(data as Profile[]);
      setLoading(false);
    }
    load();
  }, []);

  function getStatus(u: Profile): UserStatus {
    return overrides[u.id] ?? (u.role as UserStatus) ?? "user";
  }

  async function toggleSuspend(u: Profile) {
    const current = getStatus(u);
    const next    = current === "suspended" ? "user" : "suspended";
    setWorking(u.id);
    try {
      const sb  = createClient();
      const res = await (sb as any).rpc("admin_update_user", {
        p_user_id: u.id,
        p_role:    next,
      });
      if ((res.data as any)?.success) {
        setOverrides((o) => ({ ...o, [u.id]: next }));
        setActionMsg({ id: u.id, ok: true, text: next === "suspended" ? "User suspended." : "User restored." });
      } else {
        setActionMsg({ id: u.id, ok: false, text: (res.data as any)?.error ?? "Action failed." });
      }
    } catch {
      setActionMsg({ id: u.id, ok: false, text: "Network error." });
    }
    setWorking(null);
  }

  async function verify(u: Profile) {
    setWorking(u.id);
    try {
      const sb  = createClient();
      const res = await (sb as any).rpc("admin_update_user", {
        p_user_id:  u.id,
        p_verified: true,
      });
      if ((res.data as any)?.success) {
        setOverrides((o) => ({ ...o, [u.id]: "admin" }));
        setActionMsg({ id: u.id, ok: true, text: "User verified." });
      } else {
        setActionMsg({ id: u.id, ok: false, text: (res.data as any)?.error ?? "Action failed." });
      }
    } catch {
      setActionMsg({ id: u.id, ok: false, text: "Network error." });
    }
    setWorking(null);
  }

  async function setRole(u: Profile, newRole: "admin" | "user") {
    setWorking(u.id);
    try {
      const sb  = createClient();
      const res = await (sb as any).rpc("admin_update_user", { p_user_id: u.id, p_role: newRole });
      if ((res.data as any)?.success) {
        setOverrides((o) => ({ ...o, [u.id]: newRole }));
        setActionMsg({ id: u.id, ok: true, text: newRole === "admin" ? "Promoted to admin." : "Demoted to user." });
      } else {
        setActionMsg({ id: u.id, ok: false, text: (res.data as any)?.error ?? "Action failed." });
      }
    } catch {
      setActionMsg({ id: u.id, ok: false, text: "Network error." });
    }
    setWorking(null);
  }

  const filtered = users.filter((u) => {
    const st  = getStatus(u);
    const ok  = filter === "all" || st === filter;
    const sq  = search.toLowerCase();
    const hit = !sq || u.name.toLowerCase().includes(sq) || u.handle.toLowerCase().includes(sq);
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
            <input
              className="adm-input"
              style={{ paddingLeft:"2.5rem" }}
              placeholder="Search by name or handle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
            {FILTER_TABS.map(({ key, label }) => (
              <button
                key={key}
                className={`btn btn-sm ${filter===key?"btn-primary":"btn-secondary"}`}
                style={{ borderRadius:"9999px", fontSize:"0.8125rem" }}
                onClick={() => setFilter(key)}
              >
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
            <table className="adm-table" style={{ minWidth:700 }}>
              <thead>
                <tr>
                  <th>User</th><th>Balance</th><th>Joined</th>
                  <th>Role</th><th>Verified</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const st      = getStatus(u);
                  const grad    = gradientFromId(u.id);
                  const initials= u.name.slice(0, 2).toUpperCase();
                  return (
                    <tr key={u.id}>
                      {/* User */}
                      <td>
                        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
                          <div style={{ width:"2.25rem", height:"2.25rem", borderRadius:"50%", background:grad, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"0.5625rem", fontWeight:800, color:"#fff" }}>
                            {initials}
                          </div>
                          <div>
                            <p style={{ fontWeight:600, color:"var(--text-primary)", fontSize:"0.9375rem" }}>{u.name}</p>
                            <p style={{ fontSize:"0.75rem", color:"var(--text-muted)", fontFamily:"var(--font-mono)" }}>@{u.handle}</p>
                          </div>
                        </div>
                      </td>
                      {/* Balance */}
                      <td style={{ fontWeight:700, color: (u.balance ?? 0) > 0 ? "var(--accent)" : "var(--text-muted)", whiteSpace:"nowrap" }}>
                        {(u.balance ?? 0).toFixed(4)} ETH
                      </td>
                      {/* Joined */}
                      <td style={{ fontSize:"0.8125rem", whiteSpace:"nowrap" }}>
                        {new Date(u.created_at).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" })}
                      </td>
                      {/* Role */}
                      <td>
                        <span className={`adm-status adm-status--${
                          st === "admin" ? "verified" : st === "suspended" ? "suspended" : "active"
                        }`}>
                          {st}
                        </span>
                      </td>
                      {/* Verified */}
                      <td>
                        <span style={{ fontSize:"1rem" }}>{u.verified ? "✓" : "—"}</span>
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display:"flex", flexDirection:"column", gap:"0.375rem" }}>
                          <div style={{ display:"flex", gap:"0.375rem" }}>
                            {!u.verified && st !== "suspended" && (
                              <button
                                className="adm-btn-approve"
                                style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem" }}
                                disabled={working === u.id}
                                onClick={() => verify(u)}
                              >
                                {working === u.id ? "…" : "✓ Verify"}
                              </button>
                            )}
                            {st !== "admin" && st !== "suspended" && (
                              <button
                                className="adm-btn-approve"
                                style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem", background:"rgba(254,228,64,0.1)", color:"var(--gold)", borderColor:"rgba(254,228,64,0.3)" }}
                                disabled={working === u.id}
                                onClick={() => setRole(u, "admin")}
                              >
                                {working === u.id ? "…" : "⚙ Make Admin"}
                              </button>
                            )}
                            {st === "admin" && u.id !== currentUserId && (
                              <button
                                className="adm-btn-flag"
                                style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem" }}
                                disabled={working === u.id}
                                onClick={() => setRole(u, "user")}
                              >
                                {working === u.id ? "…" : "↩ Remove Admin"}
                              </button>
                            )}
                            <button
                              className="adm-btn-flag"
                              style={{ borderRadius:"0.375rem", padding:"0.3125rem 0.625rem", fontSize:"0.75rem" }}
                              disabled={working === u.id || u.id === currentUserId}
                              onClick={() => toggleSuspend(u)}
                            >
                              {working === u.id ? "…" : st === "suspended" ? "↩ Restore" : "⊘ Suspend"}
                            </button>
                          </div>
                          {actionMsg?.id === u.id && (
                            <p style={{ fontSize:"0.75rem", color: actionMsg.ok ? "#34d399" : "#f87171" }}>
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
    </>
  );
}
