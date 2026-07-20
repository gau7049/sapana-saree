"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth-guard";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, users as msg } from "@/lib/messages";
import { ADMIN_ROLES } from "@/lib/constants";

// Only plain customers can be deactivated/deleted from this page — admins
// manage their own access separately, and self-action would lock the
// acting admin out mid-session.
async function guardTarget(adminId: string, targetId: string) {
  if (targetId === adminId) return common.FORBIDDEN;

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", targetId)
    .maybeSingle();

  if (!target) return common.NOT_FOUND;
  if (ADMIN_ROLES.includes(target.role as (typeof ADMIN_ROLES)[number])) {
    return common.FORBIDDEN;
  }
  return null;
}

export async function deactivateUser(id: string) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const guardError = await guardTarget(admin.id, id);
  if (guardError) return actionError(guardError);

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: false }).eq("id", id);
  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return actionSuccess(msg.DEACTIVATED);
}

export async function reactivateUser(id: string) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: true }).eq("id", id);
  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return actionSuccess(msg.ACTIVATED);
}

export async function deleteUserPermanently(id: string) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const guardError = await guardTarget(admin.id, id);
  if (guardError) return actionError(guardError);

  // Service-role only: auth.users deletion cascades to profiles and every
  // row tied to it (inquiries, loyalty_transactions, reviews, ...).
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  revalidatePath("/admin/users");
  return actionSuccess(msg.DELETED);
}
