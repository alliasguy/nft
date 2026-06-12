"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { usePathname }         from "next/navigation";
import { createClient }        from "@/lib/supabase/client";

/* ── Context-specific nav link sets ──────────────────────── */
const MAIN_LINKS = [
  { label: "Explore",     href: "/explore"     },
  { label: "Collections", href: "/collections" },
  { label: "Create",      href: "/create"      },
  { label: "Rankings",    href: "/rankings"    },
];

const DASHBOARD_LINKS = [
  { label: "Overview",  href: "/dashboard"           },
  { label: "Collected", href: "/dashboard/collected" },
  { label: "Created",   href: "/dashboard/created"   },
  { label: "Activity",  href: "/dashboard/activity"  },
  { label: "Settings",  href: "/dashboard/settings"  },
  { label: "Wallet",    href: "/wallet"               },
];

const ADMIN_LINKS = [
  { label: "Analytics",     href: "/admin"                },
  { label: "Users",         href: "/admin/users"          },
  { label: "Moderation",    href: "/admin/moderation"     },
  { label: "Deposits",      href: "/admin/deposits"       },
  { label: "Withdrawals",   href: "/admin/withdrawals"    },
  { label: "Pending Mints", href: "/admin/pending-mints"  },
  { label: "Settings",      href: "/admin/settings"       },
];

/* ── Icons ───────────────────────────────────────────────── */
function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6"  x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12"/>
      <line x1="4" y1="18" x2="16" y2="18"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  );
}
function IconWallet() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h15a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z"/>
      <path d="M16 3H5a2 2 0 0 0-2 2v2"/>
      <circle cx="17" cy="13" r="1" fill="currentColor" stroke="none"/>
    </svg>
  );
}
function IconArrowLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}

