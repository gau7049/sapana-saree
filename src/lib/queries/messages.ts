import { createClient } from "@/lib/supabase/server";
import type { ContactMessage } from "@/types";

export async function getAdminMessages(): Promise<ContactMessage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
