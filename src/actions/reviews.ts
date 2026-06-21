"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function moderateReview(
  id: string,
  status: "approved" | "rejected",
  adminResponse?: string
) {
  const supabase = await createClient();

  const updateData: Record<string, string> = { status };
  if (adminResponse) updateData.admin_response = adminResponse;

  const { error } = await supabase
    .from("reviews")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/sarees");
  return { success: `Review ${status}.` };
}

export async function deleteReview(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/sarees");
  return { success: "Review deleted." };
}
