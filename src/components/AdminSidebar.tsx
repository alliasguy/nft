"use client";

import { useState }                        from "react";
import type { ReactNode }                  from "react";
import Link                                from "next/link";
import { usePathname, useRouter }          from "next/navigation";
import { createClient }                    from "@/lib/supabase/client";

const NAV: { label: string; href: string; icon: ReactNode; badge?: string }[] = [
  { label: "Analytics",        href: "/admin",                    icon: <IcoAnalytics /> },
  { label: "User Management",  href: "/admin/users",              icon: <IcoUsers />,   badge: "12,847" },
  { label: "NFT Moderation",   href: "/admin/moderation",         icon: <IcoShield />,  badge: "8 new"  },
  { label: "Deposits",         href: "/admin/deposits",           icon: <IcoDeposit />  },
  { label: "Withdrawals",      href: "/admin/withdrawals",        icon: <IcoWithdraw /> },
  { label: "Pending Mints",    href: "/admin/pending-mints",      icon: <IcoPendingMint /> },
  { label: "Platform Settings",href: "/admin/settings",           icon: <IcoSettings /> },
];

/* ── Icons ───────────────────────────────────────────────── */
function IcoAnalytics() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6"  y1="20" x2="6"  y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  );
}
function IcoUsers() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
function IcoShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}
function IcoSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}
function IcoDeposit() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v10M8 8l4 4 4-4"/><rect x="3" y="16" width="18" height="6" rx="2"/>
    </svg>
  );
}
function IcoWithdraw() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12M8 16l4-4 4 4"/><rect x="3" y="2" width="18" height="6" rx="2"/>
    </svg>
  );
}
function IcoPendingMint() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function IcoStore() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function IcoLogOut() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}
function IcoMenu() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="15" y2="18"/>
    </svg>
  );
}
function IcoClose() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6"  x2="6"  y2="18"/>
      <line x1="6"  y1="6"  x2="18" y2="18"/>
    </svg>
  );
}

/* ── Component ───────────────────────────────────────────── */
export default function AdminSidebar() {
  const pathname          = usePathname();
  const router            = useRouter();
  const [open, setOpen]   = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      <aside className={`adm-sidebar${open ? " adm-sidebar--open" : ""}`}>

        {/* ── Header ── */}
        <div className="adm-sidebar-header">
          <p className="adm-sidebar-title" style={{ display:"flex", alignItems:"center", gap:"0.375rem" }}>
            <IcoSettings />Admin Console
          </p>
          <p className="adm-sidebar-sub">Artsorbit Platform v1.0</p>
        </div>

        {/* ── Nav ── */}
        <nav className="adm-nav" aria-label="Admin navigation">
          <p className="adm-nav__section-label">Management</p>
          {NAV.map((item) => {
            const active = item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`adm-nav__link${active ? " adm-nav__link--active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <span className="adm-nav__icon">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="adm-nav__badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Footer ── */}
        <div className="adm-sidebar-footer">
          <p className="adm-nav__section-label">Navigation</p>
          <Link href="/dashboard" className="adm-nav__link" onClick={() => setOpen(false)}>
            <span className="adm-nav__icon"><IcoStore /></span>
            User Dashboard
          </Link>
          <button className="adm-nav__link" onClick={handleSignOut}>
            <span className="adm-nav__icon"><IcoLogOut /></span>
            Sign Out
          </button>
        </div>

        {/* ── Admin Mode Active strip ── */}
        <div className="adm-mode-strip">
          <span className="adm-mode-dot" />
          <span className="adm-mode-label">Admin Mode Active</span>
        </div>

      </aside>

      {/* Mobile navigation handled by Navbar hamburger — no FAB needed */}
      <button style={{ display:"none" }} aria-hidden
        className="adm-sidebar-toggle"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close admin menu" : "Open admin menu"}
      >
        {open ? <IcoClose /> : <IcoMenu />}
      </button>
    </>
  );
}
