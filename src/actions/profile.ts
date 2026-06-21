"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: (formData.get("full_name") as string) || null,
      phone: (formData.get("phone") as string) || null,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/account");
  return { success: "Profile updated." };
}
