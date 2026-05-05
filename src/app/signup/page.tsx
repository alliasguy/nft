"use client";

import { useState, useMemo } from "react";
import Link                  from "next/link";
import { useRouter }         from "next/navigation";
import { createClient }      from "@/lib/supabase/client";

function IconEye({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <circle cx="12" cy="12" r="3"/>
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
function IconWallet() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
      <path d="M16 3H5a2 2 0 0 0-2 2v2"/>
      <circle cx="17" cy="13" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}

function LogoMark() {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
      <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
        <defs>
          <linearGradient id="signup-logo" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#e11d48"/>
            <stop offset="100%" stopColor="#c026d3"/>
          </linearGradient>
        </defs>
        <path d="M15 2L28 15L15 28L2 15Z" fill="url(#signup-logo)"/>
        <path d="M15 9L21 15L15 21L9 15Z" fill="rgba(0,0,0,0.28)"/>
        <path d="M15 2L2 15L15 9Z"        fill="rgba(255,255,255,0.12)"/>
      </svg>
      <span style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.025em",
        background: "linear-gradient(135deg,#e11d48,#c026d3)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        Artsorbit
      </span>
    </Link>
  );
}

const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

export default function SignupPage() {
  const router                         = useRouter();
  const [name,     setName]            = useState("");
  const [email,    setEmail]           = useState("");
  const [password, setPassword]        = useState("");
  const [confirm,  setConfirm]         = useState("");
  const [showPass, setShowPass]        = useState(false);
  const [terms,    setTerms]           = useState(false);
  const [status,   setStatus]          = useState<"idle" | "loading">("idle");

  const strength = useMemo(() => {
    if (!password) return 0;
    if (password.length < 6) return 1;
    const hasUpper   = /[A-Z]/.test(password);
    const hasNum     = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    if (password.length >= 12 && hasUpper && hasNum && hasSpecial) return 4;
    if ((hasUpper && hasNum) || (hasNum && hasSpecial)) return 3;
    return 2;
  }, [password]);

  const mismatch = confirm.length > 0 && confirm !== password;

  const [signupErr, setSignupErr] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password || !terms || mismatch) return;
    setStatus("loading");
    setSignupErr("");

    const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-id.supabase.co";

    if (supabaseConfigured) {
      /* ── Real Supabase Auth ── */
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }, /* passed to the handle_new_user() trigger */
        },
      });

      if (error) {
        setSignupErr(error.message);
        setStatus("idle");
        return;
      }
    } else {
      /* ── Demo / no-Supabase fallback ── */
      await new Promise((r) => setTimeout(r, 1100));
    }

    router.push("/dashboard");
  }

  return (
    <div className="auth-page">

      {/* ── Brand panel ── */}
      <div className="auth-brand">
        <div className="auth-brand__glow" aria-hidden />
        <LogoMark />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="auth-brand__quote">
            "Join 38 000 creators who earn royalties every time their work resells — forever."
          </p>
        </div>
        <div className="auth-brand__stat-row">
          {[
            { v: "2%",        l: "Platform fee"  },
            { v: "10%",       l: "Max royalty"   },
            { v: "< 5 min",   l: "To first mint" },
          ].map((s) => (
            <div key={s.l}>
              <p style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{s.v}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form-col">
        <div className="auth-card">

          <p className="auth-title">Create your account</p>
          <p className="auth-subtitle">Start collecting and selling rare digital art today.</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Display name</label>
              <input id="name" className="input" type="text" placeholder="Your name or artist alias"
                value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" className="input" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <div className="input-wrapper">
                <input id="password" className="input" type={showPass ? "text" : "password"}
                  placeholder="Minimum 8 characters"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="new-password" />
                <button type="button" className="input-eye" onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}>
                  <IconEye open={showPass} />
                </button>
              </div>
              {/* Strength meter */}
              {password.length > 0 && (
                <div className="pw-strength">
                  <div className="pw-strength__bars">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className={`pw-strength__bar${strength >= n ? ` pw-strength__bar--${strength}` : ""}`} />
                    ))}
                  </div>
                  <span className={`pw-strength__text pw-strength__text--${strength}`}>
                    {STRENGTH_LABELS[strength]}
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirm">Confirm password</label>
              <input id="confirm" className="input" type={showPass ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                required autoComplete="new-password"
                style={mismatch ? { borderColor: "var(--error)" } : {}} />
              {mismatch && <p className="form-error">Passwords do not match</p>}
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="form-checkbox" onClick={() => setTerms((t) => !t)}>
                <span className={`form-checkbox__box${terms ? " form-checkbox__box--checked" : ""}`}>
                  {terms && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                <span>
                  I agree to the{" "}
                  <a href="#" style={{ color: "var(--accent)" }}>Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" style={{ color: "var(--accent)" }}>Privacy Policy</a>
                </span>
              </label>
            </div>

            {signupErr && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)", borderRadius: "0.5rem",
                color: "#f87171", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                {signupErr}
              </div>
            )}
            <button type="submit" className="btn btn-gradient btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={status === "loading" || !terms || mismatch || !name || !email || !password}>
              {status === "loading" ? "Creating account…" : "Create Account — Free"}
            </button>
          </form>

          <div className="auth-divider">or sign up with</div>

          <button className="social-btn" type="button">
            <IconWallet />
            Connect Wallet (no password needed)
          </button>

          <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>
            Already have an account?&nbsp;
            <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
