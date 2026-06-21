"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InquiryStatus } from "@/types";

export async function updateInquiryStatus(id: string, status: InquiryStatus, notes?: string) {
  const supabase = await createClient();

  const updateData: Record<string, string> = { status };
  if (notes !== undefined) updateData.notes = notes;

  const { error } = await supabase
    .from("inquiries")
    .update(updateData)
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/inquiries");
  return { success: "Inquiry updated." };
}
