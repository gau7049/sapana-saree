"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { actionSuccess, actionError } from "@/lib/api/response";
import { images as msg } from "@/lib/messages";
import { createLogger } from "@/lib/logger";

const logger = createLogger("actions:images");

export async function deleteProductImage(imageId: string, publicId: string) {
  if (!isSupabaseConfigured()) {
    const { readLocalImages, saveLocalImages } = await import("@/lib/local-storage");
    const images = await readLocalImages();
    const image = images.find((img) => img.id === imageId);

    if (image && image.url.startsWith("/uploads/")) {
      const { unlink } = await import("fs/promises");
      const { join } = await import("path");
      try {
        await unlink(join(process.cwd(), "public", image.url));
      } catch {}
    }

    const updated = images.filter((img) => img.id !== imageId);
    await saveLocalImages(updated);

    revalidatePath("/admin/products");
    revalidatePath("/sarees");
    return actionSuccess(msg.DELETED);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const timestamp = Math.floor(Date.now() / 1000);
    const { createHash } = await import("crypto");
    const signature = createHash("sha1")
      .update(`public_id=${publicId}&timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
      .digest("hex");

    await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/destroy`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          public_id: publicId,
          api_key: process.env.CLOUDINARY_API_KEY,
          timestamp,
          signature,
        }),
      }
    ).catch(() => {});
  }

  const { error } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId);

  if (error) {
    logger.error("Failed to delete image", { error: error.message });
    return actionError(msg.DELETE_ERROR);
  }

  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  return actionSuccess(msg.DELETED);
}

export async function updateImageOrder(images: { id: string; sort_order: number }[]) {
  if (!isSupabaseConfigured()) {
    const { readLocalImages, saveLocalImages } = await import("@/lib/local-storage");
    const allImages = await readLocalImages();

    for (const update of images) {
      const img = allImages.find((i) => i.id === update.id);
      if (img) img.sort_order = update.sort_order;
    }

    await saveLocalImages(allImages);
    revalidatePath("/admin/products");
    return actionSuccess(msg.ORDER_UPDATED);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  await Promise.all(
    images.map((img) =>
      supabase
        .from("product_images")
        .update({ sort_order: img.sort_order })
        .eq("id", img.id)
    )
  );

  revalidatePath("/admin/products");
  return actionSuccess(msg.ORDER_UPDATED);
}

export async function setPrimaryImage(imageId: string, productId: string) {
  if (!isSupabaseConfigured()) {
    const { readLocalImages, saveLocalImages } = await import("@/lib/local-storage");
    const images = await readLocalImages();

    for (const img of images) {
      if (img.product_id === productId) {
        img.is_primary = img.id === imageId;
      }
    }

    await saveLocalImages(images);
    revalidatePath("/admin/products");
    revalidatePath("/sarees");
    return actionSuccess(msg.PRIMARY_UPDATED);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);
  await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  return actionSuccess(msg.PRIMARY_UPDATED);
}
