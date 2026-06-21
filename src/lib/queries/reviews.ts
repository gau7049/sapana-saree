import { createClient } from "@/lib/supabase/server";
import type { ReviewWithProfile } from "@/types";

export async function getProductReviews(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reviews")
    .select(`*, profiles(full_name, avatar_url)`)
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return data as ReviewWithProfile[];
}
