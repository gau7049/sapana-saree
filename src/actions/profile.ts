"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { actionSuccess, actionError } from "@/lib/api/response";
import { profile as msg, common } from "@/lib/messages";

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return actionError(common.NOT_AUTHENTICATED);

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: (formData.get("full_name") as string) || null,
      phone: (formData.get("phone") as string) || null,
    })
    .eq("id", user.id);

  if (error) return actionError(error.message);

  revalidatePath("/account");
  return actionSuccess(msg.UPDATED);
}
