"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import NFTCard                 from "@/components/NFTCard";
import { useProfile }          from "@/hooks/useProfile";
import { createClient }        from "@/lib/supabase/client";
import { rowToCard }           from "@/lib/nftAdapter";
import type { NFTRow }         from "@/lib/database.types";

const CATEGORIES = ["Art","Music","Photography","Gaming","Virtual Worlds"] as const;

type SaveState = "idle" | "saving" | "saved" | "error";

interface EditForm {
  title:       string;
  description: string;
  price:       string;
  status:      "buy-now" | "auction";
  category:    string;
}

/* ── Inline edit panel ───────────────────────────────────── */
function EditPanel({
  nft,
  onClose,
  onSaved,
}: {
  nft:     NFTRow;
  onClose: () => void;
  onSaved: (updated: Partial<NFTRow>) => void;
}) {
  const [form, setForm]       = useState<EditForm>({
    title:       nft.title,
    description: nft.description ?? "",
    price:       String(nft.price),
    status:      (nft.status === "auction" ? "auction" : "buy-now") as EditForm["status"],
    category:    nft.category,
  });
  const [saveState, setSave]  = useState<SaveState>("idle");
  const [errMsg,    setErr]    = useState("");

  function set(field: keyof EditForm) {
    return (val: string) => setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const parsedPrice = parseFloat(form.price);
    if (!form.title.trim())      { setErr("Title is required."); return; }
    if (!parsedPrice || parsedPrice <= 0) { setErr("Enter a valid price."); return; }

    setSave("saving");
    setErr("");

    /* Use the update_nft_details SECURITY DEFINER RPC.
       A direct .update() call silently returns error:null but 0 rows
       updated when RLS blocks it — the RPC is the only reliable path. */
    const sba = createClient() as any;
    const { data, error } = await sba.rpc("update_nft_details", {
      p_nft_id:      nft.id,
      p_title:       form.title.trim(),
      p_description: form.description.trim() || null,
      p_price:       parsedPrice,
      p_status:      form.status,
      p_category:    form.category,
    });

    if (error || !(data as any)?.success) {
      setErr((data as any)?.error ?? error?.message ?? "Update failed — you may not have permission to edit this NFT.");
      setSave("error");
    } else {
      setSave("saved");
      onSaved({
        title:       form.title.trim(),
        description: form.description.trim() || null,
        price:       parsedPrice,
        status:      form.status,
        category:    form.category as NFTRow["category"],
      });
      setTimeout(() => { setSave("idle"); onClose(); }, 1200);
    }
  }

  return (
    <div style={{
      marginTop:    "0.5rem",
      background:   "var(--bg-elevated)",
      border:       "1px solid var(--accent-border)",
      borderRadius: "var(--radius-lg)",
      padding:      "1rem",
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.875rem" }}>
        <p style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.08em", textTransform:"uppercase", color:"var(--accent)" }}>
          Edit NFT
        </p>
        <button
          onClick={onClose}
          style={{ background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", fontSize:"1rem", lineHeight:1, padding:"0.125rem" }}
          aria-label="Close editor"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>

        {/* Title */}
        <div>
          <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>
            Title
          </label>
          <input
            className="db-input"
            value={form.title}
            onChange={(e) => set("title")(e.target.value)}
            placeholder="NFT title"
            maxLength={80}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>
            Description
          </label>
          <textarea
            className="db-textarea"
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            placeholder="Describe your artwork…"
            maxLength={500}
            rows={2}
            style={{ minHeight:"4rem" }}
          />
        </div>

        {/* Price + Category row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.625rem" }}>
          <div>
            <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>
              Price (ETH)
            </label>
            <input
              className="db-input"
              type="number" step="0.001" min="0.001"
              value={form.price}
              onChange={(e) => set("price")(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>
              Category
            </label>
            <select
              className="select"
              value={form.category}
              onChange={(e) => set("category")(e.target.value)}
              style={{ width:"100%", fontSize:"0.8125rem" }}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Sale type */}
        <div>
          <label style={{ display:"block", fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.25rem" }}>
            Sale Type
          </label>
          <div style={{ display:"flex", gap:"0.375rem" }}>
            {(["buy-now","auction"] as const).map((t) => (
              <button
                key={t} type="button"
                onClick={() => set("status")(t)}
                style={{
                  flex:1, padding:"0.4375rem", cursor:"pointer",
                  fontFamily:"var(--font-sans)", fontSize:"0.75rem", fontWeight:600,
                  borderRadius:"0.5rem", border:`1.5px solid ${form.status===t ? "var(--accent-border)" : "var(--border)"}`,
                  background: form.status===t ? "var(--accent-muted)" : "var(--bg-surface)",
                  color:      form.status===t ? "var(--accent)"       : "var(--text-muted)",
                  transition:"all 150ms ease",
                }}
              >
                {t === "buy-now" ? "Buy Now" : "Auction"}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {errMsg && (
          <p style={{ fontSize:"0.8125rem", color:"var(--error)" }}>{errMsg}</p>
        )}

        {/* Actions */}
        <div style={{ display:"flex", gap:"0.5rem", marginTop:"0.25rem" }}>
          <button
            type="submit"
            className="db-save-btn"
            disabled={saveState === "saving" || saveState === "saved"}
            style={{ flex:1, textAlign:"center", padding:"0.625rem" }}
          >
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "✓ Saved!" : "Save Changes"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ borderRadius:"0.5rem" }}
            onClick={onClose}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function CreatedPage() {
  const { userId, loading: profileLoading } = useProfile();
  const [nfts,      setNfts]      = useState<NFTRow[] | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const uid = userId;
    const sba = createClient() as any;
    async function load() {
      try {
        const { data: created } = await sba
          .from("nfts")
          .select("*")
          .eq("creator_id", uid)
          .order("created_at", { ascending: false })
          .limit(50);

        if (!created || created.length === 0) { setNfts([]); return; }

        const ids = (created as NFTRow[]).map((n) => n.id);
        const { data: ownership } = await sba
          .from("nft_ownership")
          .select("nft_id, owner_id")
          .in("nft_id", ids);

        const ownerMap = new Map(
          ((ownership ?? []) as { nft_id: string; owner_id: string }[])
            .map(({ nft_id, owner_id }) => [nft_id, owner_id])
        );

        const stillOwned = (created as NFTRow[]).filter((n) => {
          const current = ownerMap.get(n.id);
          return !current || current === uid;
        });

        setNfts(stillOwned);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  /* Merge saved edits back into local state without a full refetch */
  function applyEdit(id: string, updates: Partial<NFTRow>) {
    setNfts((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, ...updates } : n)) : prev
    );
  }

  const isEmpty       = !loading && !profileLoading && nfts !== null && nfts.length === 0;
  const totalEarnings = nfts?.reduce((s, n) => s + Number(n.price), 0).toFixed(2) ?? "0.00";

  return (
    <>
      <div className="db-page-header">
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:"1rem", flexWrap:"wrap", width:"100%" }}>
          <div>
            <h1 className="db-page-title">Created</h1>
            <p className="db-page-sub">
              {loading || profileLoading
                ? "Loading…"
                : nfts?.length
                  ? `${nfts.length} NFT${nfts.length !== 1 ? "s" : ""} minted · ${totalEarnings} ETH listed value`
                  : "No NFTs created yet"}
            </p>
          </div>
          <Link href="/create" className="btn btn-gradient btn-sm" style={{ borderRadius:"9999px", flexShrink:0 }}>
            + Mint New NFT
          </Link>
        </div>
      </div>

      <div className="db-page-body">

        {isEmpty && (
          <div style={{ textAlign:"center", padding:"5rem 1rem" }}>
            <p style={{ fontSize:"3.5rem", marginBottom:"1rem" }}>🎨</p>
            <p className="text-title" style={{ marginBottom:"0.625rem", color:"var(--text-primary)" }}>
              No NFTs minted yet
            </p>
            <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", marginBottom:"1.75rem", maxWidth:"40ch", margin:"0 auto 1.75rem" }}>
              Start creating and your minted works will appear here.
            </p>
            <Link href="/create" className="btn btn-gradient" style={{ borderRadius:"9999px" }}>
              Mint Your First NFT
            </Link>
          </div>
        )}

        {nfts && nfts.length > 0 && (
          <>
            {/* Stats */}
            <div className="db-stats-grid" style={{ marginBottom:"2rem" }}>
              {[
                { label:"Total Created",  value: String(nfts.length) },
                { label:"Listed Value",   value: `${totalEarnings} ETH` },
                { label:"Auctions Live",  value: String(nfts.filter(n=>n.is_live).length)   },
                { label:"Buy Now",        value: String(nfts.filter(n=>n.status==="buy-now").length) },
              ].map((s) => (
                <div key={s.label} className="db-stat-card">
                  <p className="db-stat-card__label">{s.label}</p>
                  <p className="db-stat-card__value" style={{ fontSize:"1.375rem" }}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* NFT grid */}
            <div className="grid-nft">
              {nfts.map((nft) => (
                <div key={nft.id} style={{ position:"relative" }}>

                  <NFTCard {...rowToCard(nft)} isOwned />

                  {/* Edit button overlay */}
                  <div style={{ position:"absolute", top:"0.75rem", left:"0.75rem", zIndex:3 }}>
                    <button
                      className="btn btn-sm"
                      style={{
                        background:    editingId === nft.id ? "var(--accent)" : "rgba(0,0,0,0.65)",
                        backdropFilter:"blur(8px)",
                        color:         editingId === nft.id ? "var(--text-inverse)" : "#fff",
                        border:        `1px solid ${editingId === nft.id ? "var(--accent)" : "rgba(255,255,255,0.15)"}`,
                        borderRadius:  "9999px",
                        fontSize:      "0.75rem",
                        padding:       "0.25rem 0.75rem",
                        transition:    "all 150ms ease",
                      }}
                      onClick={() => setEditingId(editingId === nft.id ? null : nft.id)}
                    >
                      {editingId === nft.id ? "✕ Close" : "✎ Edit"}
                    </button>
                  </div>

                  {/* Inline edit panel */}
                  {editingId === nft.id && (
                    <EditPanel
                      nft={nft}
                      onClose={() => setEditingId(null)}
                      onSaved={(updates) => {
                        applyEdit(nft.id, updates);
                        setEditingId(null);
                      }}
                    />
                  )}

                </div>
              ))}

              {/* Add more */}
              <Link
                href="/create"
                style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", aspectRatio:"1", background:"var(--bg-surface)", border:"2px dashed var(--border)", borderRadius:"var(--radius-2xl)", color:"var(--text-muted)", gap:"0.75rem", textDecoration:"none", fontSize:"0.9375rem", fontWeight:600, transition:"border-color 200ms ease, color 200ms ease, background 200ms ease" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor="var(--accent-border)"; el.style.color="var(--accent)"; el.style.background="var(--accent-muted)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor="var(--border)"; el.style.color="var(--text-muted)"; el.style.background="var(--bg-surface)"; }}
              >
                <span style={{ fontSize:"2rem", lineHeight:1 }}>+</span>
                Mint New NFT
              </Link>
            </div>
          </>
        )}

      </div>
    </>
  );
}
