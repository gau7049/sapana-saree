import { createClient } from "@/lib/supabase/server";
import type { ProductWithImages } from "@/types";

export async function getWishlist(userId: string): Promise<ProductWithImages[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlists")
    .select("product:products(*, product_images(*), categories(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];

  return (data ?? [])
    .map((row) => row.product)
    .filter(Boolean) as unknown as ProductWithImages[];
}

export async function isProductWishlisted(
  userId: string,
  productId: string
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  return !!data;
}