/* ── Logo mark ───────────────────────────────────────────── */
function LogoMark() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#e11d48"/>
          <stop offset="100%" stopColor="#c026d3"/>
        </linearGradient>
      </defs>
      <path d="M15 2L28 15L15 28L2 15Z" fill="url(#logo-g)"/>
      <path d="M15 9L21 15L15 21L9 15Z" fill="rgba(0,0,0,0.28)"/>
      <path d="M15 2L2 15L15 9Z"        fill="rgba(255,255,255,0.12)"/>
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────── */
export default function Navbar() {
  const pathname                         = usePathname();
  const [scrolled,  setScrolled]         = useState(false);
  const [menuOpen,  setMenuOpen]         = useState(false);
  const [balance,   setBalance]          = useState<number | null>(null);
  const [authed,    setAuthed]           = useState(false);

  /* Determine which section we're in */
  const isDashboard = pathname.startsWith("/dashboard") || pathname.startsWith("/wallet");
  const isAdmin     = pathname.startsWith("/admin");
  const isInApp     = isDashboard || isAdmin;

  /* Pick the right nav set */
  const NAV_LINKS = isDashboard ? DASHBOARD_LINKS : isAdmin ? ADMIN_LINKS : MAIN_LINKS;

  /* Section label for the header strip */
  const sectionLabel = isDashboard ? "Dashboard" : isAdmin ? "Admin Console" : null;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  /* Auth + balance
   *
   * We use getSession() (reads from cookie — no network request, no lock)
   * rather than getUser() (verifies JWT server-side — competes for the Web
   * Lock that middleware also holds, causing AbortError "steal" conflicts).
   *
   * onAuthStateChange handles sign-in / sign-out reactively so we don't
   * need to re-run the effect on every pathname change.
   */
  useEffect(() => {
    const sb = createClient();

    async function fetchBalance(uid: string) {
      const { data } = await (sb as any)
        .from("profiles")
        .select("balance")
        .eq("id", uid)
        .single();
      if (data) setBalance((data as any).balance ?? 0);
    }

    /* Read the current session from the local cache — no network call */
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      setAuthed(true);
      fetchBalance(session.user.id);
    });

    /* Stay reactive to sign-in / sign-out / token refresh */
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      const loggedIn = !!session?.user;
      setAuthed(loggedIn);
      if (loggedIn) fetchBalance(session!.user!.id);
      else           setBalance(null);
    });

    return () => subscription.unsubscribe();
  }, []); // ← runs once; onAuthStateChange handles all subsequent changes

  /* Refresh balance after navigating to wallet/deposit/withdraw pages */
  useEffect(() => {
    if (!authed) return;
    const sb = createClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      (sb as any)
        .from("profiles")
        .select("balance")
        .eq("id", session.user.id)
        .single()
        .then(({ data }: { data: unknown }) => {
          if (data) setBalance((data as any).balance ?? 0);
        });
    });
  }, [pathname, authed]);

  const glassy = scrolled || menuOpen;

  return (
    <header className={`navbar${glassy ? " navbar--scrolled" : ""}`}>

      {/* ── Main bar ── */}
      <div className="container navbar__inner">

        {/* Logo */}
        <Link href="/" className="navbar__logo" aria-label="Artsorbit — go to homepage">
          <LogoMark/>
          <span className="gradient-text" style={{ fontWeight:800, fontSize:"1.25rem", letterSpacing:"-0.025em" }}>
            Artsorbit
          </span>
        </Link>

        {/* Section badge (dashboard / admin) — desktop only */}
        {sectionLabel && (
          <span style={{
            display:"inline-flex", alignItems:"center", gap:"0.375rem",
            fontSize:"0.6875rem", fontWeight:700, letterSpacing:"0.08em",
            textTransform:"uppercase", padding:"0.25rem 0.75rem",
            borderRadius:"9999px",
            background: isAdmin ? "var(--gold-muted)" : "var(--accent-muted)",
            color:       isAdmin ? "var(--gold)"       : "var(--accent)",
            border:`1px solid ${isAdmin ? "rgba(254,228,64,0.3)" : "var(--accent-border)"}`,
            flexShrink:0,
          }}>
            {isAdmin && "⚙ "}{sectionLabel}
          </span>
        )}

        {/* Search bar — only on main site pages */}
        {!isInApp && (
          <div className="navbar__search" role="search">
            <span className="navbar__search-icon" aria-hidden><IconSearch/></span>
            <input
              className="navbar__search-input"
              type="search"
              placeholder="Search items, collections, creators…"
              aria-label="Search marketplace"
            />
          </div>
        )}

        {/* Desktop nav links (context-aware) */}
        <nav className="navbar__nav" aria-label="Main navigation">
          {NAV_LINKS.map((l) => {
            const active = l.href === "/dashboard"
              ? pathname === "/dashboard"
              : l.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`navbar__link${active ? " navbar__link--active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Right-side actions
            · In-app pages (dashboard/admin/wallet): show live balance pill
            · Public pages, logged in: show a quiet "My Account" link
            · Public pages, logged out: show Log In + Sign Up              */}
        {authed ? (
          isInApp ? (
            /* Dashboard / admin / wallet → show balance */
            <Link
              href="/wallet"
              className="btn btn-primary btn-sm navbar__cta"
              style={{ borderRadius:"9999px", gap:"0.375rem", flexShrink:0 }}
              aria-label="My Wallet"
            >
              <IconWallet/>
              {balance !== null ? `${balance.toFixed(3)} ETH` : "Wallet"}
            </Link>
          ) : (
            /* Public pages → quiet account link, no balance */
            <Link href="/dashboard" className="navbar__link" style={{ flexShrink:0 }}>
              My Account
            </Link>
          )
        ) : (
          <>
            <Link href="/login"  className="navbar__link" style={{ flexShrink:0 }}>Log In</Link>
            <Link href="/signup" className="btn btn-outline btn-sm navbar__cta" style={{ flexShrink:0, borderRadius:"9999px" }}>
              Sign Up
            </Link>
          </>
        )}

        {/* Hamburger */}
        <button
          className="navbar__hamburger"
          onClick={() => setMenuOpen(o => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
        >
          {menuOpen ? <IconClose/> : <IconMenu/>}
        </button>
      </div>

      {/* ── Mobile slide-down menu ── */}
      <div
        id="mobile-menu"
        className={`navbar__mobile-menu${menuOpen ? " navbar__mobile-menu--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <div className="container navbar__mobile-menu__inner">

          {/* Search — only on main site */}
          {!isInApp && (
            <div className="navbar__search navbar__search--mobile" role="search">
              <span className="navbar__search-icon" aria-hidden><IconSearch/></span>
              <input
                className="navbar__search-input"
                type="search"
                placeholder="Search items, collections, creators…"
                aria-label="Search marketplace"
              />
            </div>
          )}

          {/* Section heading on mobile when in app */}
          {sectionLabel && (
            <p style={{ fontSize:"0.625rem", fontWeight:700, letterSpacing:"0.12em", textTransform:"uppercase",
              color: isAdmin ? "var(--gold)" : "var(--accent)", padding:"0.25rem 0.5rem 0.75rem" }}>
              {sectionLabel}
            </p>
          )}

          {/* Context-aware nav links */}
          <nav aria-label="Mobile navigation">
            {NAV_LINKS.map((l) => {
              const active = l.href === "/dashboard"
                ? pathname === "/dashboard"
                : l.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`navbar__mobile-link${active ? " navbar__link--active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          {/* Divider + "Back to Marketplace" when inside app */}
          {isInApp && (
            <div style={{ borderTop:"1px solid var(--border-muted)", paddingTop:"0.75rem", marginTop:"0.5rem" }}>
              <Link
                href="/"
                className="navbar__mobile-link"
                style={{ color:"var(--text-muted)", fontSize:"0.875rem" }}
                onClick={() => setMenuOpen(false)}
              >
                <IconArrowLeft/>
                &nbsp; Back to Marketplace
              </Link>
            </div>
          )}

          {/* Auth / Wallet CTA */}
          <div style={{ marginTop:"1rem", display:"flex", flexDirection:"column", gap:"0.625rem" }}>
            {authed ? (
              isInApp ? (
                /* In-app: wallet balance + sign out */
                <>
                  <Link
                    href="/wallet"
                    className="btn btn-gradient"
                    style={{ width:"100%", justifyContent:"center", borderRadius:"9999px" }}
                    onClick={() => setMenuOpen(false)}
                  >
                    <IconWallet/>
                    Wallet · {balance !== null ? `${balance.toFixed(3)} ETH` : "—"}
                  </Link>
                  <button
                    className="btn btn-secondary"
                    style={{ width:"100%", justifyContent:"center", borderRadius:"9999px", color:"#f87171", borderColor:"rgba(239,68,68,0.3)" }}
                    onClick={async () => {
                      setMenuOpen(false);
                      const { createClient: cc } = await import("@/lib/supabase/client");
                      await cc().auth.signOut();
                      window.location.href = "/login";
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                /* Public pages: quiet dashboard link */
                <Link
                  href="/dashboard"
                  className="btn btn-secondary"
                  style={{ width:"100%", justifyContent:"center", borderRadius:"9999px" }}
                  onClick={() => setMenuOpen(false)}
                >
                  My Account →
                </Link>
              )
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.625rem" }}>
                <Link href="/login"  className="btn btn-secondary" style={{ justifyContent:"center" }} onClick={() => setMenuOpen(false)}>Log In</Link>
                <Link href="/signup" className="btn btn-outline"   style={{ justifyContent:"center", borderRadius:"9999px" }} onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </div>
            )}
          </div>

        </div>
      </div>

    </header>
  );
}
