import type { ReviewWithProfile } from "@/types";
import { MOCK_REVIEWS } from "@/lib/mock-data";
import { isSupabasePopulated } from "@/lib/supabase/populated";
import { REVIEWS_PER_PAGE } from "@/lib/constants";

export async function getProductReviews(
  productId: string,
  page = 1,
  perPage = REVIEWS_PER_PAGE
): Promise<{ reviews: ReviewWithProfile[]; total: number }> {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;

      const { data, count } = await supabase
        .from("reviews")
        .select("*, profiles(full_name, avatar_url)", { count: "exact" })
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (data && data.length > 0) {
        return {
          reviews: data as ReviewWithProfile[],
          total: count ?? data.length,
        };
      }
    } catch {}
  }

  const mockFiltered = MOCK_REVIEWS.filter(
    (r) => r.product_id === productId && r.status === "approved"
  ) as ReviewWithProfile[];

  const from = (page - 1) * perPage;
  const paginated = mockFiltered.slice(from, from + perPage);

  return { reviews: paginated, total: mockFiltered.length };
}
