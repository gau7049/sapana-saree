import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { getLocalUser } from "@/actions/auth";
import { ADMIN_ROLES } from "@/lib/constants";

export async function requireAdmin(): Promise<void> {
  if (!isSupabaseConfigured()) {
    const localUser = await getLocalUser();
    if (!localUser || localUser.role !== "admin") {
      throw new Error("Unauthorized");
    }
    return;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !ADMIN_ROLES.includes(profile.role as typeof ADMIN_ROLES[number])) {
    throw new Error("Unauthorized");
  }
}
