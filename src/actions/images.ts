"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteProductImage(imageId: string, publicId: string) {
  const supabase = await createClient();

  // Delete from Cloudinary
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

  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  return { success: "Image deleted." };
}

export async function updateImageOrder(images: { id: string; sort_order: number }[]) {
  const supabase = await createClient();

  for (const img of images) {
    await supabase
      .from("product_images")
      .update({ sort_order: img.sort_order })
      .eq("id", img.id);
  }

  revalidatePath("/admin/products");
  return { success: "Image order updated." };
}

export async function setPrimaryImage(imageId: string, productId: string) {
  const supabase = await createClient();

  // Unset all primary images for this product
  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  // Set the new primary
  await supabase
    .from("product_images")
    .update({ is_primary: true })
    .eq("id", imageId);

  revalidatePath("/admin/products");
  revalidatePath("/sarees");
  return { success: "Primary image updated." };
}
