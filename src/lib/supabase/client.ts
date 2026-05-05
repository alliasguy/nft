import { createBrowserClient } from "@supabase/ssr";
import type { Database }        from "@/lib/database.types";

/**
 * Singleton browser Supabase client.
 *
 * A module-level singleton is critical: multiple instances each have their own
 * internal auth-refresh lock manager.  When the middleware server-side client
 * and several browser-side client instances all try to refresh the session
 * simultaneously, one request acquires the Web Lock with `steal:true`,
 * aborting the others → "Lock broken by another request with the 'steal' option".
 *
 * With a single shared instance the lock is shared too, so only one refresh
 * ever runs at a time.
 */
let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (!_client) {
    _client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return _client;
}
