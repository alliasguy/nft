"use client";

import { useState, useMemo, useEffect } from "react";
import NFTCard           from "@/components/NFTCard";
import SectionHeading    from "@/components/SectionHeading";
import { createClient }  from "@/lib/supabase/client";
import { rowToNftItem }  from "@/lib/supabaseToNft";
import {
  ALL_NFTS, CATEGORIES, STATUSES, SORT_OPTIONS,
  type NFTItem, type Category, type Status,
} from "@/lib/mockData";

/* ── tiny icons ─────────────────────────────────────────── */
function IconFilter() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6"  x2="20" y2="6"  />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}
function IconX() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="2" y1="2" x2="10" y2="10" />
      <line x1="10" y1="2" x2="2"  y2="10" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none"
      stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3.5l2.5 2.5 5-5" />
    </svg>
  );
}

/* ── component ───────────────────────────────────────────── */
export default function ExplorePage() {
  const [category,    setCategory]    = useState<Category | "All">("All");
  const [statuses,    setStatuses]    = useState<Set<Status>>(new Set(["buy-now", "auction", "new"]));
  const [maxPrice,    setMaxPrice]    = useState("");
  const [sort,        setSort]        = useState("recent");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Live data from Supabase, mock as fallback ── */
  const [allNfts,   setAllNfts]   = useState<NFTItem[]>(ALL_NFTS);
  const [isLive,    setIsLive]    = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const sb = createClient();
    async function fetchNfts() {
      try {
        const { data, error } = await (sb as any)
          .from("nfts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (!error && data && data.length > 0) {
          setAllNfts((data as any[]).map((row) => rowToNftItem(row)));
          setIsLive(true);
        }
        // If empty or error → keep mock fallback already in state
      } catch {
        /* Network error — mock fallback already set */
      } finally {
        setDataLoading(false);
      }
    }
    fetchNfts();
  }, []);

  /* ── filtering + sorting ── */
  const filtered = useMemo(() => {
    let items = allNfts;

    if (category !== "All")
      items = items.filter((n) => n.category === category);

    if (statuses.size < 3)
      items = items.filter((n) => statuses.has(n.status));

    if (maxPrice) {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) items = items.filter((n) => parseFloat(n.price) <= max);
    }

    switch (sort) {
      case "price-asc":   return [...items].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      case "price-desc":  return [...items].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      case "most-liked":  return [...items].sort((a, b) => b.likes - a.likes);
      case "most-viewed": return [...items].sort((a, b) => b.views - a.views);
      default:            return items;
    }
  }, [category, statuses, maxPrice, sort]);

  /* ── category item counts ── */
  const counts = useMemo(() => {
    const m: Record<string, number> = { All: allNfts.length };
    CATEGORIES.forEach((c) => { m[c] = allNfts.filter((n) => n.category === c).length; });
    return m;
  }, [allNfts]);

  function toggleStatus(s: Status) {
    setStatuses((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function clearAll() {
    setCategory("All");
    setStatuses(new Set(["buy-now", "auction", "new"]));
    setMaxPrice("");
  }

  /* ── active filter chips ── */
  const chips: { label: string; clear: () => void }[] = [];
  if (category !== "All")
    chips.push({ label: category, clear: () => setCategory("All") });
  STATUSES.forEach(({ key, label }) => {
    if (!statuses.has(key))
      chips.push({ label: `No ${label}`, clear: () => toggleStatus(key) });
  });
  if (maxPrice)
    chips.push({ label: `Max ${maxPrice} ETH`, clear: () => setMaxPrice("") });

  return (
    <div className="container section-sm">

      {/* ── page heading ── */}
      <SectionHeading
        label="All Collections"
        title="Explore"
        highlight="Explore"
        subtitle={`${allNfts.length} items${isLive ? "" : " (demo)"}`}
      />

      {/* ── active filter chips ── */}
      {chips.length > 0 && (
        <div className="active-filters" style={{ marginTop: "1.25rem" }}>
          {chips.map((c) => (
            <button key={c.label} className="filter-chip" onClick={c.clear}>
              {c.label}
              <span className="filter-chip__remove"><IconX /></span>
            </button>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={clearAll} style={{ fontSize: "0.8125rem" }}>
            Clear all
          </button>
        </div>
      )}

      {/* ── two-column layout ── */}
      <div className="explore-layout" style={{ marginTop: chips.length > 0 ? "1.25rem" : "2rem" }}>

        {/* ── sidebar ── */}
        <aside className={`explore-sidebar${sidebarOpen ? " is-open" : ""}`}>

          {/* Category */}
          <div className="filter-section">
            <p className="filter-section__heading">Category</p>
            {[{ key: "All" as const }, ...CATEGORIES.map((c) => ({ key: c }))].map(({ key }) => (
              <div
                key={key}
                className={`filter-option${category === key ? " filter-option--active" : ""}`}
                onClick={() => { setCategory(key); setSidebarOpen(false); }}
                role="radio"
                aria-checked={category === key}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setCategory(key)}
              >
                <span className={`filter-radio${category === key ? " filter-radio--checked" : ""}`} />
                <span style={{ flex: 1 }}>{key}</span>
                <span className="filter-option__count">{counts[key]}</span>
              </div>
            ))}
          </div>

          {/* Status */}
          <div className="filter-section">
            <p className="filter-section__heading">Status</p>
            {STATUSES.map(({ key, label }) => {
              const checked = statuses.has(key);
              const count   = allNfts.filter((n) => n.status === key).length;
              return (
                <div
                  key={key}
                  className={`filter-option${checked ? " filter-option--active" : ""}`}
                  onClick={() => toggleStatus(key)}
                  role="checkbox"
                  aria-checked={checked}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && toggleStatus(key)}
                >
                  <span className={`filter-check${checked ? " filter-check--checked" : ""}`}>
                    {checked && <IconCheck />}
                  </span>
                  <span style={{ flex: 1 }}>{label}</span>
                  <span className="filter-option__count">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Price */}
          <div className="filter-section">
            <p className="filter-section__heading">Max Price (ETH)</p>
            <input
              className="price-range-input"
              type="number"
              placeholder="e.g. 5.0"
              min="0"
              step="0.1"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          {/* Clear */}
          <div className="filter-section">
            <button className="btn btn-secondary" style={{ width: "100%" }} onClick={clearAll}>
              Clear Filters
            </button>
          </div>

        </aside>

        {/* ── main grid ── */}
        <div>
          {/* top bar */}
          <div className="explore-topbar">
            <span className="explore-count">
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </span>
            <div style={{ display: "flex", gap: "0.625rem", alignItems: "center" }}>
              {/* mobile filter toggle */}
              <button
                className="btn btn-secondary btn-sm filter-toggle"
                onClick={() => setSidebarOpen((o) => !o)}
                aria-expanded={sidebarOpen}
              >
                <IconFilter />
                Filters{chips.length > 0 ? ` (${chips.length})` : ""}
              </button>
              <select
                className="select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort order"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* grid or empty state */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "5rem 1rem", color: "var(--text-muted)" }}>
              <p style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🔍</p>
              <p className="text-title" style={{ marginBottom: "0.5rem", color: "var(--text-secondary)" }}>
                No items match your filters
              </p>
              <p className="text-body-sm">Try broadening your search or clearing filters.</p>
              <button className="btn btn-outline" style={{ marginTop: "1.5rem" }} onClick={clearAll}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid-nft stagger">
              {filtered.map((nft) => (
                <NFTCard
                  key={nft.id}
                  href={`/nft/${nft.id}`}
                  title={nft.title}
                  creator={{ name: nft.creator.name }}
                  price={nft.price}
                  likes={nft.likes}
                  isLive={nft.isLive}
                  badge={nft.badge}
                  gradient={`linear-gradient(135deg, ${nft.art.stops[0]} 0%, ${nft.art.stops[1]} 100%)`}
                />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
