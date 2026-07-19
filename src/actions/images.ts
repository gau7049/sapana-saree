"use server";

import { updateTag, revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, images as msg } from "@/lib/messages";
import { requireAdmin } from "@/lib/auth-guard";
import { cleanupImageFile } from "@/lib/cloudinary";

export async function deleteProductImage(imageId: string, publicId: string) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("product_images").delete().eq("id", imageId);

  if (error) return actionError(msg.DELETE_ERROR);

  await cleanupImageFile(publicId);

  // Featured-product cards on the cached homepage embed these images.
  updateTag("featured-products");
  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  revalidatePath("/");
  return actionSuccess(msg.DELETED);
}

export async function updateImageOrder(images: { id: string; sort_order: number }[]) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const results = await Promise.all(
    images.map(({ id, sort_order }) =>
      supabase.from("product_images").update({ sort_order }).eq("id", id)
    )
  );

  if (results.some((r) => r.error)) return actionError(common.SOMETHING_WENT_WRONG);

  updateTag("featured-products");
  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  revalidatePath("/");
  return actionSuccess(msg.ORDER_UPDATED);
}

export async function setPrimaryImage(imageId: string, productId: string) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();

  // Only one image per product may be primary — clear the old one before
  // setting the new one so there's never a moment with two (or zero).
  const { error: unsetError } = await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  if (unsetError) return actionError(common.SOMETHING_WENT_WRONG);

  const { error: setError } = await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  if (setError) return actionError(common.SOMETHING_WENT_WRONG);

  updateTag("featured-products");
  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  revalidatePath("/");
  return actionSuccess(msg.PRIMARY_UPDATED);
}
