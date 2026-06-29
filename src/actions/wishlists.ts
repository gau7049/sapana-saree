"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { actionSuccess, actionError } from "@/lib/api/response";
import { wishlists as msg, common } from "@/lib/messages";

export async function addToWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return actionError(common.NOT_AUTHENTICATED);

  const { error } = await supabase.from("wishlists").insert({
    user_id: user.id,
    product_id: productId,
  });

  if (error) {
    if (error.code === "23505") return actionError(msg.ALREADY_EXISTS);
    return actionError(error.message);
  }

  revalidatePath("/wishlist");
  return actionSuccess(msg.ADDED);
}

export async function removeFromWishlist(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return actionError(common.NOT_AUTHENTICATED);

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return actionError(error.message);

  revalidatePath("/wishlist");
  return actionSuccess(msg.REMOVED);
}
