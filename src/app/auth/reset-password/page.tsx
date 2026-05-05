"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link          from "next/link";
import { createClient } from "@/lib/supabase/client";

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

/* Password strength — 0 weak … 3 strong */
function strength(pw: string): 0 | 1 | 2 | 3 {
  if (pw.length < 6)  return 0;
  if (pw.length < 10) return 1;
  const mix = /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^a-zA-Z0-9]/.test(pw);
  return mix ? 3 : 2;
}
const STRENGTH_LABEL = ["Too short", "Fair", "Good", "Strong"];
const STRENGTH_COLOR = ["var(--error)", "#f59e0b", "#3b82f6", "var(--success)"];

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [showPw,    setShowPw]    = useState(false);
  const [showCf,    setShowCf]    = useState(false);
  const [status,    setStatus]    = useState<"idle"|"loading"|"success"|"error">("idle");
  const [errMsg,    setErrMsg]    = useState("");

  const pw        = strength(password);
  const mismatch  = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 8 && !mismatch && status !== "loading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus("loading");
    setErrMsg("");

    const sb = createClient();
    const { error } = await sb.auth.updateUser({ password });

    if (error) {
      setErrMsg(error.message);
      setStatus("error");
    } else {
      setStatus("success");
      setTimeout(() => router.push("/dashboard"), 2_500);
    }
  }

  return (
    <div style={{
      minHeight: "calc(100dvh - var(--nav-height))",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem 1rem", background: "var(--bg-base)",
    }}>

      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(225,29,72,0.06) 0%, transparent 70%)",
      }} aria-hidden />

      <div style={{
        position: "relative", width: "100%", maxWidth: "440px",
        background: "var(--bg-surface)", border: "1px solid var(--border-muted)",
        borderRadius: "var(--radius-2xl)", overflow: "hidden",
      }}>
        <div style={{ height: "3px", background: "linear-gradient(90deg,#e11d48,#c026d3)" }} />

        <div style={{ padding: "clamp(2rem,6vw,3rem) clamp(1.5rem,5vw,2.5rem)" }}>

          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <span style={{ fontWeight:800, fontSize:"1.25rem", letterSpacing:"-0.025em",
              background:"linear-gradient(135deg,#e11d48,#c026d3)",
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>
              NFTX
            </span>
          </div>

          {status === "success" ? (
            /* ── Success state ── */
            <div style={{ textAlign:"center" }}>
              <div style={{ width:"64px", height:"64px", borderRadius:"50%",
                background:"rgba(16,185,129,0.12)", border:"2px solid rgba(16,185,129,0.35)",
                display:"flex", alignItems:"center", justifyContent:"center",
                margin:"0 auto 1.25rem", boxShadow:"0 0 24px rgba(16,185,129,0.2)" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                  stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
              </div>
              <p style={{ fontWeight:800, fontSize:"1.375rem", color:"var(--text-primary)", marginBottom:"0.5rem", letterSpacing:"-0.02em" }}>
                Password Updated!
              </p>
              <p style={{ fontSize:"0.9375rem", color:"var(--text-secondary)", lineHeight:1.65 }}>
                Your password has been changed. Redirecting you to the dashboard…
              </p>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <h1 style={{ margin:"0 0 0.5rem", fontSize:"1.5rem", fontWeight:800,
                color:"var(--text-primary)", letterSpacing:"-0.02em" }}>
                Set new password
              </h1>
              <p style={{ margin:"0 0 1.75rem", fontSize:"0.9375rem", color:"var(--text-secondary)", lineHeight:1.6 }}>
                Choose a strong password for your NFTX account.
              </p>

              {status === "error" && (
                <div style={{ padding:"0.75rem 1rem", background:"rgba(239,68,68,0.1)",
                  border:"1px solid rgba(239,68,68,0.2)", borderRadius:"0.5rem",
                  color:"#f87171", fontSize:"0.875rem", marginBottom:"1.25rem" }}>
                  {errMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate>
                {/* New password */}
                <div className="db-field">
                  <label className="db-label" htmlFor="pw">New password</label>
                  <div style={{ position:"relative" }}>
                    <input
                      id="pw"
                      className="db-input"
                      type={showPw ? "text" : "password"}
                      placeholder="Min. 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingRight:"3rem" }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowPw(p => !p)}
                      style={{ position:"absolute", right:"1rem", top:"50%", transform:"translateY(-50%)",
                        background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", display:"flex" }}>
                      <IconEye open={showPw} />
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div style={{ marginTop:"0.5rem" }}>
                      <div style={{ display:"flex", gap:"0.25rem", marginBottom:"0.3rem" }}>
                        {[0,1,2,3].map((i) => (
                          <div key={i} style={{
                            flex:1, height:"3px", borderRadius:"9999px",
                            background: i <= pw ? STRENGTH_COLOR[pw] : "var(--border-muted)",
                            transition:"background 200ms ease",
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize:"0.75rem", color:STRENGTH_COLOR[pw], fontWeight:600 }}>
                        {STRENGTH_LABEL[pw]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div className="db-field" style={{ marginTop:"1rem" }}>
                  <label className="db-label" htmlFor="cf">Confirm password</label>
                  <div style={{ position:"relative" }}>
                    <input
                      id="cf"
                      className="db-input"
                      type={showCf ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      style={{ paddingRight:"3rem",
                        borderColor: mismatch ? "rgba(239,68,68,0.5)" : undefined }}
                      autoComplete="new-password"
                    />
                    <button type="button" onClick={() => setShowCf(p => !p)}
                      style={{ position:"absolute", right:"1rem", top:"50%", transform:"translateY(-50%)",
                        background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", display:"flex" }}>
                      <IconEye open={showCf} />
                    </button>
                  </div>
                  {mismatch && (
                    <p style={{ fontSize:"0.8125rem", color:"var(--error)", marginTop:"0.375rem" }}>
                      Passwords do not match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-gradient btn-lg"
                  style={{ width:"100%", justifyContent:"center", borderRadius:"9999px", marginTop:"1.5rem" }}
                  disabled={!canSubmit}
                >
                  {status === "loading" ? "Updating…" : "Update Password"}
                </button>
              </form>

              <p style={{ marginTop:"1.25rem", fontSize:"0.875rem", color:"var(--text-muted)", textAlign:"center" }}>
                Remembered it?{" "}
                <Link href="/login" style={{ color:"var(--accent)", fontWeight:600 }}>
                  Back to login
                </Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
