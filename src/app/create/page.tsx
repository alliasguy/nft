"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link                from "next/link";
import { useRouter }       from "next/navigation";
import ArtworkSVG          from "@/components/ArtworkSVG";
import { createClient }    from "@/lib/supabase/client";
import type { ArtShape }   from "@/lib/mockData";

/* ── Constants ────────────────────────────────────────────── */
const SHAPES: { id: ArtShape; label: string }[] = [
  { id:"hex",     label:"Hexagon" }, { id:"grid",   label:"Grid"    },
  { id:"wave",    label:"Wave"    }, { id:"burst",  label:"Burst"   },
  { id:"circuit", label:"Circuit" }, { id:"orbit",  label:"Orbit"   },
  { id:"prism",   label:"Prism"   }, { id:"plasma", label:"Plasma"  },
];
const CATEGORIES = ["Art","Music","Photography","Gaming","Virtual Worlds"] as const;

const ALLOWED_IMAGE = ["image/jpeg","image/png","image/gif","image/webp","image/svg+xml"];
const ALLOWED_AUDIO = ["audio/mpeg","audio/wav","audio/ogg","audio/mp4","audio/aac","audio/flac"];
const ALLOWED_ALL   = [...ALLOWED_IMAGE, ...ALLOWED_AUDIO];
const MAX_BYTES     = 50 * 1024 * 1024; // 50 MB

/* ── File validation & sanitisation ─────────────────────── */

/** Check the first bytes of a file to confirm it matches the declared MIME type. */
async function checkMagicBytes(file: File): Promise<boolean> {
  const buf   = await file.slice(0, 12).arrayBuffer();
  const b     = new Uint8Array(buf);
  const mime  = file.type;

  if (mime === "image/jpeg")   return b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
  if (mime === "image/png")    return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
  if (mime === "image/gif")    return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46;
  if (mime === "image/webp")   return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                                      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
  if (mime === "audio/mpeg")   return (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) ||  // ID3
                                      (b[0] === 0xFF && (b[1] & 0xE0) === 0xE0);              // sync
  if (mime === "audio/wav")    return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                                      b[8] === 0x57 && b[9] === 0x41 && b[10] === 0x56 && b[11] === 0x45;
  if (mime === "audio/ogg")    return b[0] === 0x4F && b[1] === 0x67 && b[2] === 0x67 && b[3] === 0x53;
  if (mime === "image/svg+xml")return true; // SVG is text — checked separately
  return true; // other allowed types (aac, mp4 audio, etc.) skip magic-byte check
}

/** Strip script tags and event-handler attributes from SVG text before upload. */
async function sanitiseSvg(file: File): Promise<File> {
  const text = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, "image/svg+xml");

  // Remove <script> elements
  doc.querySelectorAll("script").forEach(el => el.remove());
  // Strip all inline event handlers
  const EVENT_ATTRS = ["onload","onerror","onclick","onmouseover","onmouseout","onfocus","onblur"];
  doc.querySelectorAll("*").forEach(el => {
    // Strip all inline event handlers
    EVENT_ATTRS.forEach(attr => el.removeAttribute(attr));

    // Strip href / xlink:href pointing to javascript: or external URLs
    for (const attr of ["href", "xlink:href", "src"]) {
      const val = el.getAttribute(attr);
      if (!val) continue;
      const lower = val.trim().toLowerCase();
      // Block javascript:, data: (HTML/XML payloads), and external http(s) on <use>/<image>
      const isUseOrImage = ["use","image","feimage"].includes(el.tagName.toLowerCase());
      if (
        lower.startsWith("javascript:") ||
        lower.startsWith("data:text") ||
        lower.startsWith("data:application") ||
        (isUseOrImage && (lower.startsWith("http:") || lower.startsWith("https:")))
      ) {
        el.removeAttribute(attr);
      }
    }

    // Strip style attributes containing url() — can load external resources or data URIs
    const style = el.getAttribute("style");
    if (style && /url\s*\(/i.test(style)) {
      el.removeAttribute("style");
    }
  });

  const clean = new XMLSerializer().serializeToString(doc);
  return new File([clean], file.name, { type: "image/svg+xml", lastModified: file.lastModified });
}

