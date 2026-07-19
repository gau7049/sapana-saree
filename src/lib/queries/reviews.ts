import { createClient } from "@/lib/supabase/server";
import type { Review, ReviewWithProfile } from "@/types";
import { REVIEWS_PER_PAGE } from "@/lib/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("queries:reviews");

export async function getProductReviews(
  productId: string,
  page = 1,
  perPage = REVIEWS_PER_PAGE
): Promise<{ reviews: ReviewWithProfile[]; total: number }> {
  const supabase = await createClient();
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  const { data, count, error } = await supabase
    .from("reviews")
    .select("*, profiles(full_name, avatar_url)", { count: "exact" })
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    logger.error("getProductReviews failed", { productId, error: error.message });
    return { reviews: [], total: 0 };
  }

  return {
    reviews: (data ?? []) as unknown as ReviewWithProfile[],
    total: count ?? 0,
  };
}

export async function getUserReviews(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, products(title, slug)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("getUserReviews failed", { userId, error: error.message });
    return [];
  }
  return data ?? [];
}

/** The signed-in user's own review of a product, regardless of moderation status. */
export async function getUserReviewForProduct(
  userId: string,
  productId: string
): Promise<Review | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (error) {
    logger.error("getUserReviewForProduct failed", { userId, productId, error: error.message });
    return null;
  }
  return (data as Review) ?? null;
}

export async function getAdminReviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("*, profiles(full_name, username), products(title, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("getAdminReviews failed", { error: error.message });
    return [];
  }
  return data ?? [];
}
