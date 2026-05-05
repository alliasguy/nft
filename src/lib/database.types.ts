/**
 * Supabase database types for NFTX.
 *
 * These are manually maintained until you run the Supabase CLI generator:
 *   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> \
 *     --schema public > src/lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:              string;
          name:            string;
          handle:          string;
          bio:             string | null;
          avatar_url:      string | null;
          wallet_address:  string | null;
          website:         string | null;
          twitter:         string | null;
          role:            "user" | "admin";
          verified:        boolean;
          balance:         number;
          pending_balance: number;
          created_at:      string;
          updated_at:      string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };

      nfts: {
        Row: {
          id:               string;
          title:            string;
          description:      string | null;
          image_url:        string | null;
          art_shape:        string;
          art_stop_1:       string;
          art_stop_2:       string;
          creator_id:       string | null;
          creator_name:     string;
          creator_handle:   string;
          creator_verified: boolean;
          creator_gradient: string | null;
          collection_id:    string | null;
          collection_name:  string | null;
          price:            number;
          usd_price:        string | null;
          token_id:         string | null;
          category:         "Art" | "Music" | "Photography" | "Gaming" | "Virtual Worlds";
          status:           "buy-now" | "auction" | "new";
          likes_count:      number;
          views_count:      number;
          is_live:          boolean;
          badge:            string | null;
          created_at:       string;
        };
        Insert: Omit<Database["public"]["Tables"]["nfts"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["nfts"]["Insert"]>;
      };

      nft_traits: {
        Row: {
          id:            string;
          nft_id:        string;
          label:         string;
          value:         string;
          rarity:        string;
          display_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["nft_traits"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["nft_traits"]["Insert"]>;
      };

      collections: {
        Row: {
          id:           string;
          name:         string;
          description:  string | null;
          creator_id:   string | null;
          floor_price:  number | null;
          total_volume: number;
          created_at:   string;
        };
        Insert: Omit<Database["public"]["Tables"]["collections"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
      };

      bids: {
        Row: {
          id:              string;
          nft_id:          string;
          bidder_id:       string | null;
          bidder_name:     string;
          bidder_gradient: string | null;
          amount:          number;
          usd_value:       string | null;
          created_at:      string;
        };
        Insert: Omit<Database["public"]["Tables"]["bids"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["bids"]["Insert"]>;
      };

      nft_ownership: {
        Row: {
          nft_id:         string;
          owner_id:       string;
          purchase_price: number | null;
          acquired_at:    string;
        };
        Insert: Database["public"]["Tables"]["nft_ownership"]["Row"];
        Update: Partial<Database["public"]["Tables"]["nft_ownership"]["Insert"]>;
      };

      nft_likes: {
        Row: {
          user_id:    string;
          nft_id:     string;
          created_at: string;
        };
        Insert: { user_id: string; nft_id: string };
        Update: never;
      };

      watchlist: {
        Row: {
          user_id:    string;
          nft_id:     string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["watchlist"]["Row"], "created_at">;
        Update: never;
      };

      activity_log: {
        Row: {
          id:         string;
          user_id:    string;
          nft_id:     string | null;
          nft_title:  string | null;
          event_type: "purchase" | "bid" | "sale" | "like" | "list" | "follow" | "mint";
          amount:     number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["activity_log"]["Row"], "id" | "created_at">;
        Update: never;
      };

      platform_settings: {
        Row:    { key: string; value: string; updated_at: string };
        Insert: { key: string; value: string };
        Update: { value?: string };
      };

      deposit_requests: {
        Row: {
          id:           string;
          user_id:      string;
          amount:       number;
          tx_hash:      string | null;
          from_address: string | null;
          status:       "pending" | "approved" | "rejected";
          admin_note:   string | null;
          created_at:   string;
          confirmed_at: string | null;
        };
        Insert: {
          user_id:       string;
          amount:        number;
          tx_hash?:      string | null;
          from_address?: string | null;
        };
        Update: never;
      };

      withdrawal_requests: {
        Row: {
          id:           string;
          user_id:      string;
          amount:       number;
          to_address:   string;
          status:       "pending" | "processing" | "completed" | "rejected";
          admin_note:   string | null;
          created_at:   string;
          processed_at: string | null;
        };
        Insert: {
          user_id:    string;
          amount:     number;
          to_address: string;
        };
        Update: never;
      };

    };

    Views:   Record<string, never>;
    Functions: Record<string, never>;
    Enums:   Record<string, never>;
  };
}

/* ── Convenience row-type aliases ────────────────────────── */
export type Profile            = Database["public"]["Tables"]["profiles"]["Row"];
export type PlatformSetting   = Database["public"]["Tables"]["platform_settings"]["Row"];
export type DepositRequest    = Database["public"]["Tables"]["deposit_requests"]["Row"];
export type WithdrawalRequest = Database["public"]["Tables"]["withdrawal_requests"]["Row"];
// re-export original
export type Profile_orig = Profile;
export type NFTRow      = Database["public"]["Tables"]["nfts"]["Row"];
export type NFTTrait    = Database["public"]["Tables"]["nft_traits"]["Row"];
export type Collection  = Database["public"]["Tables"]["collections"]["Row"];
export type Bid         = Database["public"]["Tables"]["bids"]["Row"];
export type NFTOwnership= Database["public"]["Tables"]["nft_ownership"]["Row"];
export type WatchlistRow= Database["public"]["Tables"]["watchlist"]["Row"];
export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];
