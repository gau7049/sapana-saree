"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { actionSuccess, actionError } from "@/lib/api/response";
import { products as msg, common } from "@/lib/messages";
import { resetSupabaseCheck } from "@/lib/supabase/populated";
import { requireAdmin } from "@/lib/auth-guard";
import { createLogger } from "@/lib/logger";

const logger = createLogger("actions:products");

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export async function createProduct(formData: FormData) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const title = formData.get("title") as string;
  const slug = generateSlug(title) + "-" + Date.now().toString(36);

  const { data, error } = await supabase
    .from("products")
    .insert({
      title,
      slug,
      description: (formData.get("description") as string) || null,
      short_description: (formData.get("short_description") as string) || null,
      price: Number(formData.get("price")),
      compare_at_price: formData.get("compare_at_price")
        ? Number(formData.get("compare_at_price"))
        : null,
      category_id: (formData.get("category_id") as string) || null,
      status: (formData.get("status") as string) || "draft",
      is_featured: formData.get("is_featured") === "true",
      material: (formData.get("material") as string) || null,
      color: (formData.get("color") as string) || null,
      occasion: (formData.get("occasion") as string) || null,
      work_type: (formData.get("work_type") as string) || null,
      meta_title: (formData.get("meta_title") as string) || null,
      meta_description: (formData.get("meta_description") as string) || null,
    })
    .select("id")
    .single();

  if (error) {
    logger.error("Failed to create product", { error: error.message });
    return actionError(msg.CREATE_ERROR);
  }

  resetSupabaseCheck();
  revalidateTag("featured-products", { expire: 0 });
  revalidateTag("product-filters", { expire: 0 });
  revalidateTag("dashboard-stats", { expire: 0 });
  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  redirect(`/admin/products/${data.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const { error } = await supabase
    .from("products")
    .update({
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      short_description: (formData.get("short_description") as string) || null,
      price: Number(formData.get("price")),
      compare_at_price: formData.get("compare_at_price")
        ? Number(formData.get("compare_at_price"))
        : null,
      category_id: (formData.get("category_id") as string) || null,
      status: (formData.get("status") as string) || "draft",
      is_featured: formData.get("is_featured") === "true",
      material: (formData.get("material") as string) || null,
      color: (formData.get("color") as string) || null,
      occasion: (formData.get("occasion") as string) || null,
      work_type: (formData.get("work_type") as string) || null,
      meta_title: (formData.get("meta_title") as string) || null,
      meta_description: (formData.get("meta_description") as string) || null,
    })
    .eq("id", id);

  if (error) {
    logger.error("Failed to update product", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidateTag("featured-products", { expire: 0 });
  revalidateTag("product-filters", { expire: 0 });
  revalidateTag("dashboard-stats", { expire: 0 });
  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  return actionSuccess(msg.UPDATED);
}

export async function deleteProduct(id: string) {
  try { await requireAdmin(); } catch { return actionError(common.FORBIDDEN); }
  const supabase = await createClient();

  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    logger.error("Failed to delete product", { error: error.message });
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidateTag("featured-products", { expire: 0 });
  revalidateTag("product-filters", { expire: 0 });
  revalidateTag("dashboard-stats", { expire: 0 });
  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  return actionSuccess(msg.DELETED);
}
