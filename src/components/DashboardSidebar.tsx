"use client";

import { useState, useEffect } from "react";
import Link                    from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient }        from "@/lib/supabase/client";
import { useProfile }          from "@/hooks/useProfile";

const USER = {
  name:    "CryptoCollector",
  handle:  "@crypto_collector",
  wallet:  "0x742d…a3f8",
  gradient:"linear-gradient(135deg,#00f5d4,#f15bb5)",
};

/* ── SVG icons ───────────────────────────────────────────── */
function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  );
}
function IconCollection() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5z"/>
      <path d="M14 5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V5z"/>
      <path d="M4 16a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3z"/>
      <path d="M14 13a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6z"/>
    </svg>
  );
}
function IconBrush() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.06 11.9l8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/>
      <path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1 1 2.48 1.02 3.5 1.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-2.5-3.02z"/>
    </svg>
  );
}
function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  );
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="15" y2="18"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  );
}
function IconStore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IconLogOut() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────── */
export default function DashboardSidebar() {
  const pathname              = usePathname();
  const router                = useRouter();
  const [open, setOpen]       = useState(false);
  const { profile, userId, refetch } = useProfile();

  /* Re-fetch profile whenever the user navigates (e.g. after saving wallet in Settings) */
  useEffect(() => { refetch(); }, [pathname]);

  /* Real collected / created counts from Supabase */
  const [collectedCount, setCollectedCount] = useState<number | null>(null);
  const [createdCount,   setCreatedCount]   = useState<number | null>(null);

  useEffect(() => {
    if (!userId) return;
    const uid = userId;
    const sb  = createClient();
    const sba = sb as any;

    Promise.all([
      sba.from("nft_ownership").select("*", { count: "exact", head: true }).eq("owner_id", uid),
      sba.from("nfts").select("*",           { count: "exact", head: true }).eq("creator_id", uid),
    ]).then(([ownedRes, createdRes]) => {
      if (ownedRes.count   !== null) setCollectedCount(ownedRes.count);
      if (createdRes.count !== null) setCreatedCount(createdRes.count);
    });
  }, [userId]);

  /* Nav items with live badge counts */
  const NAV = [
    { label: "Overview",  href: "/dashboard",           icon: <IconGrid />,       badge: null },
    { label: "Collected", href: "/dashboard/collected",  icon: <IconCollection />, badge: collectedCount !== null ? String(collectedCount) : null },
    { label: "Created",   href: "/dashboard/created",   icon: <IconBrush />,      badge: createdCount   !== null ? String(createdCount)   : null },
    { label: "Activity",  href: "/dashboard/activity",  icon: <IconActivity />,   badge: null },
    { label: "Settings",  href: "/dashboard/settings",  icon: <IconSettings />,   badge: null },
  ];

  /* Derived display values — fall back to placeholders while loading */
  const displayName   = profile?.name           ?? "—";
  const displayHandle = profile?.handle         ? `@${profile.handle}` : "—";
  const displayWallet = profile?.wallet_address
    ? `${profile.wallet_address.slice(0, 6)}…${profile.wallet_address.slice(-4)}`
    : "No wallet linked";
  const initials = (profile?.name ?? "??").slice(0, 2).toUpperCase();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  const sidebar = (
    <aside className={`db-sidebar${open ? " db-sidebar--open" : ""}`}>

      {/* ── Profile mini-card ── */}
      <div className="db-sidebar-profile">
        <div
          className="db-sidebar-avatar"
          style={{ background: USER.gradient }}
          aria-hidden
        >
          {initials}
        </div>
        <p className="db-sidebar-name">{displayName}</p>
        <p className="db-sidebar-handle">{displayHandle}</p>
        <p className="db-sidebar-wallet">{displayWallet}</p>
      </div>

      {/* ── Navigation ── */}
      <nav className="db-nav" aria-label="Dashboard navigation">
        <p className="db-nav__section-label">Menu</p>
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`db-nav__link${active ? " db-nav__link--active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="db-nav__icon">{item.icon}</span>
              {item.label}
              {item.badge && (
                <span className="db-nav__badge">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer actions ── */}
      <div className="db-sidebar-footer">
        <p className="db-nav__section-label">Account</p>
        <Link href="/" className="db-nav__link" onClick={() => setOpen(false)}>
          <span className="db-nav__icon"><IconStore /></span>
          Marketplace
        </Link>
        <button className="db-nav__link" onClick={handleSignOut}>
          <span className="db-nav__icon"><IconLogOut /></span>
          Sign Out
        </button>
      </div>

    </aside>
  );

  return (
    <>
      {/* Sidebar renders only; desktop CSS keeps it visible, mobile CSS hides it */}
      {sidebar}

      {/* Mobile navigation is handled by the Navbar hamburger — no FAB needed */}
    </>
  );
}
