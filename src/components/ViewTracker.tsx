"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Invisible component — fires once per NFT per 24 h per browser session.
 * Calls `record_nft_view` RPC which deduplicates server-side and increments
 * views_count only for genuinely new viewers.
 */
export default function ViewTracker({ nftId }: { nftId: string }) {
  useEffect(() => {
    const storageKey = `view_${nftId}`;
    const lastView   = Number(localStorage.getItem(storageKey) ?? 0);

    // Skip if we've already tracked a view for this NFT in the last 24 h
    if (Date.now() - lastView < 86_400_000) return;
    localStorage.setItem(storageKey, String(Date.now()));

    // Stable anonymous viewer ID (persists across sessions)
    let viewerId = localStorage.getItem("ao_viewer_id");
    if (!viewerId) {
      viewerId = crypto.randomUUID();
      localStorage.setItem("ao_viewer_id", viewerId);
    }

    const sb = createClient();
    sb.auth.getSession().then(({ data: { session } }) => {
      // Logged-in users use their user_id; guests use the random viewer ID
      const hash = session?.user?.id ?? viewerId!;
      (sb as any)
        .rpc("record_nft_view", { p_nft_id: nftId, p_viewer_hash: hash })
        .catch(() => {});
    });
  }, [nftId]);

  return null;
}
