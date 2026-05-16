import Link            from "next/link";
import NewsletterForm  from "@/components/NewsletterForm";

/* ── Link map: real routes get <Link>, placeholders stay <a> ── */
const LINKS: Record<string, { label: string; href: string; external?: true }[]> = {
  Marketplace: [
    { label: "Explore All",     href: "/explore"                    },
    { label: "Live Auctions",   href: "/explore?status=auction"     },
    { label: "New Drops",       href: "/explore?status=new"         },
    { label: "Rankings",        href: "/rankings"                   },
    { label: "Hot Collections", href: "/collections"                },
  ],
  Resources: [
    { label: "Help Center", href: "/help" },
  ],
  Community: [
    { label: "Discord",         href: "#", external: true },
    { label: "Twitter / X",     href: "#", external: true },
    { label: "Instagram",       href: "#", external: true },
    { label: "Telegram",        href: "#", external: true },
    { label: "YouTube",         href: "#", external: true },
  ],
};

/* ── Social icons ────────────────────────────────────────── */
function IconTwitter() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function IconDiscord() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}
function IconTelegram() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/* ── Logo ────────────────────────────────────────────────── */
function FooterLogo() {
  return (
    <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }} aria-label="Artsorbit home">
      <svg width="26" height="26" viewBox="0 0 30 30" fill="none" aria-hidden>
        <defs>
          <linearGradient id="footer-logo-g" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#e11d48" />
            <stop offset="100%" stopColor="#c026d3" />
          </linearGradient>
        </defs>
        <path d="M15 2L28 15L15 28L2 15Z" fill="url(#footer-logo-g)" />
        <path d="M15 9L21 15L15 21L9 15Z" fill="rgba(0,0,0,0.28)" />
        <path d="M15 2L2 15L15 9Z"        fill="rgba(255,255,255,0.12)" />
      </svg>
      <span style={{ fontWeight: 800, fontSize: "1.25rem", letterSpacing: "-0.025em", background: "linear-gradient(135deg,#e11d48,#c026d3)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
        Artsorbit
      </span>
    </Link>
  );
}

const SOCIALS = [
  { Icon: IconTwitter,   label: "Follow us on Twitter / X" },
  { Icon: IconDiscord,   label: "Join our Discord server"  },
  { Icon: IconInstagram, label: "Follow us on Instagram"   },
  { Icon: IconTelegram,  label: "Join our Telegram channel"},
];

/* ── Component ───────────────────────────────────────────── */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer" aria-label="Site footer">
      <div className="container footer__main">

        {/* ── Four-column grid ── */}
        <div className="footer__grid">

          {/* Brand */}
          <div>
            <FooterLogo />
            <p className="footer__brand-desc">
              Artsorbit is the premier marketplace for rare digital art and collectibles.
              We connect visionary creators with passionate collectors through
              transparent, on-chain trading you can trust.
            </p>
            <div className="footer__socials" aria-label="Follow Artsorbit on social media">
              {SOCIALS.map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  className="footer__social-btn"
                  aria-label={label}
                  rel="noopener noreferrer"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {(Object.entries(LINKS) as [string, typeof LINKS[string]][]).map(([heading, items]) => (
            <div key={heading}>
              <p className="footer__col-heading">{heading}</p>
              <ul className="footer__links">
                {items.map(({ label, href, external }) => (
                  <li key={label}>
                    {/* Internal routes get a Next.js Link; external / placeholder stay <a> */}
                    {href.startsWith("/") ? (
                      <Link href={href} className="footer__link">{label}</Link>
                    ) : (
                      <a
                        href={href}
                        className="footer__link"
                        {...(external ? { rel: "noopener noreferrer", target: "_blank" } : {})}
                      >
                        {label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>

        {/* ── Newsletter ── */}
        <div className="footer__newsletter">
          <div className="footer__newsletter-copy">
            <p className="footer__newsletter-title">Never miss a drop</p>
            <p className="footer__newsletter-sub">
              Curated new releases, artist spotlights, and market insights —
              straight to your inbox, once a week. No spam, ever.
            </p>
          </div>
          {/* NewsletterForm is a Client Component — safe to use inside a Server Component */}
          <NewsletterForm />
        </div>

        {/* ── Bottom bar ── */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {year} Artsorbit, Inc. All rights reserved. &nbsp;·&nbsp;{" "}
            <a href="mailto:support@artsorbit.com"
              style={{ color: "var(--text-muted)", textDecoration: "none" }}>
              support@artsorbit.com
            </a>
          </p>
          <ul className="footer__legal">
            {[
              { label: "Privacy Policy",   href: "/privacy" },
              { label: "Terms of Service", href: "/terms"   },
              { label: "Cookie Settings",  href: "/cookies" },
            ].map(({ label, href }) => (
              <li key={label}>
                <Link href={href} className="footer__legal-link">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </footer>
  );
}
