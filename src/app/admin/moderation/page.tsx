"use client";

import { useState, useEffect, useCallback } from "react";
import Link                                  from "next/link";
import { createClient }                      from "@/lib/supabase/client";
import { timeAgo }                           from "@/lib/supabaseToNft";

type ModStatus = "review" | "approved" | "flagged";

interface NftRow {
  id:               string;
  title:            string;
  creator_name:     string;
  creator_handle:   string;
  creator_gradient: string | null;
  category:         string;
  price:            number;
  art_stop_1:       string;
  art_stop_2:       string;
  art_shape:        string;
  image_url:        string | null;
  mod_status:       ModStatus;
  mod_note:         string | null;
  created_at:       string;
  is_live:          boolean;
  badge:            string | null;
  description:      string | null;
  status:           string;
}

const CATEGORIES = ["Art","Music","Photography","Gaming","Virtual Worlds"] as const;

const FILTERS: { key: ModStatus | "all"; label: string }[] = [
  { key:"all",      label:"All NFTs"       },
  { key:"review",   label:"Pending Review" },
  { key:"approved", label:"Approved"       },
  { key:"flagged",  label:"Flagged"        },
];

/* ── Inline admin edit panel ─────────────────────────────── */
function AdminEditPanel({
  nft, onClose, onSaved,
}: {
  nft:     NftRow;
  onClose: () => void;
  onSaved: (u: Partial<NftRow>) => void;
}) {
  const [form, setForm] = useState({
    title:       nft.title,
    description: nft.description ?? "",
    price:       String(nft.price),
    status:      (nft.status === "auction" ? "auction" : "buy-now") as "buy-now" | "auction",
    category:    nft.category,
    badge:       nft.badge ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [err,    setErr]    = useState("");

  function field(k: keyof typeof form) {
    return (v: string) => setForm((f) => ({ ...f, [k]: v }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.title.trim())           { setErr("Title is required."); return; }
    if (!price || price <= 0)         { setErr("Enter a valid price."); return; }
    setSaving(true); setErr("");

    const sb = createClient() as any;
    const { data, error } = await sb.rpc("admin_edit_nft", {
      p_nft_id:      nft.id,
      p_title:       form.title.trim(),
      p_description: form.description.trim() || null,
      p_price:       price,
      p_status:      form.status,
      p_category:    form.category,
      p_badge:       form.badge.trim() || null,
    });

    if (error || !(data as any)?.success) {
      setErr((data as any)?.error ?? error?.message ?? "Update failed");
      setSaving(false);
    } else {
      setSaved(true);
      onSaved({
        title:       form.title.trim(),
        description: form.description.trim() || null,
        price,
        status:      form.status,
        category:    form.category,
        badge:       form.badge.trim() || null,
      });
      setTimeout(() => { setSaved(false); onClose(); }, 1200);
    }
  }

  return (
    <div style={{
      marginTop:"0.5rem", background:"var(--bg-elevated)",
      border:"1px solid rgba(254,228,64,0.25)", borderRadius:0, padding:"1rem",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.875rem" }}>
        <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--gold)" }}>
          Edit NFT
        </p>
        <button onClick={onClose}
          style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"1rem", padding:"0.125rem" }}
          aria-label="Close editor">✕</button>
      </div>

      <form onSubmit={handleSave} style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>

        <div>
          <label style={{ display:"block", fontSize:"0.6875rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>Title</label>
          <input className="db-input" value={form.title} onChange={(e) => field("title")(e.target.value)} maxLength={80} required />
        </div>

        <div>
          <label style={{ display:"block", fontSize:"0.6875rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>Description</label>
          <textarea className="db-textarea" value={form.description} onChange={(e) => field("description")(e.target.value)}
            maxLength={500} rows={2} style={{ minHeight:"3.5rem" }} />
        </div>

        <div className="edit-row-2col">
          <div>
            <label style={{ display:"block", fontSize:"0.6875rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>Price (ETH)</label>
            <input className="db-input" type="number" step="0.001" min="0.001" value={form.price}
              onChange={(e) => field("price")(e.target.value)} required />
          </div>
          <div>
            <label style={{ display:"block", fontSize:"0.6875rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>Category</label>
            <select className="select" value={form.category} onChange={(e) => field("category")(e.target.value)}
              style={{ width:"100%", fontSize:"0.8125rem" }}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="edit-row-2col">
          <div>
            <label style={{ display:"block", fontSize:"0.6875rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>Sale Type</label>
            <div style={{ display:"flex", gap:"0.375rem" }}>
              {(["buy-now","auction"] as const).map((t) => (
                <button key={t} type="button" onClick={() => field("status")(t)}
                  style={{ flex:1, padding:"0.375rem", cursor:"pointer", fontFamily:"var(--font-sans)",
                    fontSize:"0.6875rem", fontWeight:700, borderRadius:0,
                    border:`1.5px solid ${form.status===t ? "var(--accent-border)" : "var(--border)"}`,
                    background: form.status===t ? "var(--accent-muted)" : "var(--bg-surface)",
                    color:      form.status===t ? "var(--accent)"       : "var(--text-muted)" }}>
                  {t === "buy-now" ? "Buy Now" : "Auction"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ display:"block", fontSize:"0.6875rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>Badge (optional)</label>
            <input className="db-input" value={form.badge} onChange={(e) => field("badge")(e.target.value)}
              placeholder="e.g. Hot, New, Rare" maxLength={20} />
          </div>
        </div>

        {err && <p style={{ fontSize:"0.75rem", color:"var(--error)" }}>{err}</p>}

        <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.125rem" }}>
          <button type="submit" className="adm-save-btn" disabled={saving || saved}
            style={{ flex:1, padding:"0.5rem", fontSize:"0.8125rem" }}>
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Changes"}
          </button>
          <button type="button" className="btn btn-secondary btn-sm"
            style={{ borderRadius:"0.5rem" }} onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function ModerationPage() {
  const [nfts,          setNfts]          = useState<NftRow[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState<ModStatus | "all">("review");
  const [search,        setSearch]        = useState("");
  const [working,       setWorking]       = useState<string | null>(null);
  const [noteMap,       setNoteMap]       = useState<Record<string, string>>({});
  const [msgMap,        setMsgMap]        = useState<Record<string, { ok: boolean; text: string }>>({});
  const [featuredId,    setFeaturedId]    = useState("");
  const [editingId,     setEditingId]     = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /* ── Load NFTs + featured setting ── */
  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient() as any;
    const [nftsRes, featRes] = await Promise.all([
      sb.from("nfts")
        .select("id,title,description,creator_name,creator_handle,creator_gradient,category,price,art_stop_1,art_stop_2,art_shape,image_url,mod_status,mod_note,created_at,is_live,badge,status")
        .order("created_at", { ascending: false })
        .limit(200),
      sb.from("platform_settings").select("value").eq("key", "featured_nft_id").maybeSingle(),
    ]);

    if (!nftsRes.error && nftsRes.data) setNfts(nftsRes.data as NftRow[]);
    if (featRes.data) setFeaturedId(featRes.data.value ?? "");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Moderate (approve / flag / reset) ── */
  async function moderate(id: string, status: ModStatus) {
    setWorking(id);
    const sb  = createClient();
    const res = await (sb as any).rpc("moderate_nft", {
      p_nft_id: id,
      p_status: status,
      p_note:   noteMap[id] ?? "",
    });
    const ok = !res.error && (res.data as any)?.success;
    setMsgMap((m) => ({
      ...m,
      [id]: {
        ok,
        text: ok
          ? status === "approved" ? "✓ Approved" : status === "flagged" ? "⚑ Flagged" : "↩ Reset to review"
          : (res.data as any)?.error ?? res.error?.message ?? "Action failed",
      },
    }));
    if (ok) setNfts((prev) => prev.map((n) => n.id === id ? { ...n, mod_status: status } : n));
    setWorking(null);
  }

  /* ── Set featured NFT ── */
  async function handleSetFeatured(id: string) {
    const sb  = createClient() as any;
    const res = await sb.rpc("set_featured_nft", { p_nft_id: id });
    const ok  = !res.error && (res.data as any)?.success;
    if (ok) {
      setFeaturedId(id);
      setMsgMap((m) => ({ ...m, [id]: { ok: true, text: "⭐ Set as hero" } }));
    } else {
      setMsgMap((m) => ({ ...m, [id]: { ok: false, text: (res.data as any)?.error ?? "Failed" } }));
    }
  }

  /* ── Delete NFT ── */
  async function handleDelete(id: string) {
    setWorking(id);
    const sb  = createClient() as any;
    const res = await sb.rpc("admin_delete_nft", { p_nft_id: id });
    const ok  = !res.error && (res.data as any)?.success;
    if (ok) {
      setNfts((prev) => prev.filter((n) => n.id !== id));
      setDeleteConfirm(null);
      if (featuredId === id) setFeaturedId("");
    } else {
      setMsgMap((m) => ({ ...m, [id]: { ok: false, text: (res.data as any)?.error ?? res.error?.message ?? "Delete failed" } }));
    }
    setWorking(null);
  }

  /* ── Counts ── */
  const counts = {
    all:      nfts.length,
    review:   nfts.filter((n) => n.mod_status === "review").length,
    approved: nfts.filter((n) => n.mod_status === "approved").length,
    flagged:  nfts.filter((n) => n.mod_status === "flagged").length,
  };

  /* ── Filtered + searched list ── */
  const displayed = nfts.filter((n) => {
    const matchFilter = filter === "all" || n.mod_status === filter;
    const sq = search.toLowerCase();
    const matchSearch = !sq
      || n.title.toLowerCase().includes(sq)
      || n.creator_name.toLowerCase().includes(sq)
      || n.creator_handle.toLowerCase().includes(sq);
    return matchFilter && matchSearch;
  });

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">NFT Moderation</h1>
          <p className="adm-page-sub">
            {loading ? "Loading…" : `${counts.review} pending review · ${nfts.length} total NFTs`}
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
          <Link
            href="/create"
            className="btn btn-gradient btn-sm"
            style={{ borderRadius:"9999px", flexShrink:0 }}
          >
            + Create NFT
          </Link>
          <button className="btn btn-secondary btn-sm" style={{ borderRadius:"9999px" }}
            onClick={load} disabled={loading}>
            {loading ? "Loading…" : "↻ Refresh"}
          </button>
          <span className="adm-mode-badge">
            <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--gold)",display:"inline-block",boxShadow:"0 0 6px var(--gold)" }}/>
            Admin Mode Active
          </span>
        </div>
      </div>

      <div className="adm-page-body">

        {/* ── Search + filter tabs ── */}
        <div style={{ display:"flex", gap:"0.75rem", marginBottom:"1.5rem", flexWrap:"wrap", alignItems:"center" }}>
          <input
            className="adm-input"
            style={{ flex:1, minWidth:200, maxWidth:320 }}
            placeholder="Search by title or creator…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={{ display:"flex", gap:"0.375rem", flexWrap:"wrap" }}>
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                className={`btn btn-sm ${filter===key?"btn-primary":"btn-secondary"}`}
                style={{ borderRadius:"9999px", fontSize:"0.8125rem", gap:"0.375rem" }}
                onClick={() => setFilter(key)}
              >
                {label}
                <span style={{ fontSize:"0.6875rem", fontWeight:700, background:"rgba(255,255,255,0.12)", padding:"0.0625rem 0.4375rem", borderRadius:"9999px" }}>
                  {counts[key]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Empty states ── */}
        {!loading && nfts.length === 0 && (
          <div style={{ textAlign:"center", padding:"5rem 1rem", color:"var(--text-muted)" }}>
            <p style={{ fontSize:"3rem", marginBottom:"0.75rem" }}>🖼️</p>
            <p style={{ fontSize:"1.125rem", fontWeight:600, color:"var(--text-secondary)", marginBottom:"0.5rem" }}>
              No NFTs in the database yet
            </p>
            <p style={{ marginBottom:"1.5rem" }}>
              NFTs will appear here once users mint them via the{" "}
              <Link href="/create" style={{ color:"var(--accent)", fontWeight:600 }}>Create</Link> page.
            </p>
          </div>
        )}

        {!loading && nfts.length > 0 && displayed.length === 0 && (
          <div style={{ textAlign:"center", padding:"3rem 1rem", color:"var(--text-muted)" }}>
            <p style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>🛡️</p>
            <p>No NFTs match this filter{search ? ` and search "${search}"` : ""}.</p>
          </div>
        )}

        {/* ── Moderation grid ── */}
        {displayed.length > 0 && (
          <div className="adm-mod-grid">
            {displayed.map((nft) => {
              const st         = nft.mod_status;
              const isApproved = st === "approved";
              const isFlagged  = st === "flagged";
              const msg        = msgMap[nft.id];
              const isFeatured = featuredId === nft.id;

              return (
                /* Wrapper allows edit panel to sit below the card in the same grid column */
                <div key={nft.id} style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>

                  <div className={`adm-mod-card adm-mod-card--${st}`}>

                    {/* Artwork */}
                    <div className="adm-mod-card__art">
                      {nft.image_url ? (
                        <img src={nft.image_url} alt={nft.title} loading="lazy"
                          style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover" }} />
                      ) : (
                        <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg,${nft.art_stop_1},${nft.art_stop_2})` }} />
                      )}

                      {/* Status badge */}
                      <div className="adm-mod-card__status-overlay">
                        <span className={`adm-status adm-status--${st === "approved" ? "approved" : st === "flagged" ? "flagged" : "review"}`}>
                          {st}
                        </span>
                      </div>

                      {/* Featured badge */}
                      {isFeatured && (
                        <div style={{ position:"absolute", top:"0.625rem", left:"50%", transform:"translateX(-50%)", background:"rgba(254,228,64,0.15)", border:"1px solid rgba(254,228,64,0.4)", borderRadius:"9999px", padding:"0.1875rem 0.5rem", fontSize:"0.625rem", fontWeight:700, color:"var(--gold)", whiteSpace:"nowrap", zIndex:2 }}>
                          ⭐ Hero
                        </div>
                      )}

                      {/* View link */}
                      <Link href={`/nft/${nft.id}`} target="_blank"
                        style={{ position:"absolute", top:"0.625rem", right:"0.625rem", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"9999px", padding:"0.25rem 0.625rem", fontSize:"0.6875rem", fontWeight:600, color:"#fff", textDecoration:"none", zIndex:2 }}>
                        View ↗
                      </Link>
                    </div>

                    {/* Info */}
                    <div className="adm-mod-card__body">
                      <p className="adm-mod-card__title">{nft.title}</p>
                      <p className="adm-mod-card__creator">
                        by {nft.creator_name}
                        <span style={{ color:"var(--text-muted)", marginLeft:"0.25rem" }}>@{nft.creator_handle}</span>
                      </p>

                      <div className="adm-mod-card__meta">
                        <span className="badge badge-neutral" style={{ fontSize:"0.6875rem" }}>{nft.category}</span>
                        {nft.badge && <span className="badge badge-gold" style={{ fontSize:"0.6875rem" }}>{nft.badge}</span>}
                        <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginLeft:"auto" }}>
                          {timeAgo(nft.created_at)}
                        </span>
                      </div>

                      {nft.mod_note && (
                        <p style={{ marginTop:"0.5rem", fontSize:"0.75rem", color:"#f87171", padding:"0.375rem 0.625rem", background:"rgba(239,68,68,0.08)", borderRadius:"0.375rem" }}>
                          ⚠ {nft.mod_note}
                        </p>
                      )}

                      <p style={{ marginTop:"0.5rem", fontWeight:700, fontSize:"0.875rem", color:"var(--text-primary)" }}>
                        {Number(nft.price).toFixed(4)} ETH
                      </p>

                      {msg && (
                        <p style={{ marginTop:"0.375rem", fontSize:"0.75rem", color: msg.ok ? "#34d399" : "#f87171" }}>
                          {msg.text}
                        </p>
                      )}

                      {/* Flag note input */}
                      {!isApproved && (
                        <input
                          placeholder={isFlagged ? "Edit flag reason…" : "Flag reason (optional)…"}
                          value={noteMap[nft.id] ?? nft.mod_note ?? ""}
                          onChange={(e) => setNoteMap((m) => ({ ...m, [nft.id]: e.target.value }))}
                          style={{ marginTop:"0.5rem", width:"100%", fontSize:"0.75rem", padding:"0.3125rem 0.625rem", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"0.375rem", color:"var(--text-primary)", fontFamily:"var(--font-sans)" }}
                        />
                      )}
                    </div>

                    {/* ── Moderation actions ── */}
                    <div className="adm-mod-card__actions">
                      <button
                        className="adm-btn-approve"
                        onClick={() => moderate(nft.id, "approved")}
                        disabled={isApproved || working === nft.id}
                        style={{ opacity: isApproved ? 0.5 : 1 }}
                      >
                        {working === nft.id ? "…" : isApproved ? "✓ Approved" : "✓ Approve"}
                      </button>
                      <button
                        className="adm-btn-flag"
                        onClick={() => moderate(nft.id, isFlagged ? "review" : "flagged")}
                        disabled={working === nft.id}
                      >
                        {working === nft.id ? "…" : isFlagged ? "↩ Unflag" : "⚑ Flag"}
                      </button>
                    </div>

                    {/* ── Admin management actions ── */}
                    <div style={{ display:"flex", borderTop:"1px solid var(--border-muted)" }}>
                      {/* Feature */}
                      <button
                        onClick={() => isApproved && handleSetFeatured(nft.id)}
                        disabled={!isApproved || isFeatured}
                        style={{
                          flex:1, padding:"0.5rem 0.25rem", background:"transparent", border:"none",
                          borderRight:"1px solid var(--border-muted)", cursor: isApproved && !isFeatured ? "pointer" : "default",
                          fontSize:"0.6875rem", fontWeight:700, fontFamily:"var(--font-sans)",
                          color: isFeatured ? "var(--gold)" : isApproved ? "var(--text-muted)" : "var(--border)",
                          opacity: !isApproved ? 0.35 : 1, transition:"color 150ms",
                        }}
                        title={!isApproved ? "Approve NFT first" : isFeatured ? "Currently featured" : "Set as hero"}
                      >
                        ⭐ {isFeatured ? "Hero" : "Feature"}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => setEditingId(editingId === nft.id ? null : nft.id)}
                        style={{
                          flex:1, padding:"0.5rem 0.25rem", background: editingId===nft.id ? "rgba(254,228,64,0.08)" : "transparent",
                          border:"none", borderRight:"1px solid var(--border-muted)", cursor:"pointer",
                          fontSize:"0.6875rem", fontWeight:700, fontFamily:"var(--font-sans)",
                          color: editingId===nft.id ? "var(--gold)" : "var(--text-muted)",
                          transition:"color 150ms, background 150ms",
                        }}
                      >
                        ✎ {editingId===nft.id ? "Close" : "Edit"}
                      </button>

                      {/* Delete */}
                      {deleteConfirm === nft.id ? (
                        <button
                          onClick={() => handleDelete(nft.id)}
                          disabled={working === nft.id}
                          style={{
                            flex:1, padding:"0.5rem 0.25rem", background:"rgba(239,68,68,0.12)", border:"none",
                            cursor:"pointer", fontSize:"0.6875rem", fontWeight:700, fontFamily:"var(--font-sans)",
                            color:"#f87171",
                          }}
                        >
                          {working === nft.id ? "…" : "Confirm?"}
                        </button>
                      ) : (
                        <button
                          onClick={() => { setDeleteConfirm(nft.id); setEditingId(null); }}
                          style={{
                            flex:1, padding:"0.5rem 0.25rem", background:"transparent", border:"none",
                            cursor:"pointer", fontSize:"0.6875rem", fontWeight:700, fontFamily:"var(--font-sans)",
                            color:"var(--text-muted)", transition:"color 150ms",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          title="Delete NFT permanently"
                        >
                          🗑 Delete
                        </button>
                      )}
                    </div>

                  </div>

                  {/* Inline edit panel — renders below the card in the same grid column */}
                  {editingId === nft.id && (
                    <AdminEditPanel
                      nft={nft}
                      onClose={() => setEditingId(null)}
                      onSaved={(updates) => {
                        setNfts((prev) => prev.map((n) => n.id === nft.id ? { ...n, ...updates } : n));
                        setEditingId(null);
                      }}
                    />
                  )}

                </div>
              );
            })}
          </div>
        )}

        {/* Skeleton grid while loading */}
        {loading && (
          <div className="adm-mod-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="adm-mod-card adm-mod-card--review">
                <div className="adm-mod-card__art">
                  <div className="skeleton" style={{ width:"100%", height:"100%" }} />
                </div>
                <div className="adm-mod-card__body">
                  <div className="skeleton" style={{ height:"1rem", width:"70%", marginBottom:"0.5rem" }} />
                  <div className="skeleton" style={{ height:"0.75rem", width:"50%" }} />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  );
}
