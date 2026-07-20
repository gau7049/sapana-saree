import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import { getUserLoyaltyTransactions } from "@/lib/queries/loyalty";
import { USERS_PER_PAGE } from "@/lib/constants";
import type { Profile, LoyaltyTransaction, InquiryStatus } from "@/types";

const logger = createLogger("queries:users");

export interface AdminUserRow {
  id: string;
  username: string;
  fullName: string | null;
  phone: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  pointsBalance: number;
  orderCount: number;
}

export interface AdminUsersResult {
  users: AdminUserRow[];
  total: number;
  totalPages: number;
}

export async function getAdminUsers({
  search,
  page = 1,
}: {
  search?: string;
  page?: number;
}): Promise<AdminUsersResult> {
  const supabase = await createClient();
  const from = (page - 1) * USERS_PER_PAGE;
  const to = from + USERS_PER_PAGE - 1;

  let query = supabase
    .from("profiles")
    .select(
      "id, username, full_name, phone, city, is_active, created_at, loyalty_transactions(points), inquiries(id)",
      { count: "exact" }
    )
    .eq("role", "customer");

  if (search?.trim()) {
    const term = search.trim().replace(/[%_]/g, "");
    query = query.or(
      `username.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`
    );
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    logger.error("getAdminUsers failed", { error: error.message });
    return { users: [], total: 0, totalPages: 0 };
  }

  const users: AdminUserRow[] = (data ?? []).map((row) => {
    const points = (row.loyalty_transactions ?? []) as { points: number }[];
    return {
      id: row.id,
      username: row.username,
      fullName: row.full_name,
      phone: row.phone,
      city: row.city,
      isActive: row.is_active,
      createdAt: row.created_at,
      pointsBalance: points.reduce((sum, tx) => sum + tx.points, 0),
      orderCount: (row.inquiries ?? []).length,
    };
  });

  const total = count ?? 0;
  return { users, total, totalPages: Math.max(1, Math.ceil(total / USERS_PER_PAGE)) };
}

export interface AdminUserOrder {
  id: string;
  status: InquiryStatus;
  paymentMethod: string | null;
  createdAt: string;
  product: { title: string; slug: string; price: number } | null;
}

export interface AdminUserDetail {
  profile: Profile;
  transactions: LoyaltyTransaction[];
  pointsBalance: number;
  orders: AdminUserOrder[];
  referredByUsername: string | null;
  referralCount: number;
}

export async function getAdminUserDetail(id: string): Promise<AdminUserDetail | null> {
  const supabase = await createClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (profileError || !profile) {
    if (profileError) logger.error("getAdminUserDetail profile failed", { id, error: profileError.message });
    return null;
  }

  const [transactions, ordersResult, referredByResult, referralCountResult] = await Promise.all([
    getUserLoyaltyTransactions(id, 50),
    supabase
      .from("inquiries")
      .select("id, status, payment_method, created_at, products(title, slug, price)")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
    profile.referred_by
      ? supabase.from("profiles").select("username").eq("id", profile.referred_by).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", id),
  ]);

  const orders: AdminUserOrder[] = (ordersResult.data ?? []).map((row) => ({
    id: row.id,
    status: row.status as InquiryStatus,
    paymentMethod: row.payment_method,
    createdAt: row.created_at,
    product: (row.products as unknown as AdminUserOrder["product"]) ?? null,
  }));

  const pointsBalance = transactions.reduce((sum, tx) => sum + tx.points, 0);

  return {
    profile: profile as Profile,
    transactions,
    pointsBalance,
    orders,
    referredByUsername: referredByResult.data?.username ?? null,
    referralCount: referralCountResult.count ?? 0,
  };
}
