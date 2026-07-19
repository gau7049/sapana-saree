"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, wishlists as msg } from "@/lib/messages";
import { requireAuth } from "@/lib/auth-guard";

export async function addToWishlist(productId: string) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("wishlists")
    .insert({ user_id: user.id, product_id: productId });

  if (error) {
    if (error.code === "23505") return actionSuccess(msg.ALREADY_EXISTS);
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  revalidatePath("/wishlist");
  return actionSuccess(msg.ADDED);
}

export async function removeFromWishlist(productId: string) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", productId);

  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  revalidatePath("/wishlist");
  return actionSuccess(msg.REMOVED);
}
