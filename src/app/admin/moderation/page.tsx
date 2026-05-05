"use client";

import { useState, useEffect, useCallback } from "react";
import Link                                  from "next/link";
import { createClient }                      from "@/lib/supabase/client";
import { timeAgo }                           from "@/lib/supabaseToNft";

type ModStatus = "review" | "approved" | "flagged";

interface NftRow {
  id:              string;
  title:           string;
  creator_name:    string;
  creator_handle:  string;
  creator_gradient:string | null;
  category:        string;
  price:           number;
  art_stop_1:      string;
  art_stop_2:      string;
  art_shape:       string;
  mod_status:      ModStatus;
  mod_note:        string | null;
  created_at:      string;
  is_live:         boolean;
  badge:           string | null;
}

const FILTERS: { key: ModStatus | "all"; label: string }[] = [
  { key:"all",      label:"All NFTs"      },
  { key:"review",   label:"Pending Review"},
  { key:"approved", label:"Approved"      },
  { key:"flagged",  label:"Flagged"       },
];

export default function ModerationPage() {
  const [nfts,      setNfts]      = useState<NftRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState<ModStatus | "all">("review");
  const [search,    setSearch]    = useState("");
  const [working,   setWorking]   = useState<string | null>(null);
  const [noteMap,   setNoteMap]   = useState<Record<string, string>>({});
  const [msgMap,    setMsgMap]    = useState<Record<string, { ok: boolean; text: string }>>({});

  /* ── Fetch all NFTs from Supabase ── */
  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const { data, error } = await (sb as any)
      .from("nfts")
      .select("id,title,creator_name,creator_handle,creator_gradient,category,price,art_stop_1,art_stop_2,art_shape,mod_status,mod_note,created_at,is_live,badge")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) setNfts(data as NftRow[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Moderate an NFT ── */
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
    if (ok) {
      /* Optimistic update — no full refetch needed */
      setNfts((prev) => prev.map((n) => n.id === id ? { ...n, mod_status: status } : n));
    }
    setWorking(null);
  }

  /* ── Counts for filter tabs ── */
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
        <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
          <button
            className="btn btn-secondary btn-sm"
            style={{ borderRadius:"9999px" }}
            onClick={load}
            disabled={loading}
          >
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
            <p style={{ fontSize:"0.875rem" }}>
              Make sure you ran <code style={{ fontFamily:"var(--font-mono)", background:"var(--bg-elevated)", padding:"0.125rem 0.375rem", borderRadius:"0.25rem" }}>moderation.sql</code> in Supabase first.
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
              const isReview   = st === "review";
              const msg        = msgMap[nft.id];

              return (
                <div key={nft.id} className={`adm-mod-card adm-mod-card--${st}`}>

                  {/* Artwork */}
                  <div className="adm-mod-card__art">
                    <div style={{ width:"100%", height:"100%", background:`linear-gradient(135deg,${nft.art_stop_1},${nft.art_stop_2})` }} />
                    <div className="adm-mod-card__status-overlay">
                      <span className={`adm-status adm-status--${
                        st === "approved" ? "approved" : st === "flagged" ? "flagged" : "review"
                      }`}>
                        {st}
                      </span>
                    </div>
                    {/* View button */}
                    <Link
                      href={`/nft/${nft.id}`}
                      target="_blank"
                      style={{ position:"absolute", top:"0.625rem", right:"0.625rem", background:"rgba(0,0,0,0.6)", backdropFilter:"blur(8px)", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"9999px", padding:"0.25rem 0.625rem", fontSize:"0.6875rem", fontWeight:600, color:"#fff", textDecoration:"none", zIndex:2 }}
                    >
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
                      {nft.badge && (
                        <span className="badge badge-gold" style={{ fontSize:"0.6875rem" }}>{nft.badge}</span>
                      )}
                      <span style={{ fontSize:"0.75rem", color:"var(--text-muted)", marginLeft:"auto" }}>
                        {timeAgo(nft.created_at)}
                      </span>
                    </div>

                    {/* Flag reason / mod note */}
                    {nft.mod_note && (
                      <p style={{ marginTop:"0.5rem", fontSize:"0.75rem", color:"#f87171", padding:"0.375rem 0.625rem", background:"rgba(239,68,68,0.08)", borderRadius:"0.375rem" }}>
                        ⚠ {nft.mod_note}
                      </p>
                    )}

                    <p style={{ marginTop:"0.5rem", fontWeight:700, fontSize:"0.875rem", color:"var(--text-primary)" }}>
                      {Number(nft.price).toFixed(4)} ETH
                    </p>

                    {/* Action feedback */}
                    {msg && (
                      <p style={{ marginTop:"0.375rem", fontSize:"0.75rem", color: msg.ok ? "#34d399" : "#f87171" }}>
                        {msg.text}
                      </p>
                    )}

                    {/* Optional flag note input */}
                    {!isApproved && (
                      <input
                        placeholder={isFlagged ? "Edit flag reason…" : "Flag reason (optional)…"}
                        value={noteMap[nft.id] ?? nft.mod_note ?? ""}
                        onChange={(e) => setNoteMap((m) => ({ ...m, [nft.id]: e.target.value }))}
                        style={{ marginTop:"0.5rem", width:"100%", fontSize:"0.75rem", padding:"0.3125rem 0.625rem", background:"var(--bg-elevated)", border:"1px solid var(--border)", borderRadius:"0.375rem", color:"var(--text-primary)", fontFamily:"var(--font-sans)" }}
                      />
                    )}
                  </div>

                  {/* Action buttons */}
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
