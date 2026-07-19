"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common } from "@/lib/messages";
import { requireAdmin } from "@/lib/auth-guard";

const SETTINGS_FIELDS = [
  "welcome_points",
  "review_points",
  "review_min_rating",
  "referral_points",
  "orders_milestone_count",
  "orders_milestone_points",
  "point_value_inr",
] as const;

export async function updateLoyaltySettings(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const updates: Record<string, number> = {};
  for (const field of SETTINGS_FIELDS) {
    const raw = formData.get(field);
    if (raw === null) continue;
    const value = Number(raw);
    if (Number.isNaN(value) || value < 0) {
      return actionError(common.MISSING_REQUIRED_FIELDS);
    }
    updates[field] = value;
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("loyalty_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", 1);

  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  revalidatePath("/admin/loyalty");
  return actionSuccess("Loyalty settings updated.");
}
