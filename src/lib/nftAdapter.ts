import type { NFTRow } from "@/lib/database.types";

/**
 * Converts a Supabase NFTRow (database shape) into the props
 * expected by the NFTCard component.
 * When image_url is set (file-uploaded NFT), it takes priority over the gradient.
 */
export function rowToCard(nft: NFTRow) {
  return {
    href:     `/nft/${nft.id}`,
    title:    nft.title,
    creator:  { name: nft.creator_name },
    price:    String(nft.price),
    likes:    nft.likes_count,
    isLive:   nft.is_live,
    badge:    nft.badge    ?? undefined,
    image:    nft.image_url ?? undefined,   // real uploaded file (image or audio thumbnail)
    gradient: `linear-gradient(135deg, ${nft.art_stop_1} 0%, ${nft.art_stop_2} 100%)`,
  };
}
