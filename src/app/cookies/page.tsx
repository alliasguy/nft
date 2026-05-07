import Link   from "next/link";
import Footer from "@/components/Footer";

export const metadata = {
  title: "Cookie Settings — Artsorbit",
  description: "Learn about the cookies and local storage Artsorbit uses and how to manage them.",
};

const EFFECTIVE = "1 May 2026";

function Table({ rows }: {
  rows: { name: string; type: string; purpose: string; duration: string }[]
}) {
  return (
    <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Name", "Type", "Purpose", "Duration"].map((h) => (
              <th key={h} style={{ textAlign: "left", padding: "0.625rem 0.75rem",
                fontSize: "0.6875rem", fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.name}
              style={{ borderBottom: "1px solid var(--border-muted)",
                background: i % 2 === 0 ? "var(--bg-surface)" : "transparent" }}>
              <td style={{ padding: "0.625rem 0.75rem", fontFamily: "var(--font-mono)",
                fontSize: "0.8125rem", color: "var(--accent)", whiteSpace: "nowrap" }}>
                {r.name}
              </td>
              <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-muted)",
                whiteSpace: "nowrap" }}>
                {r.type}
              </td>
              <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-secondary)",
                lineHeight: 1.5 }}>
                {r.purpose}
              </td>
              <td style={{ padding: "0.625rem 0.75rem", color: "var(--text-muted)",
                whiteSpace: "nowrap" }}>
                {r.duration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <>
      <div className="container" style={{ paddingBlock: "clamp(2rem,5vw,4rem)", maxWidth: 760 }}>

        {/* Header */}
        <div style={{ marginBottom: "3rem" }}>
          <p style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em",
            textTransform: "uppercase", color: "var(--accent)", marginBottom: "0.75rem" }}>
            Legal
          </p>
          <h1 style={{ fontSize: "clamp(1.75rem,4vw,2.5rem)", fontWeight: 800,
            color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Cookie Settings
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Effective date: {EFFECTIVE} · Last updated: {EFFECTIVE}
          </p>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem",
            lineHeight: 1.7, marginTop: "1rem", maxWidth: "60ch" }}>
            This page explains how Artsorbit uses cookies and browser local storage, what
            each one does, and how you can manage your preferences.
          </p>
        </div>

        {/* What are cookies */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
            marginBottom: "0.875rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-muted)" }}>
            What Are Cookies?
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            Cookies are small text files stored in your browser when you visit a website.
            They allow the site to remember information about your visit, such as whether
            you are logged in. Artsorbit also uses{" "}
            <strong style={{ color: "var(--text-primary)" }}>local storage</strong> — a
            similar browser mechanism that stores data without an expiry date — for
            lightweight, non-sensitive preferences.
          </p>
        </section>

        {/* Essential cookies */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
            marginBottom: "0.5rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-muted)" }}>
            Essential Cookies
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8,
            marginBottom: "0.75rem" }}>
            These cookies are required for the platform to function. You cannot opt out of
            them while using Artsorbit.
          </p>
          <Table rows={[
            {
              name: "sb-*-auth-token",
              type: "Authentication",
              purpose: "Stores your Supabase session token so you remain logged in across page navigations.",
              duration: "Session / up to 1 week",
            },
            {
              name: "sb-*-auth-token-code-verifier",
              type: "Authentication",
              purpose: "Used during the OAuth PKCE flow to verify sign-in. Deleted immediately after login.",
              duration: "Session",
            },
          ]} />
        </section>

        {/* Functional local storage */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
            marginBottom: "0.5rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-muted)" }}>
            Functional Local Storage
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8,
            marginBottom: "0.75rem" }}>
            These items are stored in your browser&rsquo;s local storage to improve your
            experience. No personal information is transmitted to our servers from these entries.
          </p>
          <Table rows={[
            {
              name: "ao_viewer_id",
              type: "Analytics",
              purpose: "A randomly generated anonymous ID used to count unique NFT views. Never linked to your account or email.",
              duration: "Persistent (until cleared)",
            },
            {
              name: "view_{nft-id}",
              type: "Analytics",
              purpose: "Records the timestamp of your last view of a specific NFT, preventing the view counter from incrementing more than once per 24 hours.",
              duration: "Persistent (until cleared)",
            },
          ]} />
        </section>

        {/* Third-party cookies */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
            marginBottom: "0.5rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-muted)" }}>
            Third-Party Cookies
          </h2>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8,
            marginBottom: "0.75rem" }}>
            Some of our service providers set their own cookies. We have no direct control
            over these cookies — refer to each provider&rsquo;s policy for details.
          </p>
          <Table rows={[
            {
              name: "smartsupp_*",
              type: "Live Chat",
              purpose: "Set by Smartsupp to maintain your chat session and remember if you have opened the chat widget before.",
              duration: "Session / up to 30 days",
            },
          ]} />
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.875rem" }}>
            Smartsupp:{" "}
            <a href="https://www.smartsupp.com/privacy-policy/" target="_blank"
              rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
              Privacy Policy
            </a>
          </p>
        </section>

        {/* What we do not use */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
            marginBottom: "0.875rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-muted)" }}>
            What We Do Not Use
          </h2>
          <ul style={{ paddingLeft: "1.25rem", listStyle: "disc",
            display: "flex", flexDirection: "column", gap: "0.375rem",
            fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>
            <li style={{ paddingLeft: "0.5rem" }}>Advertising or tracking cookies of any kind.</li>
            <li style={{ paddingLeft: "0.5rem" }}>Social media tracking pixels.</li>
            <li style={{ paddingLeft: "0.5rem" }}>Third-party analytics platforms (e.g. Google Analytics).</li>
            <li style={{ paddingLeft: "0.5rem" }}>Cross-site tracking or behavioural profiling.</li>
          </ul>
        </section>

        {/* How to manage */}
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "var(--text-primary)",
            marginBottom: "0.875rem", paddingBottom: "0.5rem",
            borderBottom: "1px solid var(--border-muted)" }}>
            How to Manage Cookies
          </h2>
          <div style={{ fontSize: "0.9375rem", color: "var(--text-secondary)", lineHeight: 1.8,
            display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <p>
              You can control and delete cookies through your browser settings. The links
              below explain how for the most common browsers:
            </p>
            <ul style={{ paddingLeft: "1.25rem", listStyle: "disc",
              display: "flex", flexDirection: "column", gap: "0.375rem" }}>
              {[
                { label: "Google Chrome", href: "https://support.google.com/chrome/answer/95647" },
                { label: "Mozilla Firefox", href: "https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox" },
                { label: "Safari", href: "https://support.apple.com/en-gb/guide/safari/sfri11471/mac" },
                { label: "Microsoft Edge", href: "https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" },
              ].map(({ label, href }) => (
                <li key={label} style={{ paddingLeft: "0.5rem" }}>
                  <a href={href} target="_blank" rel="noopener noreferrer"
                    style={{ color: "var(--accent)" }}>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <p>
              Note: disabling the essential authentication cookies will prevent you from
              logging in to Artsorbit.
            </p>
            <p>
              To clear local storage entries (ao_viewer_id, view_*), open DevTools in your
              browser (F12), navigate to{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                Application → Local Storage → {typeof window !== "undefined" ? window.location.origin : "https://www.artsorbit.com"}
              </strong>{" "}
              and delete any entries you wish to remove.
            </p>
          </div>
        </section>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem",
          borderTop: "1px solid var(--border-muted)",
          display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
          <Link href="/privacy" style={{ color: "var(--accent)", fontSize: "0.875rem" }}>
            Privacy Policy →
          </Link>
          <Link href="/terms" style={{ color: "var(--accent)", fontSize: "0.875rem" }}>
            Terms of Service →
          </Link>
        </div>

      </div>
      <Footer />
    </>
  );
}
