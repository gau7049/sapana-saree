import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats() {
  const supabase = await createClient();

  const [products, inquiries, pendingReviews, users] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalProducts: products.count ?? 0,
    activeInquiries: inquiries.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    totalUsers: users.count ?? 0,
  };
}
