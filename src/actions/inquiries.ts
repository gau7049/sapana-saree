"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { InquiryStatus } from "@/types";
import { actionSuccess, actionError } from "@/lib/api/response";
import { inquiries as msg, common } from "@/lib/messages";
import { requireAdmin } from "@/lib/auth-guard";
import { createLogger } from "@/lib/logger";

const logger = createLogger("actions:inquiries");

export async function updateInquiryStatus(id: string, status: InquiryStatus, notes?: string) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const updateData: Record<string, string> = { status };
  if (notes !== undefined) updateData.notes = notes;

  const { error } = await supabase
    .from("inquiries")
    .update(updateData)
    .eq("id", id);

  if (error) {
    logger.error("Inquiry update failed", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidatePath("/admin/inquiries");
  return actionSuccess(msg.UPDATED);
}