/** Sanitise filename — strip path traversal, limit length. */
function sanitiseFilename(name: string): string {
  const ext  = name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";
  const base = name.replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${base || "nft-asset"}.${ext}`;
}

/** Full client-side validation & sanitisation pipeline. */
async function validateAndSanitise(file: File): Promise<{ ok: boolean; file?: File; error?: string }> {
  if (!ALLOWED_ALL.includes(file.type))
    return { ok: false, error: `Unsupported file type: ${file.type || "unknown"}` };
  if (file.size > MAX_BYTES)
    return { ok: false, error: `File must be under 50 MB (yours: ${(file.size / 1024 / 1024).toFixed(1)} MB)` };

  const magic = await checkMagicBytes(file);
  if (!magic)
    return { ok: false, error: "File content doesn't match its declared type — possible manipulation detected." };

  let clean = file;
  if (file.type === "image/svg+xml") clean = await sanitiseSvg(file);

  return { ok: true, file: clean };
}

type MintStatus = "idle" | "uploading" | "minting" | "success" | "queued" | "error";
type Mode = "generate" | "upload";

/* ── Component ────────────────────────────────────────────── */
export default function CreatePage() {
  const router = useRouter();
  const dropRef = useRef<HTMLDivElement>(null);

  /* Wallet / fee */
  const [balance,  setBalance]  = useState<number | null>(null);
  const [mintFee,  setMintFee]  = useState(0.15);
  const [loading,  setLoading]  = useState(true);

  /* Mode: generate art or upload file */
  const [mode, setMode] = useState<Mode>("generate");

  /* Art generator form */
  const [shape,       setShape]      = useState<ArtShape>("burst");
  const [color1,      setColor1]     = useState("#00f5d4");
  const [color2,      setColor2]     = useState("#f15bb5");

  /* File upload */
  const [uploadedFile,  setUploadedFile]  = useState<File | null>(null);
  const [fileError,     setFileError]     = useState("");
  const [isDragging,    setIsDragging]    = useState(false);
  const [previewUrl,    setPreviewUrl]    = useState<string | null>(null);
  const isAudioFile = uploadedFile ? ALLOWED_AUDIO.includes(uploadedFile.type) : false;

  /* Shared NFT fields */
  const [title,       setTitle]      = useState("");
  const [description, setDesc]       = useState("");
  const [category,    setCategory]   = useState<typeof CATEGORIES[number]>("Art");
  const [saleStatus,  setSaleStatus] = useState<"buy-now"|"auction">("buy-now");
  const [price,       setPrice]      = useState("");
  const [collection,  setCollection] = useState("");
  const [royalty,     setRoyalty]    = useState(0);  // 0–10 %

  /* Submit */
  const [mintStatus,        setMintStatus]        = useState<MintStatus>("idle");
  const [errorMsg,          setErrorMsg]          = useState("");
  const [newNftId,          setNewNftId]          = useState<string | null>(null);

  /* Load balance + fee */
  useEffect(() => {
    const sb = createClient();
    async function load() {
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push("/login?next=/create"); return; }
      const sba = sb as any;
      const [profRes, feeRes] = await Promise.all([
        sba.from("profiles").select("balance").eq("id", user.id).single(),
        sba.from("platform_settings").select("value").eq("key", "minting_fee_eth").single(),
      ]);
      if (profRes.data)  setBalance((profRes.data as any).balance ?? 0);
      if (feeRes.data)   setMintFee(parseFloat((feeRes.data as any).value) || 0.15);
      setLoading(false);
    }
    load();
  }, [router]);

  /* Revoke preview URL on unmount / change */
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  /* Handle file selection */
  const handleFile = useCallback(async (file: File | null | undefined) => {
    if (!file) return;
    setFileError("");
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }

    const result = await validateAndSanitise(file);
    if (!result.ok) { setFileError(result.error ?? "Invalid file."); return; }

    setUploadedFile(result.file!);
    if (ALLOWED_IMAGE.includes(result.file!.type)) {
      setPreviewUrl(URL.createObjectURL(result.file!));
    }
  }, [previewUrl]);

  /* Drag & drop */
  const onDragOver  = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = ()                    => { setIsDragging(false); };
  const onDrop      = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  /* Derived */
  const parsedPrice   = parseFloat(price) || 0;
  const enoughBalance = balance !== null && balance >= mintFee;
  const stops: [string, string] = useMemo(() => [color1, color2], [color1, color2]);

  /* ── Submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim())  { setErrorMsg("Title is required."); return; }
    if (!parsedPrice)   { setErrorMsg("Set a valid price."); return; }
    if (mode === "upload" && !uploadedFile) { setErrorMsg("Please select a file to upload."); return; }

    setErrorMsg("");
    const sb  = createClient();
    const sba = sb as any;

    let imageUrl: string | null = null;

    /* ── Upload file to Supabase Storage ── */
    if (mode === "upload" && uploadedFile) {
      setMintStatus("uploading");
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { setMintStatus("error"); setErrorMsg("Not authenticated."); return; }

      const safeName = sanitiseFilename(uploadedFile.name);
      const path     = `${user.id}/${Date.now()}-${safeName}`;

      const { data: uploaded, error: uploadError } = await sb.storage
        .from("nft-assets")
        .upload(path, uploadedFile, { cacheControl: "31536000", upsert: false });

      if (uploadError) {
        setMintStatus("error");
        setErrorMsg(`Upload failed: ${uploadError.message}`);
        return;
      }

      const { data: { publicUrl } } = sb.storage.from("nft-assets").getPublicUrl(uploaded.path);
      imageUrl = publicUrl;
    }

    /* ── Call mint RPC ── */
    setMintStatus("minting");
    const { data, error } = await sba.rpc("mint_nft_internal", {
      p_title:           title.trim(),
      p_description:     description.trim() || null,
      p_art_shape:       shape,
      p_art_stop_1:      color1,
      p_art_stop_2:      color2,
      p_price:           parsedPrice,
      p_category:        category,
      p_status:          saleStatus,
      p_collection_name: collection.trim() || null,
      p_image_url:       imageUrl,
      p_royalty_pct:     royalty,
    });

    if (error || !(data as any)?.success) {
      setMintStatus("error");
      setErrorMsg((data as any)?.error ?? error?.message ?? "Minting failed.");
    } else if ((data as any).queued) {
      setBalance((data as any).balance ?? balance);
      setMintStatus("queued");
    } else {
      setNewNftId((data as any).nft_id);
      setBalance((data as any).new_balance ?? null);
      setMintStatus("success");
    }
  }

  /* ── Success screen ── */
  if (mintStatus === "success" && newNftId) {
    return (
      <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)", maxWidth:"560px" }}>
        <div style={{ textAlign:"center", padding:"2.5rem 1rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>🎨</div>
          <h2 className="text-headline" style={{ marginBottom:"0.625rem" }}>NFT Minted!</h2>
          <p style={{ color:"var(--text-secondary)", marginBottom:"2rem", lineHeight:1.65 }}>
            <strong style={{ color:"var(--text-primary)" }}>{title}</strong> is now live on the marketplace pending admin review.
          </p>
          {previewUrl && (
            <img src={previewUrl} alt={title} style={{ width:"140px", height:"140px", objectFit:"cover",
              borderRadius:"var(--radius-2xl)", margin:"0 auto 1.75rem", display:"block",
              border:"1px solid var(--border-muted)", boxShadow:"var(--accent-glow)" }} />
          )}
          {!previewUrl && (
            <div style={{ width:"140px", height:"140px", borderRadius:"var(--radius-2xl)", overflow:"hidden",
              margin:"0 auto 1.75rem", border:"1px solid var(--border-muted)", boxShadow:"var(--accent-glow)" }}>
              <ArtworkSVG shape={shape} stops={stops} />
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
            <Link href={`/nft/${newNftId}`} className="btn btn-gradient btn-lg" style={{ justifyContent:"center", borderRadius:"9999px" }}>
              View Your NFT →
            </Link>
            <Link href="/dashboard/created" className="btn btn-secondary btn-lg" style={{ justifyContent:"center", borderRadius:"9999px" }}>
              My Created NFTs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Queued (insufficient balance) screen ── */
  if (mintStatus === "queued") {
    const shortfall = Math.max(0, mintFee - (balance ?? 0));
    return (
      <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)", maxWidth:"560px" }}>
        <div style={{ textAlign:"center", padding:"2.5rem 1rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"1rem" }}>⏳</div>
          <h2 className="text-headline" style={{ marginBottom:"0.625rem" }}>NFT Pending — Awaiting Balance</h2>
          <p style={{ color:"var(--text-secondary)", marginBottom:"1.5rem", lineHeight:1.65 }}>
            <strong style={{ color:"var(--text-primary)" }}>{title}</strong> has been saved and will be minted once your
            balance covers the <strong style={{ color:"var(--accent)" }}>{mintFee} ETH</strong> minting fee.
            Your current balance is <strong style={{ color:"#f87171" }}>{(balance ?? 0).toFixed(4)} ETH</strong> —{" "}
            <strong style={{ color:"#fbbf24" }}>{shortfall.toFixed(4)} ETH</strong> short.
          </p>
          <p style={{ color:"var(--text-muted)", marginBottom:"2rem", fontSize:"0.875rem" }}>
            Once your balance is sufficient, an admin can approve the mint and your NFT will go live automatically.
            You can track its status from your dashboard.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.625rem" }}>
            <Link href="/wallet/deposit" className="btn btn-gradient btn-lg" style={{ justifyContent:"center", borderRadius:"9999px" }}>
              Deposit ETH →
            </Link>
            <Link href="/dashboard" className="btn btn-secondary btn-lg" style={{ justifyContent:"center", borderRadius:"9999px" }}>
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="container section" style={{ textAlign:"center", color:"var(--text-muted)" }}>
      Loading your account…
    </div>
  );

  /* ── Main form ── */
  return (
    <div className="container" style={{ paddingBlock:"clamp(2rem,5vw,3.5rem)" }}>

      {/* Page header */}
      <div style={{ marginBottom:"2rem" }}>
        <p className="text-label" style={{ marginBottom:"0.375rem" }}>Internal Marketplace</p>
        <h1 className="text-headline">Mint New NFT</h1>
        <p style={{ color:"var(--text-muted)", marginTop:"0.375rem", fontSize:"0.9375rem" }}>
          Your NFT is created entirely on-platform — no external wallet or gas fees needed.
        </p>
      </div>

      {/* Balance bar */}
      <div style={{ display:"flex", gap:"1rem", flexWrap:"wrap", marginBottom:"2rem" }}>
        {[
          { label:"Your Balance", value: balance !== null ? `${balance.toFixed(4)} ETH` : "—", accent: !enoughBalance },
          { label:"Minting Fee",  value: `${mintFee} ETH`,                                      accent: false },
        ].map(({ label, value, accent }) => (
          <div key={label} style={{ flex:1, minWidth:160, padding:"1rem 1.25rem",
            background:"var(--bg-surface)", borderRadius:"var(--radius-lg)",
            border:`1px solid ${accent ? "rgba(239,68,68,0.3)" : "var(--border-muted)"}` }}>
            <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em", textTransform:"uppercase",
              color: accent ? "var(--error)" : "var(--accent)", marginBottom:"0.25rem" }}>{label}</p>
            <p style={{ fontSize:"1.375rem", fontWeight:800, color:"var(--text-primary)", lineHeight:1 }}>{value}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(320px,1fr))", gap:"1.5rem", alignItems:"start" }}>

          {/* ── Left: Artwork panel ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

            {/* Mode tabs */}
            <div style={{ display:"flex", background:"var(--bg-elevated)", borderRadius:"var(--radius-lg)",
              padding:"0.25rem", gap:"0.25rem" }}>
              {([
                { id:"generate" as Mode, label:"🎨 Generate Art" },
                { id:"upload"   as Mode, label:"📁 Upload File"  },
              ]).map(({ id, label }) => (
                <button
                  key={id} type="button"
                  onClick={() => { setMode(id); setFileError(""); }}
                  style={{ flex:1, padding:"0.5625rem 0.75rem",
                    borderRadius:"calc(var(--radius-lg) - 0.25rem)",
                    border:"none", cursor:"pointer", fontFamily:"var(--font-sans)",
                    fontWeight:600, fontSize:"0.875rem", transition:"all 200ms ease",
                    background: mode === id ? "var(--bg-surface)" : "transparent",
                    color:      mode === id ? "var(--text-primary)" : "var(--text-muted)",
                    boxShadow:  mode === id ? "var(--shadow-sm)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)",
              borderRadius:"var(--radius-card)", overflow:"hidden", padding:"1.25rem" }}>
              <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em",
                textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"0.875rem" }}>
                Preview
              </p>

              {/* Image preview */}
              {mode === "upload" && previewUrl && (
                <div style={{ position:"relative" }}>
                  <img src={previewUrl} alt="Preview" style={{ width:"100%", aspectRatio:"1",
                    objectFit:"cover", borderRadius:"var(--radius-xl)", display:"block" }} />
                  <button type="button" onClick={() => { setUploadedFile(null); if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }}
                    style={{ position:"absolute", top:"0.5rem", right:"0.5rem", width:"2rem", height:"2rem",
                      borderRadius:"50%", background:"rgba(0,0,0,0.7)", border:"1px solid rgba(255,255,255,0.15)",
                      color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:"0.875rem", fontWeight:700 }}>
                    ✕
                  </button>
                </div>
              )}

              {/* Audio NFT indicator */}
              {mode === "upload" && uploadedFile && isAudioFile && (
                <div style={{ width:"100%", aspectRatio:"1", background:`linear-gradient(135deg,${color1},${color2})`,
                  borderRadius:"var(--radius-xl)", display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", gap:"0.75rem" }}>
                  <span style={{ fontSize:"3rem" }}>🎵</span>
                  <p style={{ fontWeight:700, color:"rgba(0,0,0,0.8)", fontSize:"0.875rem" }}>
                    {uploadedFile.name}
                  </p>
                </div>
              )}

              {/* Generated art preview (always shown as background for audio) */}
              {(mode === "generate" || (!previewUrl && !isAudioFile)) && (
                <div style={{ width:"100%", aspectRatio:"1", borderRadius:"var(--radius-xl)", overflow:"hidden" }}>
                  <ArtworkSVG shape={shape} stops={stops} />
                </div>
              )}
            </div>

            {/* Generate art controls */}
            {mode === "generate" && (
              <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)",
                borderRadius:"var(--radius-card)", padding:"1.25rem" }}>
                <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em",
                  textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"0.875rem" }}>
                  Artwork Style
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"0.5rem", marginBottom:"1rem" }}>
                  {SHAPES.map((s) => (
                    <button key={s.id} type="button" onClick={() => setShape(s.id)} style={{
                      padding:"0.5rem 0.25rem", borderRadius:"0.5rem", cursor:"pointer",
                      fontFamily:"var(--font-sans)", fontSize:"0.6875rem", fontWeight:700,
                      transition:"all 200ms ease",
                      border:`1.5px solid ${shape===s.id ? "var(--accent)" : "var(--border-muted)"}`,
                      background: shape===s.id ? "var(--accent-muted)" : "var(--bg-elevated)",
                      color:      shape===s.id ? "var(--accent)"       : "var(--text-muted)",
                    }}>
                      {s.label}
                    </button>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.875rem" }}>
                  {[
                    { label:"Primary",   value:color1, set:setColor1 },
                    { label:"Secondary", value:color2, set:setColor2 },
                  ].map(({ label, value, set }) => (
                    <div key={label}>
                      <p style={{ fontSize:"0.75rem", fontWeight:600, color:"var(--text-muted)", marginBottom:"0.375rem" }}>
                        {label} colour
                      </p>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem",
                        background:"var(--bg-elevated)", border:"1px solid var(--border)",
                        borderRadius:"9999px", padding:"0.25rem 0.75rem 0.25rem 0.375rem" }}>
                        <input type="color" value={value} onChange={(e) => set(e.target.value)}
                          style={{ width:"1.75rem", height:"1.75rem", border:"none", background:"none",
                            cursor:"pointer", borderRadius:"50%", padding:0 }} />
                        <span style={{ fontSize:"0.8125rem", fontFamily:"var(--font-mono)", color:"var(--text-secondary)" }}>
                          {value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* File upload zone */}
            {mode === "upload" && !uploadedFile && (
              <div
                ref={dropRef}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById("file-input")?.click()}
                style={{
                  border:`2px dashed ${isDragging ? "var(--accent)" : fileError ? "rgba(239,68,68,0.5)" : "var(--border)"}`,
                  borderRadius:"var(--radius-card)", padding:"2.5rem 1rem", textAlign:"center",
                  cursor:"pointer", transition:"all 200ms ease",
                  background: isDragging ? "var(--accent-muted)" : "var(--bg-surface)",
                }}
              >
                <input id="file-input" type="file" style={{ display:"none" }}
                  accept={ALLOWED_ALL.join(",")}
                  onChange={(e) => handleFile(e.target.files?.[0])} />
                <p style={{ fontSize:"2rem", marginBottom:"0.625rem" }}>
                  {isDragging ? "📂" : "🖼️"}
                </p>
                <p style={{ fontWeight:600, color:"var(--text-primary)", marginBottom:"0.375rem" }}>
                  {isDragging ? "Drop to upload" : "Drop file here or click to browse"}
                </p>
                <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>
                  Images: JPG, PNG, GIF, WEBP, SVG &nbsp;·&nbsp; Audio: MP3, WAV, OGG
                </p>
                <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", marginTop:"0.25rem" }}>
                  Max 50 MB
                </p>
              </div>
            )}

            {fileError && (
              <p style={{ fontSize:"0.875rem", color:"var(--error)", fontWeight:600 }}>
                ⚠ {fileError}
              </p>
            )}
          </div>

          {/* ── Right: details form ── */}
          <div style={{ background:"var(--bg-surface)", border:"1px solid var(--border-muted)",
            borderRadius:"var(--radius-card)", padding:"1.5rem", display:"flex",
            flexDirection:"column", gap:"1rem" }}>

            <p style={{ fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.1em",
              textTransform:"uppercase", color:"var(--text-muted)", marginBottom:"0.25rem" }}>
              NFT Details
            </p>

            <div className="db-field">
              <label className="db-label">Title <span style={{ color:"var(--error)" }}>*</span></label>
              <input className="db-input" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cosmic Bloom #001" maxLength={80} required />
            </div>

            <div className="db-field">
              <label className="db-label">Description</label>
              <textarea className="db-textarea" value={description} onChange={(e) => setDesc(e.target.value)}
                placeholder="Describe your artwork…" maxLength={500} rows={3} />
              <p className="db-hint">{description.length}/500</p>
            </div>

            <div className="db-field">
              <label className="db-label">Category <span style={{ color:"var(--error)" }}>*</span></label>
              <select className="select" value={category}
                onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                style={{ width:"100%", borderRadius:"9999px" }}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="db-field">
              <label className="db-label">Collection <span style={{ color:"var(--text-muted)", fontWeight:400 }}>(optional)</span></label>
              <input className="db-input" value={collection} onChange={(e) => setCollection(e.target.value)}
                placeholder="e.g. Bloom Protocol" />
            </div>

            <div className="db-field">
              <label className="db-label">Sale Type</label>
              <div style={{ display:"flex", gap:"0.625rem" }}>
                {([{ v:"buy-now" as const, label:"Buy Now" },{ v:"auction" as const, label:"Open Auction" }]).map(({ v, label }) => (
                  <button key={v} type="button" onClick={() => setSaleStatus(v)} style={{
                    flex:1, padding:"0.625rem", border:`1.5px solid ${saleStatus===v?"var(--accent-border)":"var(--border)"}`,
                    borderRadius:"9999px",
                    background: saleStatus===v ? "var(--accent-muted)" : "var(--bg-elevated)",
                    color:      saleStatus===v ? "var(--accent)"       : "var(--text-secondary)",
                    fontWeight:600, fontSize:"0.875rem", cursor:"pointer", fontFamily:"var(--font-sans)",
                    transition:"all 200ms ease",
                  }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="db-field">
              <label className="db-label">
                {saleStatus==="buy-now" ? "Fixed Price" : "Starting Bid"} (ETH){" "}
                <span style={{ color:"var(--error)" }}>*</span>
              </label>
              <div style={{ position:"relative" }}>
                <input className="db-input" type="number" step="0.001" min="0.001"
                  value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00" style={{ paddingRight:"3.5rem" }} required />
                <span style={{ position:"absolute", right:"1.25rem", top:"50%", transform:"translateY(-50%)",
                  fontSize:"0.875rem", color:"var(--text-muted)", fontWeight:600 }}>ETH</span>
              </div>
              {parsedPrice > 0 && (
                <p className="db-hint">
                  You receive <strong style={{ color:"var(--text-primary)" }}>
                    {parsedPrice.toFixed(4)} ETH
                  </strong> — artists keep 100% of the sale price.
                </p>
              )}
            </div>

            <div className="db-field">
              <label className="db-label">
                Creator Royalty (%)
                <span style={{ fontWeight:400, color:"var(--text-muted)", marginLeft:"0.375rem" }}>
                  — earned on every resale
                </span>
              </label>
              <div style={{ display:"flex", alignItems:"center", gap:"0.875rem" }}>
                <input
                  type="range"
                  min="0" max="15" step="0.5"
                  value={royalty}
                  onChange={(e) => setRoyalty(parseFloat(e.target.value))}
                  style={{ flex:1, accentColor:"var(--accent)" }}
                />
                <span style={{ fontSize:"1rem", fontWeight:800, color:"var(--accent)",
                  minWidth:"2.5rem", textAlign:"right" }}>
                  {royalty}%
                </span>
              </div>
              <p className="db-hint">
                {royalty === 0
                  ? "No royalty — you receive nothing on future resales."
                  : `Each time this NFT is resold, you automatically receive ${royalty}% of the sale price.`}
                {" "}Max 15%.
              </p>
            </div>

            {errorMsg && (
              <p style={{ fontSize:"0.875rem", color:"var(--error)" }}>{errorMsg}</p>
            )}

            <button
              type="submit"
              className="db-save-btn"
              disabled={mintStatus === "uploading" || mintStatus === "minting"}
              style={{ width:"100%", textAlign:"center", padding:"0.9375rem" }}
            >
              {mintStatus === "uploading" ? "Uploading file…"
               : mintStatus === "minting" ? "Minting NFT…"
               : "Mint NFT"}
            </button>

            <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)", textAlign:"center" }}>
              A minting fee will be deducted from your{" "}
              <Link href="/wallet" style={{ color:"var(--accent)" }}>internal wallet</Link>.
            </p>

          </div>
        </div>
      </form>

    </div>
  );
}
