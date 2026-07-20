import { createClient } from "@/lib/supabase/server";

export async function getAdminInquiries() {
  const supabase = await createClient();
  // loyalty_transactions nested under profiles gives the admin each
  // customer's live point balance right on the inquiry card.
  const { data, error } = await supabase
    .from("inquiries")
    .select(
      "*, profiles(full_name, username, phone, address_line1, address_line2, city, state, country, postal_code, loyalty_transactions(points)), products(title, slug, price, product_images(url, is_primary, sort_order)), product_images(url)"
    )
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getUserInquiries(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*, products(title, slug, price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data ?? [];
}
