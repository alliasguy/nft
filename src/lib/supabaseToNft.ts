/**
 * Maps Supabase NFTRow (and optional related tables) → NFTItem shape
 * used throughout the UI.  Works for both list views (no traits/bids)
 * and detail views (with traits + bids pre-fetched).
 */

import type { NFTRow } from "@/lib/database.types";
import type { NFTItem, Category, Status, ArtShape, Bid, Trait } from "@/lib/mockData";

/* ── Relative-time helper ────────────────────────────────── */
export function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins   = Math.floor(diffMs / 60_000);
  const hours  = Math.floor(diffMs / 3_600_000);
  const days   = Math.floor(diffMs / 86_400_000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hr${hours  > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/* ── USD estimate when not stored ────────────────────────── */
function estimateUsd(ethPrice: number): string {
  return (ethPrice * 3_900).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

/* ── Row types from related tables ──────────────────────── */
export interface SupabaseTrait {
  label:         string;
  value:         string;
  rarity:        string;
  display_order: number;
}

export interface SupabaseBid {
  bidder_name:     string;
  bidder_gradient: string | null;
  amount:          number;
  usd_value:       string | null;
  created_at:      string;
}

/* ── Main mapper ─────────────────────────────────────────── */
export function rowToNftItem(
  row:    NFTRow,
  traits: SupabaseTrait[] = [],
  bids:   SupabaseBid[]   = [],
): NFTItem {
  const mappedTraits: Trait[] = [...traits]
    .sort((a, b) => a.display_order - b.display_order)
    .map(({ label, value, rarity }) => ({ label, value, rarity }));

  const mappedBids: Bid[] = [...bids]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .map((b) => ({
      bidder:   b.bidder_name,
      amount:   String(b.amount),
      usd:      b.usd_value ?? estimateUsd(b.amount),
      time:     timeAgo(b.created_at),
      gradient: b.bidder_gradient ?? "linear-gradient(135deg,#333,#555)",
    }));

  return {
    id:          row.id,
    title:       row.title,
    art: {
      shape: row.art_shape as ArtShape,
      stops: [row.art_stop_1, row.art_stop_2] as [string, string],
    },
    creator: {
      name:     row.creator_name,
      handle:   row.creator_handle,
      verified: row.creator_verified,
      gradient: row.creator_gradient ?? "linear-gradient(135deg,#00f5d4,#f15bb5)",
    },
    price:       String(row.price),
    usd:         row.usd_price ?? estimateUsd(row.price),
    description: row.description ?? "",
    category:    row.category as Category,
    status:      row.status   as Status,
    likes:       row.likes_count,
    isLive:      row.is_live,
    badge:       row.badge    ?? undefined,
    collection:  row.collection_name ?? "Uncategorised",
    image_url:   row.image_url       ?? null,
    tokenId:     row.token_id        ?? "001",
    views:       row.views_count,
    traits:      mappedTraits,
    bids:        mappedBids,
  };
}

/* ── Convert a short mock ID ("1"–"16") to the seeded UUID ─ */
export function mockIdToUUID(id: string): string | null {
  const n = parseInt(id, 10);
  if (isNaN(n) || n < 1 || n > 9999) return null;
  return `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
}

/** True if the string looks like a UUID */
export function isUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
