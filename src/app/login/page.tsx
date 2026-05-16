"use client";

import { useState, Suspense }   from "react";
import Link                     from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient }         from "@/lib/supabase/client";

/* ── tiny icons ─────────────────────────────────────────── */
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

function LogoMark() {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
      <svg width="28" height="28" viewBox="0 0 30 30" fill="none">
        <defs>
          <linearGradient id="login-logo" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#e11d48"/>
            <stop offset="100%" stopColor="#c026d3"/>
          </linearGradient>
        </defs>
        <path d="M15 2L28 15L15 28L2 15Z" fill="url(#login-logo)"/>
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

/* useSearchParams() must live inside a Suspense boundary for static export */
function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const next         = searchParams.get("next") ?? "/dashboard";

  const [email,    setEmail]   = useState("");
  const [password, setPassword]= useState("");
  const [showPass, setShowPass]= useState(false);
  const [remember, setRemember]= useState(false);
  const [status,   setStatus]  = useState<"idle" | "loading" | "error">("idle");
  const [errMsg,   setErrMsg]  = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setStatus("loading");
    setErrMsg("");

    const supabaseConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      && process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://your-project-id.supabase.co";

    if (supabaseConfigured) {
      /* ── Real Supabase Auth ── */
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrMsg(error.message);
        setStatus("error");
        return;
      }

      /* Check admin role to decide redirect */
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", currentUser.id)
          .maybeSingle();          // maybeSingle — returns null instead of throwing when no row
        const role = (profile as { role?: string } | null)?.role;
        router.push(role === "admin" ? "/admin" : next);
        router.refresh();
      } else {
        router.push(next);
        router.refresh();
      }
    } else {
      /* ── No-Supabase fallback (dev without credentials) ── */
      await new Promise((r) => setTimeout(r, 800));
      router.push(next);
    }
  }

  return (
    <div className="auth-page">

      {/* ── Brand panel ── */}
      <div className="auth-brand">
        <div className="auth-brand__glow" aria-hidden />
        <LogoMark />
        <div style={{ position: "relative", zIndex: 1 }}>
          <p className="auth-brand__quote">
            "The world's most rare digital art lives here — collected by those who see value first."
          </p>
        </div>
        <div className="auth-brand__stat-row">
          {[{ v: "1K+",   l: "Artworks" }, { v: "$3.2K", l: "Total Volume" }, { v: "120+",  l: "Creators" }].map((s) => (
            <div key={s.l}>
              <p style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{s.v}</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="auth-form-col">
        <div className="auth-card">

          <p className="auth-title">Welcome back</p>
          <p className="auth-subtitle">Sign in to your Artsorbit account to continue collecting.</p>

          {status === "error" && (
            <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "0.5rem", color: "#f87171", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
              {errMsg || "Invalid email or password. Please try again."}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input id="email" className="input" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            <div className="form-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4375rem" }}>
                <label className="form-label" htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
                <a href="#" style={{ fontSize: "0.8125rem", color: "var(--accent)", fontWeight: 500 }}>Forgot password?</a>
              </div>
              <div className="input-wrapper">
                <input id="password" className="input" type={showPass ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" />
                <button type="button" className="input-eye" onClick={() => setShowPass((p) => !p)}
                  aria-label={showPass ? "Hide password" : "Show password"}>
                  <IconEye open={showPass} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom: "1.5rem" }}>
              <label className="form-checkbox" onClick={() => setRemember((r) => !r)}>
                <span className={`form-checkbox__box${remember ? " form-checkbox__box--checked" : ""}`}>
                  {remember && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </span>
                Keep me signed in for 30 days
              </label>
            </div>

            <button type="submit" className="btn btn-gradient btn-lg"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={status === "loading"}>
              {status === "loading" ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p style={{ marginTop: "1.5rem", fontSize: "0.875rem", color: "var(--text-muted)", textAlign: "center" }}>
            Don&rsquo;t have an account?&nbsp;
            <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create one free</Link>
          </p>


        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
