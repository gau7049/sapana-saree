import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import type { LoyaltyTransaction, ReferralStatus } from "@/types";

const logger = createLogger("queries:loyalty");

export interface CustomerLoyaltySummary {
  userId: string;
  username: string;
  fullName: string | null;
  balance: number;
  earned: number;
  redeemed: number;
}

/** Every customer with their ledger rolled up. Admin-only via RLS. */
export async function getCustomerLoyaltySummaries(): Promise<CustomerLoyaltySummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, loyalty_transactions(points)")
    .order("created_at", { ascending: true });

  if (error) {
    logger.error("getCustomerLoyaltySummaries failed", { error: error.message });
    return [];
  }

  return (data ?? [])
    .filter((profile) => profile.role === "customer")
    .map((profile) => {
      const rows = (profile.loyalty_transactions ?? []) as { points: number }[];
      const earned = rows.filter((r) => r.points > 0).reduce((s, r) => s + r.points, 0);
      const redeemed = rows.filter((r) => r.points < 0).reduce((s, r) => s - r.points, 0);
      return {
        userId: profile.id,
        username: profile.username,
        fullName: profile.full_name,
        balance: earned - redeemed,
        earned,
        redeemed,
      };
    })
    .sort((a, b) => b.balance - a.balance);
}

export type AdminLoyaltyTransaction = LoyaltyTransaction & {
  profiles: { username: string; full_name: string | null } | null;
};

export async function getRecentLoyaltyTransactions(
  limit = 50
): Promise<AdminLoyaltyTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*, profiles(username, full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("getRecentLoyaltyTransactions failed", { error: error.message });
    return [];
  }
  return (data ?? []) as AdminLoyaltyTransaction[];
}

export interface ReferralHistoryRow {
  id: string;
  status: ReferralStatus;
  created_at: string;
  rewarded_at: string | null;
  referrer: { username: string; full_name: string | null } | null;
  referred: { username: string; full_name: string | null } | null;
}

export async function getReferralHistory(): Promise<ReferralHistoryRow[]> {
  const supabase = await createClient();
  // referrals has two FKs to profiles — name them explicitly so PostgREST
  // knows which join is which.
  const { data, error } = await supabase
    .from("referrals")
    .select(
      "id, status, created_at, rewarded_at, referrer:profiles!referrals_referrer_id_fkey(username, full_name), referred:profiles!referrals_referred_id_fkey(username, full_name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("getReferralHistory failed", { error: error.message });
    return [];
  }
  return (data ?? []) as unknown as ReferralHistoryRow[];
}

/** A customer's own recent ledger rows (RLS scopes to their own). */
export async function getUserLoyaltyTransactions(
  userId: string,
  limit = 10
): Promise<LoyaltyTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("getUserLoyaltyTransactions failed", { userId, error: error.message });
    return [];
  }
  return (data ?? []) as LoyaltyTransaction[];
}

export type AdminWhatsAppLog = {
  id: string;
  kind: string;
  message: string;
  status: string;
  created_at: string;
  profiles: { username: string; full_name: string | null } | null;
};

export async function getWhatsAppLogs(limit = 100): Promise<AdminWhatsAppLog[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("whatsapp_logs")
    .select("*, profiles(username, full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logger.error("getWhatsAppLogs failed", { error: error.message });
    return [];
  }
  return (data ?? []) as AdminWhatsAppLog[];
}
