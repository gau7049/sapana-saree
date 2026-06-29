"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { actionSuccess, actionError } from "@/lib/api/response";
import { reviews as msg, common } from "@/lib/messages";
import { requireAdmin } from "@/lib/auth-guard";
import { createLogger } from "@/lib/logger";

const logger = createLogger("actions:reviews");

export async function moderateReview(
  id: string,
  status: "approved" | "rejected",
  adminResponse?: string
) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const updateData: Record<string, string> = { status };
  if (adminResponse) updateData.admin_response = adminResponse;

  const { error } = await supabase
    .from("reviews")
    .update(updateData)
    .eq("id", id);

  if (error) {
    logger.error("Review operation failed", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidateTag("dashboard-stats", { expire: 0 });
  revalidatePath("/admin/reviews");
  revalidatePath("/sarees");
  return actionSuccess(msg.MODERATED(status));
}

export async function deleteReview(id: string) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) {
    logger.error("Review operation failed", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidateTag("dashboard-stats", { expire: 0 });
  revalidatePath("/admin/reviews");
  revalidatePath("/sarees");
  return actionSuccess(msg.DELETED);
}
