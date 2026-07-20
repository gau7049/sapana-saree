import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

// { count: "exact", head: true } asks Postgres for a row count without
// transferring any rows — cheap even as the tables grow.
async function fetchDashboardStats() {
  const supabase = createAdminClient();

  const [products, inquiries, reviews, profiles] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .in("status", ["initiated", "sent", "responded", "shipped"]),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalProducts: products.count ?? 0,
    activeInquiries: inquiries.count ?? 0,
    pendingReviews: reviews.count ?? 0,
    totalUsers: profiles.count ?? 0,
  };
}

export const getDashboardStats = unstable_cache(fetchDashboardStats, ["dashboard-stats"], {
  tags: ["dashboard-stats"],
  revalidate: 60,
});
