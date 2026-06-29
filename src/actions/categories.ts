"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { actionSuccess, actionError } from "@/lib/api/response";
import { categories as msg, common } from "@/lib/messages";
import { requireAdmin } from "@/lib/auth-guard";
import { createLogger } from "@/lib/logger";

const logger = createLogger("actions:categories");

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function createCategory(formData: FormData) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();
  const name = formData.get("name") as string;

  const isActiveField = formData.get("is_active");
  const isActive = isActiveField === null ? true : isActiveField === "true";

  const { error } = await supabase.from("categories").insert({
    name,
    slug: generateSlug(name) + "-" + Date.now().toString(36),
    description: (formData.get("description") as string) || null,
    parent_id: (formData.get("parent_id") as string) || null,
    is_active: isActive,
  });

  if (error) {
    logger.error("Category operation failed", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidateTag("categories", { expire: 0 });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return actionSuccess(msg.CREATED);
}

export async function updateCategory(id: string, formData: FormData) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      parent_id: (formData.get("parent_id") as string) || null,
      is_active: formData.get("is_active") === "true",
    })
    .eq("id", id);

  if (error) {
    logger.error("Category operation failed", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidateTag("categories", { expire: 0 });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return actionSuccess(msg.UPDATED);
}

export async function deleteCategory(id: string) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    logger.error("Category operation failed", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidateTag("categories", { expire: 0 });
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return actionSuccess(msg.DELETED);
}
