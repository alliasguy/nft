"use client";

import { useState, useEffect } from "react";
import { createClient }        from "@/lib/supabase/client";
import type { Profile }        from "@/lib/database.types";

interface UseProfileReturn {
  profile: Profile | null;
  userId:  string  | null;
  loading: boolean;
  /** Re-fetch from the server (call after a successful profile update) */
  refetch: () => Promise<void>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userId,  setUserId]  = useState<string  | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return { profile, userId, loading, refetch: load };
}
