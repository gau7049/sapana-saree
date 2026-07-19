"use server";

import { updateTag, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, categories as msg } from "@/lib/messages";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify } from "@/lib/utils";

export async function createCategory(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const parentId = (formData.get("parent_id") as string) || null;

  if (!name?.trim()) return actionError(common.MISSING_REQUIRED_FIELDS);

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug: slugify(name),
    description,
    parent_id: parentId,
  });

  if (error) {
    return actionError(
      error.code === "23505" ? "A category with this name already exists." : msg.CREATE_ERROR
    );
  }

  updateTag("categories");
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return actionSuccess(msg.CREATED);
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const parentId = (formData.get("parent_id") as string) || null;
  const isActive = formData.get("is_active") === "true";

  if (!name?.trim()) return actionError(common.MISSING_REQUIRED_FIELDS);

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({
      name,
      slug: slugify(name),
      description,
      parent_id: parentId,
      is_active: isActive,
    })
    .eq("id", id);

  if (error) {
    return actionError(
      error.code === "23505" ? "A category with this name already exists." : msg.CREATE_ERROR
    );
  }

  updateTag("categories");
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return actionSuccess(msg.UPDATED);
}

export async function deleteCategory(id: string) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) return actionError(msg.NOT_FOUND);

  updateTag("categories");
  revalidatePath("/admin/categories");
  revalidatePath("/categories");
  return actionSuccess(msg.DELETED);
}
