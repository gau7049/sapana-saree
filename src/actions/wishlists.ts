"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addToWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("wishlists").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already in wishlist" };
    return { error: error.message };
  }

  revalidatePath("/wishlist");
  return { success: true };
}

export async function removeFromWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return { error: error.message };

  revalidatePath("/wishlist");
  return { success: true };
}
