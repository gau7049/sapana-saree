"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { updateTag, revalidatePath } from "next/cache";
import { sendNewProductAnnouncement } from "@/lib/product-notifications";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, products as msg } from "@/lib/messages";
import { requireAdmin } from "@/lib/auth-guard";
import { slugify } from "@/lib/utils";
import { cleanupImageFile } from "@/lib/cloudinary";
import type { ProductStatus } from "@/types";

function parseProductFormData(formData: FormData) {
  const title = (formData.get("title") as string) ?? "";
  const price = Number(formData.get("price"));
  const compareAtRaw = formData.get("compare_at_price") as string;
  const slugRaw = (formData.get("slug") as string) ?? "";

  return {
    title,
    slug: slugify(slugRaw || title),
    short_description: (formData.get("short_description") as string) || null,
    description: (formData.get("description") as string) || null,
    price,
    compare_at_price: compareAtRaw ? Number(compareAtRaw) : null,
    category_id: (formData.get("category_id") as string) || null,
    status: (formData.get("status") as ProductStatus) || "draft",
    is_featured: formData.get("is_featured") === "true",
    is_available: formData.get("is_available") === "true",
    material: (formData.get("material") as string) || null,
    color: (formData.get("color") as string) || null,
    occasion: (formData.get("occasion") as string) || null,
    work_type: (formData.get("work_type") as string) || null,
    meta_title: (formData.get("meta_title") as string) || null,
    meta_description: (formData.get("meta_description") as string) || null,
  };
}

function validateProductValues(values: ReturnType<typeof parseProductFormData>) {
  if (!values.title.trim() || !values.slug || Number.isNaN(values.price)) {
    return common.MISSING_REQUIRED_FIELDS;
  }
  if (values.compare_at_price !== null && values.compare_at_price <= values.price) {
    return msg.INVALID_COMPARE_AT_PRICE;
  }
  return null;
}

function revalidateProductCaches(slug?: string) {
  updateTag("featured-products");
  updateTag("product-filters");
  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  revalidatePath("/");
  if (slug) revalidatePath(`/sarees/${slug}`);
}

export async function createProduct(formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const values = parseProductFormData(formData);
  const validationError = validateProductValues(values);
  if (validationError) return actionError(validationError);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(values)
    .select("id")
    .single();

  if (error) {
    return actionError(
      error.code === "23505" ? msg.SLUG_TAKEN : msg.CREATE_ERROR
    );
  }

  revalidateProductCaches(values.slug);

  // Announce to registered customers after the response is sent; the
  // notified_at guard inside makes this once-per-product no matter how often
  // the product is edited later.
  if (values.status === "published") {
    after(() => sendNewProductAnnouncement(data.id));
  }

  redirect(`/admin/products/${data.id}/edit`);
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const values = parseProductFormData(formData);
  const validationError = validateProductValues(values);
  if (validationError) return actionError(validationError);

  const supabase = await createClient();
  const { error } = await supabase.from("products").update(values).eq("id", id);

  if (error) {
    return actionError(
      error.code === "23505" ? msg.SLUG_TAKEN : msg.CREATE_ERROR
    );
  }

  revalidateProductCaches(values.slug);

  // Covers the draft-first workflow: the announcement goes out when the
  // product FIRST becomes published (notified_at guard prevents repeats).
  if (values.status === "published") {
    after(() => sendNewProductAnnouncement(id));
  }

  return actionSuccess(msg.UPDATED);
}

export async function archiveProduct(id: string) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ status: "archived" satisfies ProductStatus })
    .eq("id", id)
    .select("slug")
    .maybeSingle();

  if (error) return actionError(msg.NOT_FOUND);

  revalidateProductCaches(data?.slug);
  return actionSuccess(msg.ARCHIVED);
}

// Shared by single and bulk delete: removes the DB row plus its Cloudinary
// images, returning the slug (or null if the product didn't exist) so the
// caller knows which ISR-cached page to revalidate.
async function deleteProductById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string
): Promise<string | null> {
  const [{ data: images }, { data: product }] = await Promise.all([
    supabase.from("product_images").select("public_id").eq("product_id", id),
    supabase.from("products").select("slug").eq("id", id).maybeSingle(),
  ]);

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return null;

  if (images?.length) {
    await Promise.allSettled(images.map((img) => cleanupImageFile(img.public_id)));
  }
  return product?.slug ?? null;
}

export async function deleteProduct(id: string) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const slug = await deleteProductById(supabase, id);
  if (!slug) return actionError(msg.NOT_FOUND);

  // Revalidating the deleted slug ensures its ISR page 404s immediately
  // instead of serving the stale cached product for up to an hour.
  revalidateProductCaches(slug);
  return actionSuccess(msg.DELETED);
}

export async function bulkUpdateStatus(ids: string[], status: ProductStatus) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  if (!ids.length) return actionError(common.MISSING_REQUIRED_FIELDS);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update({ status })
    .in("id", ids)
    .select("slug");

  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  revalidateProductCaches();
  for (const row of data ?? []) revalidatePath(`/sarees/${row.slug}`);
  return actionSuccess(msg.BULK_UPDATED(ids.length));
}

export async function bulkDeleteProducts(ids: string[]) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  if (!ids.length) return actionError(common.MISSING_REQUIRED_FIELDS);

  const supabase = await createClient();
  const results = await Promise.all(ids.map((id) => deleteProductById(supabase, id)));
  const deletedSlugs = results.filter((slug): slug is string => Boolean(slug));

  revalidateProductCaches();
  for (const slug of deletedSlugs) revalidatePath(`/sarees/${slug}`);

  if (deletedSlugs.length === 0) return actionError(msg.NOT_FOUND);
  return actionSuccess(msg.BULK_DELETED(deletedSlugs.length));
}
