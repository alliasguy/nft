"use client";

import { useState, useEffect } from "react";
import { useProfile }          from "@/hooks/useProfile";
import { createClient }        from "@/lib/supabase/client";

/* ── Toggle switch ────────────────────────────────────────── */
function Toggle({ label, desc, defaultOn = false }: { label: string; desc: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="db-toggle">
      <div className="db-toggle__info">
        <p className="db-toggle__label">{label}</p>
        <p className="db-toggle__desc">{desc}</p>
      </div>
      <button
        className={`db-toggle__switch db-toggle__switch--${on ? "on" : "off"}`}
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        aria-label={label}
      />
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { profile, userId, loading, refetch } = useProfile();

  /* ── Form state (pre-filled from real profile) ── */
  const [name,    setName]    = useState("");
  const [handle,  setHandle]  = useState("");
  const [bio,     setBio]     = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [wallet,  setWallet]  = useState("");
  const [discord, setDiscord] = useState("");
  const [instagram, setInstagram] = useState("");

  /* ── Status state for each save section ── */
  type SaveState = "idle" | "saving" | "saved" | "error";
  const [profileStatus, setProfileStatus] = useState<SaveState>("idle");
  const [profileError,  setProfileError]  = useState("");
  const [socialStatus,  setSocialStatus]  = useState<SaveState>("idle");
  const [walletStatus,  setWalletStatus]  = useState<SaveState>("idle");
  const [pwStatus,      setPwStatus]      = useState<SaveState>("idle");

  /* Password fields */
  const [newPw,    setNewPw]    = useState("");
  const [confirmPw,setConfirmPw]= useState("");

  /* Pre-fill form when profile loads */
  useEffect(() => {
    if (!profile) return;
    setName(profile.name        ?? "");
    setHandle(profile.handle    ?? "");
    setBio(profile.bio          ?? "");
    setWebsite(profile.website  ?? "");
    setTwitter(profile.twitter  ?? "");
    setWallet(profile.wallet_address ?? "");
  }, [profile]);

  /* ── Save helpers ── */
  async function saveProfile() {
    if (!userId) return;
    setProfileStatus("saving");
    setProfileError("");
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb.from("profiles") as any)
      .update({ name: name.trim(), handle: handle.replace(/^@/, "").trim(), bio: bio.trim() || null })
      .eq("id", userId);

    if (error) {
      setProfileError(
        error.code === "23505"
          ? `Handle @${handle} is already taken — please choose another.`
          : error.message
      );
      setProfileStatus("error");
    } else {
      setProfileStatus("saved");
      await refetch();
      setTimeout(() => setProfileStatus("idle"), 2500);
    }
  }

  const [socialError, setSocialError] = useState("");
  const [walletError, setWalletError] = useState("");
  const [pwError,     setPwError]     = useState("");

  async function saveSocial() {
    if (!userId) return;
    setSocialStatus("saving");
    setSocialError("");
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb.from("profiles") as any).update({ website: website.trim() || null, twitter: twitter.trim() || null }).eq("id", userId);
    if (error) { setSocialError(error.message); setSocialStatus("error"); }
    else        { setSocialStatus("saved"); setTimeout(() => setSocialStatus("idle"), 2500); }
  }

  async function saveWallet() {
    if (!userId) return;
    setWalletStatus("saving");
    setWalletError("");
    const sb = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (sb.from("profiles") as any).update({ wallet_address: wallet.trim() || null }).eq("id", userId);
    if (error) { setWalletError(error.message); setWalletStatus("error"); }
    else        { setWalletStatus("saved"); setTimeout(() => setWalletStatus("idle"), 2500); }
  }

  async function changePassword() {
    if (!newPw || newPw !== confirmPw) return;
    setPwStatus("saving");
    setPwError("");
    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password: newPw });
    if (!error) {
      setNewPw("");
      setConfirmPw("");
      setPwStatus("saved");
      setTimeout(() => setPwStatus("idle"), 2500);
    } else {
      setPwError(error.message);
      setPwStatus("error");
    }
  }

  /* ── Reusable save button ── */
  function SaveBtn({ status, onClick, label = "Save Changes" }: {
    status: SaveState;
    onClick: () => void;
    label?: string;
  }) {
    return (
      <div style={{ display:"flex", justifyContent:"flex-end", marginTop:"1.25rem" }}>
        <button
          className="db-save-btn"
          onClick={onClick}
          disabled={status === "saving" || status === "saved"}
        >
          {status === "saving" ? "Saving…" : status === "saved" ? "✓  Saved!" : label}
        </button>
      </div>
    );
  }

  const initials = (profile?.name ?? "??").slice(0, 2).toUpperCase();

  return (
    <>
      <div className="db-page-header">
        <h1 className="db-page-title">Settings</h1>
        <p className="db-page-sub">
          {loading ? "Loading your profile…" : `Editing profile for @${profile?.handle ?? "—"}`}
        </p>
      </div>

      <div className="db-page-body" style={{ maxWidth:"720px" }}>

        {/* ── Public Profile ── */}
        <div className="db-settings-card">
          <p className="db-settings-card__title"><span>👤</span> Public Profile</p>

          {/* Avatar */}
          <div style={{ display:"flex", alignItems:"center", gap:"1.25rem", marginBottom:"1.5rem" }}>
            <div style={{ width:"4rem", height:"4rem", borderRadius:"50%", flexShrink:0, background:"linear-gradient(135deg,#00f5d4,#f15bb5)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:"1.125rem", color:"var(--bg-base)", border:"2px solid rgba(0,245,212,0.4)", boxShadow:"0 0 16px rgba(0,245,212,0.2)" }}>
              {initials}
            </div>
            <div>
              <button className="btn btn-secondary btn-sm" style={{ borderRadius:"9999px", marginBottom:"0.375rem" }}>
                Upload Photo
              </button>
              <p style={{ fontSize:"0.8125rem", color:"var(--text-muted)" }}>JPG, PNG or GIF. Max 5 MB.</p>
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:"1rem" }}>
            <div className="db-field">
              <label className="db-label">Display Name</label>
              <input
                className="db-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="db-field">
              <label className="db-label">Username</label>
              <input
                className="db-input"
                value={handle}
                onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
                placeholder="your_handle"
              />
              <p className="db-hint">nftx.io/u/{handle || "your_handle"}</p>
            </div>
          </div>

          <div className="db-field">
            <label className="db-label">Bio</label>
            <textarea
              className="db-textarea"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell collectors about yourself and your work…"
              maxLength={280}
            />
            <p className="db-hint">{bio.length}/280 characters</p>
          </div>

          {profileStatus === "error" && (
            <p style={{ fontSize:"0.875rem", color:"var(--error)", marginTop:"0.5rem" }}>
              {profileError}
            </p>
          )}

          <SaveBtn status={profileStatus} onClick={saveProfile} />
        </div>

        {/* ── Account & Email ── */}
        <div className="db-settings-card">
          <p className="db-settings-card__title"><span>📧</span> Account & Security</p>

          <div className="db-field">
            <label className="db-label">Email Address</label>
            <input
              className="db-input"
              type="email"
              defaultValue={profile ? `${profile.handle}@nftx.io` : ""}
              disabled
              style={{ opacity:0.6, cursor:"not-allowed" }}
            />
            <p className="db-hint">Email is managed by Supabase Auth and cannot be changed here.</p>
          </div>

          <div className="db-field">
            <label className="db-label">New Password</label>
            <input
              className="db-input"
              type="password"
              placeholder="Enter new password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="db-field">
            <label className="db-label">Confirm New Password</label>
            <input
              className="db-input"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
            {newPw && confirmPw && newPw !== confirmPw && (
              <p style={{ fontSize:"0.875rem", color:"var(--error)", marginTop:"0.375rem" }}>
                Passwords do not match
              </p>
            )}
          </div>

          {pwStatus === "error" && pwError && (
            <p style={{ fontSize:"0.875rem", color:"var(--error)", marginTop:"0.375rem" }}>{pwError}</p>
          )}
          <SaveBtn
            status={pwStatus}
            onClick={changePassword}
            label="Update Password"
          />
        </div>

        {/* ── Social Links ── */}
        <div className="db-settings-card">
          <p className="db-settings-card__title"><span>🔗</span> Social Links</p>

          {[
            { label:"Website",     icon:"🌐", value:website,  set:setWebsite,  placeholder:"https://yourwebsite.com"     },
            { label:"Twitter / X", icon:"✕",  value:twitter,  set:setTwitter,  placeholder:"https://twitter.com/yourname" },
            { label:"Instagram",   icon:"📸", value:instagram,set:setInstagram,placeholder:"https://instagram.com/you"   },
            { label:"Discord",     icon:"💬", value:discord,  set:setDiscord,  placeholder:"YourName#0000"                },
          ].map(({ label, icon, value, set, placeholder }) => (
            <div key={label} className="db-field">
              <label className="db-label">{icon} {label}</label>
              <input
                className="db-input"
                value={value}
                onChange={(e) => set(e.target.value)}
                placeholder={placeholder}
              />
            </div>
          ))}

          {socialStatus === "error" && socialError && (
            <p style={{ fontSize:"0.875rem", color:"var(--error)", marginBottom:"0.5rem" }}>{socialError}</p>
          )}
          <SaveBtn status={socialStatus} onClick={saveSocial} label="Save Links" />
        </div>

        {/* ── Wallet ── */}
        <div className="db-settings-card">
          <p className="db-settings-card__title"><span>💎</span> Wallet Address</p>

          <div className="db-field">
            <label className="db-label">Public Wallet Address</label>
            <input
              className="db-input"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              style={{ fontFamily:"var(--font-mono)", fontSize:"0.875rem" }}
            />
            <p className="db-hint">
              Displayed on your public profile. This is a display field only — it does not control on-chain ownership.
            </p>
          </div>

          {walletStatus === "saved" && (
            <p style={{ fontSize:"0.875rem", color:"var(--success)", marginBottom:"0.5rem" }}>Wallet address updated.</p>
          )}
          {walletStatus === "error" && walletError && (
            <p style={{ fontSize:"0.875rem", color:"var(--error)", marginBottom:"0.5rem" }}>{walletError}</p>
          )}

          <SaveBtn status={walletStatus} onClick={saveWallet} label="Save Wallet" />
        </div>

        {/* ── Notifications ── */}
        <div className="db-settings-card">
          <p className="db-settings-card__title"><span>🔔</span> Notifications</p>
          <Toggle label="Outbid alerts"        desc="Email me when someone outbids me"              defaultOn={true}  />
          <Toggle label="Sale confirmed"        desc="Email me when one of my items sells"           defaultOn={true}  />
          <Toggle label="New bids on my items"  desc="Email me when someone bids on my NFTs"        defaultOn={true}  />
          <Toggle label="New followers"         desc="Email me when someone follows my profile"     defaultOn={false} />
          <Toggle label="Price drop alerts"     desc="Email me when a watchlisted item drops price" defaultOn={true}  />
          <Toggle label="Marketing emails"      desc="Platform updates and featured drops"          defaultOn={false} />
          <SaveBtn status="idle" onClick={() => {}} label="Save Preferences" />
        </div>

        {/* ── Danger Zone ── */}
        <div className="db-settings-card" style={{ borderColor:"rgba(239,68,68,0.25)" }}>
          <p className="db-settings-card__title" style={{ color:"var(--error)" }}>
            <span>⚠️</span> Danger Zone
          </p>
          <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", marginBottom:"1.25rem", lineHeight:1.65 }}>
            Permanently delete your account and all associated profile data. Your NFTs remain on-chain
            but will no longer be linked to this profile. This action cannot be undone.
          </p>
          <button
            className="btn btn-sm"
            style={{ background:"rgba(239,68,68,0.1)", color:"#f87171", border:"1px solid rgba(239,68,68,0.25)", borderRadius:"9999px" }}
          >
            Delete Account
          </button>
        </div>

      </div>
    </>
  );
}
