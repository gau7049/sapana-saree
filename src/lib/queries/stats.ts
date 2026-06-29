import { unstable_cache } from "next/cache";
import { isSupabasePopulated } from "@/lib/supabase/populated";
import { MOCK_PRODUCTS, MOCK_REVIEWS } from "@/lib/mock-data";

async function fetchDashboardStats() {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();

      const [products, inquiries, pendingReviews, users] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("inquiries")
          .select("id", { count: "exact", head: true })
          .eq("status", "sent"),
        supabase
          .from("reviews")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),
      ]);

      return {
        totalProducts: products.count ?? 0,
        activeInquiries: inquiries.count ?? 0,
        pendingReviews: pendingReviews.count ?? 0,
        totalUsers: users.count ?? 0,
      };
    } catch {}
  }

  return {
    totalProducts: MOCK_PRODUCTS.length,
    activeInquiries: 0,
    pendingReviews: MOCK_REVIEWS.filter((r) => r.status === "pending").length,
    totalUsers: 0,
  };
}

export const getDashboardStats = unstable_cache(
  fetchDashboardStats,
  ["dashboard-stats"],
  { tags: ["dashboard-stats"], revalidate: 60 }
);
