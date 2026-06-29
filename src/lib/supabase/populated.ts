import { isSupabaseConfigured } from "./helpers";

let supabaseHasData: boolean | null = null;
let lastCheck = 0;
const CHECK_INTERVAL_MS = 60_000;

export async function isSupabasePopulated(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const now = Date.now();
  if (supabaseHasData !== null && now - lastCheck < CHECK_INTERVAL_MS) {
    return supabaseHasData;
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const { count } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true });

    supabaseHasData = (count ?? 0) > 0;
    lastCheck = now;
    return supabaseHasData;
  } catch {
    supabaseHasData = false;
    lastCheck = now;
    return false;
  }
}

export function resetSupabaseCheck() {
  supabaseHasData = null;
  lastCheck = 0;
}
