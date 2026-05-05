import Link from "next/link";

export const metadata = { title: "Email Verified — NFTX" };

export default function VerifiedPage() {
  return (
    <div style={{
      minHeight: "calc(100dvh - var(--nav-height))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem 1rem",
      background: "var(--bg-base)",
    }}>

      {/* Ambient glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(0,245,212,0.07) 0%, transparent 70%)",
      }} aria-hidden />

      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "460px",
        background: "var(--bg-surface)",
        border: "1px solid var(--border-muted)",
        borderRadius: "var(--radius-2xl)",
        overflow: "hidden",
        textAlign: "center",
      }}>
        {/* Top accent bar */}
        <div style={{ height: "3px", background: "linear-gradient(90deg,#00f5d4,#f15bb5)" }} />

        <div style={{ padding: "clamp(2rem,6vw,3rem) clamp(1.5rem,5vw,2.5rem)" }}>

          {/* Animated check circle */}
          <div style={{
            width: "72px", height: "72px",
            borderRadius: "50%",
            background: "rgba(0,245,212,0.12)",
            border: "2px solid rgba(0,245,212,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 0 32px rgba(0,245,212,0.2)",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="#00f5d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          {/* Logo */}
          <div style={{ marginBottom: "1.25rem" }}>
            <span style={{
              fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.025em",
              background: "linear-gradient(135deg,#e11d48,#c026d3)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>
              NFTX
            </span>
          </div>

          <h1 style={{
            margin: "0 0 0.625rem",
            fontSize: "clamp(1.375rem,4vw,1.75rem)",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
          }}>
            Email Verified!
          </h1>

          <p style={{
            margin: "0 0 2rem",
            fontSize: "0.9375rem",
            color: "var(--text-secondary)",
            lineHeight: 1.65,
          }}>
            Your NFTX account is now active. You can start collecting, creating,
            and trading rare digital art.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
            <Link
              href="/dashboard"
              className="btn btn-gradient btn-lg"
              style={{ justifyContent: "center", borderRadius: "9999px" }}
            >
              Go to My Dashboard →
            </Link>
            <Link
              href="/explore"
              className="btn btn-secondary btn-lg"
              style={{ justifyContent: "center", borderRadius: "9999px" }}
            >
              Browse the Marketplace
            </Link>
          </div>

          {/* Deposit nudge */}
          <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            To buy NFTs, start by{" "}
            <Link href="/wallet/deposit" style={{ color: "var(--accent)", fontWeight: 600 }}>
              depositing ETH
            </Link>{" "}
            into your internal wallet.
          </p>

        </div>
      </div>

    </div>
  );
}
