"use client";

import { useState, useEffect } from "react";
import { createClient }        from "@/lib/supabase/client";

/* ── Types ────────────────────────────────────────────────── */
interface Settings {
  deposit_wallet_address: string;
  minting_fee_eth:        string;
  platform_fee_pct:       string;
  min_withdrawal_eth:     string;
}

type SaveState = "idle" | "saving" | "saved" | "error";

/* ── Small save-button component ─────────────────────────── */
function SaveBtn({
  state, onClick, label = "Save Changes",
}: { state: SaveState; onClick: () => void; label?: string }) {
  return (
    <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"1.25rem" }}>
      <button
        className="adm-save-btn"
        onClick={onClick}
        disabled={state === "saving" || state === "saved"}
      >
        {state === "saving" ? "Saving…" : state === "saved" ? "✓  Saved!" : label}
      </button>
    </div>
  );
}

/* ── Toggle (UI only for now) ────────────────────────────── */
function Toggle({ label, desc, defaultOn = false }: { label:string; desc:string; defaultOn?:boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="db-toggle">
      <div className="db-toggle__info">
        <p className="db-toggle__label">{label}</p>
        <p className="db-toggle__desc">{desc}</p>
      </div>
      <button
        className={`db-toggle__switch db-toggle__switch--${on?"on":"off"}`}
        onClick={() => setOn(v => !v)}
        aria-pressed={on} aria-label={label}
      />
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function PlatformSettingsPage() {
  /* Live settings from Supabase */
  const [settings,  setSettings]  = useState<Settings>({
    deposit_wallet_address: "",
    minting_fee_eth:        "0.05",
    platform_fee_pct:       "2",
    min_withdrawal_eth:     "0.01",
  });
  const [loading, setLoading] = useState(true);

  /* Per-section save states */
  const [walletState, setWalletState] = useState<SaveState>("idle");
  const [feeState,    setFeeState]    = useState<SaveState>("idle");
  const [walletError, setWalletError] = useState("");
  const [feeError,    setFeeError]    = useState("");

  /* Copy-to-clipboard */
  const [copied, setCopied] = useState(false);

  /* ── Load settings on mount ── */
  useEffect(() => {
    const sb = createClient();
    async function load() {
      const { data } = await (sb as any)
        .from("platform_settings")
        .select("key, value");
      if (data) {
        const map: Record<string, string> = {};
        (data as {key:string; value:string}[]).forEach(({ key, value }) => { map[key] = value; });
        setSettings((prev) => ({ ...prev, ...map }));
      }
      setLoading(false);
    }
    load();
  }, []);

  /* ── Generic save helper ── */
  async function saveKeys(
    keys: (keyof Settings)[],
    setState: (s: SaveState) => void,
    setError: (s: string) => void,
  ) {
    setState("saving");
    setError("");
    const sb = createClient();
    const sba = sb as any;

    try {
      for (const key of keys) {
        const { error } = await sba
          .from("platform_settings")
          .update({ value: settings[key] })
          .eq("key", key);
        if (error) throw new Error(error.message);
      }
      setState("saved");
      setTimeout(() => setState("idle"), 2500);
    } catch (err: unknown) {
      setState("error");
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  function set(key: keyof Settings) {
    return (value: string) => setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function copyWallet() {
    navigator.clipboard.writeText(settings.deposit_wallet_address).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <>
        <div className="adm-page-header">
          <h1 className="adm-page-title">Platform Settings</h1>
        </div>
        <div className="adm-page-body" style={{ color:"var(--text-muted)" }}>
          Loading settings…
        </div>
      </>
    );
  }

  return (
    <>
      <div className="adm-page-header">
        <div>
          <h1 className="adm-page-title">Platform Settings</h1>
          <p className="adm-page-sub">Live configuration — changes take effect immediately</p>
        </div>
        <span className="adm-mode-badge">
          <span style={{ width:6,height:6,borderRadius:"50%",background:"var(--gold)",display:"inline-block",boxShadow:"0 0 6px var(--gold)" }}/>
          Admin Mode Active
        </span>
      </div>

      <div className="adm-page-body" style={{ maxWidth:760 }}>

        {/* ══════════════════════════════════════════════════
            DEPOSIT WALLET — most important setting
           ══════════════════════════════════════════════════ */}
        <div className="adm-settings-card" style={{ borderColor:"rgba(254,228,64,0.3)" }}>
          <p className="adm-settings-card__title" style={{ color:"var(--gold)" }}>
            💎 Deposit Wallet Address
          </p>

          <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", lineHeight:1.65, marginBottom:"1.25rem" }}>
            This is the Ethereum address you control. Users will send ETH here when making
            deposits. Once set, it is shown on the <strong style={{ color:"var(--text-primary)" }}>Deposit</strong> page
            and users must include their transaction hash as proof.
          </p>

          <div className="adm-field">
            <label className="adm-label">
              Platform ETH Wallet Address{" "}
              {!settings.deposit_wallet_address && (
                <span style={{ color:"var(--error)", fontWeight:400 }}>⚠ Not set — users cannot deposit</span>
              )}
            </label>
            <div style={{ display:"flex", gap:"0.625rem", alignItems:"center" }}>
              <input
                className="adm-input"
                style={{ flex:1, fontFamily:"var(--font-mono)", fontSize:"0.875rem" }}
                placeholder="0x..."
                value={settings.deposit_wallet_address}
                onChange={(e) => set("deposit_wallet_address")(e.target.value)}
              />
              {settings.deposit_wallet_address && (
                <button
                  className="btn btn-sm btn-outline"
                  style={{ borderRadius:"9999px", flexShrink:0 }}
                  onClick={copyWallet}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              )}
            </div>
            <p className="adm-hint" style={{ marginTop:"0.5rem" }}>
              Enter the full 42-character Ethereum address (starting with 0x). Only you have access to
              the private key — NFTX never holds funds directly.
            </p>
          </div>

          {/* Live preview of what users will see */}
          {settings.deposit_wallet_address && (
            <div style={{ marginTop:"1rem", padding:"0.875rem 1.125rem", background:"var(--bg-elevated)", border:"1px solid var(--accent-border)", borderRadius:"var(--radius-lg)", fontSize:"0.875rem", color:"var(--text-secondary)", lineHeight:1.65 }}>
              <p style={{ fontWeight:700, color:"var(--accent)", marginBottom:"0.25rem", fontSize:"0.75rem", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                Preview — what users see on the Deposit page:
              </p>
              <p style={{ fontFamily:"var(--font-mono)", color:"var(--accent)", wordBreak:"break-all" }}>
                {settings.deposit_wallet_address}
              </p>
            </div>
          )}

          {walletError && (
            <p style={{ fontSize:"0.875rem", color:"var(--error)", marginTop:"0.5rem" }}>{walletError}</p>
          )}

          <SaveBtn
            state={walletState}
            onClick={() => saveKeys(["deposit_wallet_address"], setWalletState, setWalletError)}
            label="Save Wallet Address"
          />
        </div>

        {/* ══════════════════════════════════════════════════
            FEES
           ══════════════════════════════════════════════════ */}
        <div className="adm-settings-card">
          <p className="adm-settings-card__title">💰 Fees &amp; Limits</p>

          <p style={{ fontSize:"0.875rem", color:"var(--text-muted)", marginBottom:"1.25rem", lineHeight:1.65 }}>
            These values are read by the database functions at transaction time —
            changes apply to all new transactions immediately.
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px,1fr))", gap:"1rem" }}>

            <div className="adm-field">
              <label className="adm-label">Platform Fee (%)</label>
              <input
                className="adm-input"
                type="number" step="0.1" min="0" max="20"
                value={settings.platform_fee_pct}
                onChange={(e) => set("platform_fee_pct")(e.target.value)}
              />
              <p className="adm-hint">Deducted from each sale. Seller receives the rest.</p>
            </div>

            <div className="adm-field">
              <label className="adm-label">Minting Fee (ETH)</label>
              <input
                className="adm-input"
                type="number" step="0.001" min="0"
                value={settings.minting_fee_eth}
                onChange={(e) => set("minting_fee_eth")(e.target.value)}
              />
              <p className="adm-hint">Charged to creators when minting a new NFT.</p>
            </div>

            <div className="adm-field">
              <label className="adm-label">Min Withdrawal (ETH)</label>
              <input
                className="adm-input"
                type="number" step="0.001" min="0"
                value={settings.min_withdrawal_eth}
                onChange={(e) => set("min_withdrawal_eth")(e.target.value)}
              />
              <p className="adm-hint">Minimum amount a user can request to withdraw.</p>
            </div>

          </div>

          {/* Live fee preview */}
          {parseFloat(settings.platform_fee_pct) >= 0 && (
            <div style={{ marginTop:"1rem", padding:"0.875rem 1.125rem", background:"var(--bg-elevated)", borderRadius:"var(--radius-lg)", fontSize:"0.875rem" }}>
              <p style={{ fontWeight:700, color:"var(--text-muted)", marginBottom:"0.5rem", fontSize:"0.75rem", letterSpacing:"0.08em", textTransform:"uppercase" }}>
                Example: 1 ETH sale
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.25rem" }}>
                {[
                  { label:"Buyer pays",      val:"1.000 ETH" },
                  { label:"Platform fee",    val:`${(1 * parseFloat(settings.platform_fee_pct||"0") / 100).toFixed(4)} ETH  (${settings.platform_fee_pct}%)` },
                  { label:"Seller receives", val:`${(1 - 1 * parseFloat(settings.platform_fee_pct||"0") / 100).toFixed(4)} ETH` },
                ].map(({ label, val }) => (
                  <div key={label} style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ color:"var(--text-muted)" }}>{label}</span>
                    <span style={{ fontWeight:600, color:"var(--text-primary)" }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {feeError && (
            <p style={{ fontSize:"0.875rem", color:"var(--error)", marginTop:"0.5rem" }}>{feeError}</p>
          )}

          <SaveBtn
            state={feeState}
            onClick={() => saveKeys(
              ["platform_fee_pct","minting_fee_eth","min_withdrawal_eth"],
              setFeeState,
              setFeeError,
            )}
            label="Save Fee Settings"
          />
        </div>

        {/* ══════════════════════════════════════════════════
            CONTENT MODERATION  (UI state only)
           ══════════════════════════════════════════════════ */}
        <div className="adm-settings-card">
          <p className="adm-settings-card__title">🛡️ Content Moderation</p>
          <Toggle label="Manual review queue"  desc="All new NFT listings enter moderation before going live"        defaultOn={false} />
          <Toggle label="Auto-flag duplicates" desc="Flag NFTs whose artwork hash matches an existing listing"       defaultOn={true}  />
          <Toggle label="NSFW filter"          desc="Restrict explicit content to verified adult accounts"           defaultOn={true}  />
        </div>

        {/* ══════════════════════════════════════════════════
            MAINTENANCE (UI state only)
           ══════════════════════════════════════════════════ */}
        <div className="adm-settings-card">
          <p className="adm-settings-card__title">🔧 Maintenance &amp; Access</p>
          <Toggle label="New registrations" desc="Allow new users to create accounts"             defaultOn={true}  />
          <Toggle label="New NFT listings"  desc="Allow creators to submit new NFTs"               defaultOn={true}  />
          <Toggle label="Trading paused"    desc="Freeze all buy/sell transactions platform-wide"  defaultOn={false} />
          <Toggle label="Maintenance mode"  desc="Show a maintenance page to non-admin visitors"   defaultOn={false} />
        </div>

        {/* ══════════════════════════════════════════════════
            DANGER ZONE
           ══════════════════════════════════════════════════ */}
        <div className="adm-settings-card adm-settings-card--danger">
          <p className="adm-settings-card__title">⚠️ Danger Zone</p>
          <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", marginBottom:"1.25rem", lineHeight:1.65 }}>
            These actions are irreversible. Proceed with extreme caution.
          </p>
          <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
            <button className="btn btn-sm" style={{ background:"rgba(239,68,68,0.1)", color:"#f87171", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"9999px" }}>
              Reset All Sessions
            </button>
            <button className="btn btn-sm" style={{ background:"rgba(239,68,68,0.15)", color:"#f87171", border:"1px solid rgba(239,68,68,0.4)", borderRadius:"9999px", fontWeight:700 }}>
              Emergency Lock — Freeze All Trading
            </button>
          </div>
        </div>

      </div>
    </>
  );
}
