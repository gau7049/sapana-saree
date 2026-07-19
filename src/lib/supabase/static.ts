import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cookie-free client for use inside unstable_cache()-wrapped functions —
 * Next.js forbids calling cookies() inside a cache scope. Only safe for
 * queries that read data RLS already exposes to anonymous users.
 */
export function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
