import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { createLogger } from "@/lib/logger";
import type { LoyaltySettings, LoyaltyTransactionType } from "@/types";

const logger = createLogger("loyalty");

/**
 * All loyalty earning/revoking goes through this module using the service-role
 * client — RLS allows customers to READ their own ledger but never write it,
 * so point rules can't be forged from the browser.
 *
 * The ledger is append-only: balance == SUM(points). Every rule that awards
 * points is idempotent (guarded by an existence check or a guard table) so
 * retries and double-submits can't double-award.
 */

const DEFAULT_SETTINGS: Omit<LoyaltySettings, "id" | "updated_at"> = {
  welcome_points: 10,
  review_points: 2,
  review_min_rating: 3,
  referral_points: 5,
  orders_milestone_count: 3,
  orders_milestone_points: 25,
  point_value_inr: 1,
};

export async function getLoyaltySettings(): Promise<
  Omit<LoyaltySettings, "id" | "updated_at">
> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("loyalty_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...data, point_value_inr: Number(data.point_value_inr) };
}

/** Balance for one user (uses the caller's own session — RLS-safe). */
export async function getLoyaltyBalance(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loyalty_transactions")
    .select("points")
    .eq("user_id", userId);
  if (error) {
    logger.error("getLoyaltyBalance failed", { userId, error: error.message });
    return 0;
  }
  return (data ?? []).reduce((sum, row) => sum + row.points, 0);
}

async function adminBalance(userId: string): Promise<number> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("loyalty_transactions")
    .select("points")
    .eq("user_id", userId);
  return (data ?? []).reduce((sum, row) => sum + row.points, 0);
}

interface AddTransactionInput {
  userId: string;
  points: number;
  type: LoyaltyTransactionType;
  referenceId?: string | null;
  note?: string;
}

async function addTransaction(input: AddTransactionInput): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.from("loyalty_transactions").insert({
    user_id: input.userId,
    points: input.points,
    type: input.type,
    reference_id: input.referenceId ?? null,
    note: input.note ?? null,
  });
  if (error) {
    logger.error("loyalty transaction insert failed", {
      type: input.type,
      userId: input.userId,
      error: error.message,
    });
    return false;
  }
  return true;
}

/** 10 welcome points, once per account ever. */
export async function awardWelcomePoints(userId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("loyalty_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "welcome")
    .limit(1);
  if (existing?.length) return;

  const settings = await getLoyaltySettings();
  if (settings.welcome_points <= 0) return;
  await addTransaction({
    userId,
    points: settings.welcome_points,
    type: "welcome",
    note: "Welcome bonus for joining Sapana Saree",
  });
}

/**
 * Review points on APPROVAL (moderation is the abuse gate), rating >= minimum.
 * The review_rewards guard row is keyed (user, product), so deleting and
 * re-posting a review for the same product can never earn twice — the reward
 * is only re-armed if the previous one was explicitly revoked.
 */
export async function awardReviewPoints(
  userId: string,
  productId: string,
  rating: number,
  reviewId: string
): Promise<void> {
  const settings = await getLoyaltySettings();
  if (rating < settings.review_min_rating || settings.review_points <= 0) return;

  const admin = createAdminClient();
  const { data: guard } = await admin
    .from("review_rewards")
    .select("revoked")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (guard && !guard.revoked) return; // already rewarded for this product

  const awarded = await addTransaction({
    userId,
    points: settings.review_points,
    type: "review",
    referenceId: reviewId,
    note: "Approved product review",
  });
  if (!awarded) return;

  await admin.from("review_rewards").upsert({
    user_id: userId,
    product_id: productId,
    revoked: false,
  });
}

/**
 * Take review points back (review deleted or un-approved). Returns false when
 * the user has already SPENT those points (balance too low) and `enforce` is
 * on — the caller should then refuse the deletion.
 */
export async function revokeReviewPoints(
  userId: string,
  productId: string,
  reviewId: string,
  options: { enforceBalance: boolean }
): Promise<{ ok: boolean; reason?: "points_spent" }> {
  const admin = createAdminClient();
  const { data: guard } = await admin
    .from("review_rewards")
    .select("revoked")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (!guard || guard.revoked) return { ok: true }; // nothing to revoke

  const settings = await getLoyaltySettings();

  if (options.enforceBalance) {
    const balance = await adminBalance(userId);
    if (balance < settings.review_points) {
      return { ok: false, reason: "points_spent" };
    }
  }

  await addTransaction({
    userId,
    points: -settings.review_points,
    type: "review_revoked",
    referenceId: reviewId,
    note: "Review removed",
  });
  await admin
    .from("review_rewards")
    .update({ revoked: true })
    .eq("user_id", userId)
    .eq("product_id", productId);
  return { ok: true };
}

/**
 * Called when an inquiry reaches "delivered". Handles BOTH delivered-order
 * rules in one place:
 *  - referral reward: referred customer's FIRST delivered order pays the
 *    referrer once (referrals.status flips pending -> rewarded).
 *  - milestone: every Nth delivered order pays the customer the milestone
 *    bonus; idempotent because awards are counted against delivered totals.
 */
export async function processDeliveredOrder(
  customerId: string,
  inquiryId: string
): Promise<void> {
  const settings = await getLoyaltySettings();
  const admin = createAdminClient();

  // --- referral reward ---
  const { data: referral } = await admin
    .from("referrals")
    .select("id, referrer_id, status")
    .eq("referred_id", customerId)
    .eq("status", "pending")
    .maybeSingle();

  if (referral && settings.referral_points > 0) {
    const awarded = await addTransaction({
      userId: referral.referrer_id,
      points: settings.referral_points,
      type: "referral",
      referenceId: referral.id,
      note: "Referred customer completed their first order",
    });
    if (awarded) {
      await admin
        .from("referrals")
        .update({ status: "rewarded", rewarded_at: new Date().toISOString() })
        .eq("id", referral.id);
    }
  }

  // --- delivered-orders milestone ---
  if (settings.orders_milestone_count <= 0 || settings.orders_milestone_points <= 0) return;

  const { count: deliveredCount } = await admin
    .from("inquiries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", customerId)
    .in("status", ["delivered", "completed"]);

  const { count: milestonesAwarded } = await admin
    .from("loyalty_transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", customerId)
    .eq("type", "orders_milestone");

  const earnedMilestones = Math.floor(
    (deliveredCount ?? 0) / settings.orders_milestone_count
  );
  if (earnedMilestones > (milestonesAwarded ?? 0)) {
    await addTransaction({
      userId: customerId,
      points: settings.orders_milestone_points,
      type: "orders_milestone",
      referenceId: inquiryId,
      note: `Bonus for ${earnedMilestones * settings.orders_milestone_count} delivered orders`,
    });
  }
}

/**
 * Redeem points against an order (called from createInquiry). Validates the
 * balance server-side; the negative ledger row IS the deduction.
 */
export async function redeemPoints(
  userId: string,
  points: number,
  inquiryId: string
): Promise<{ ok: boolean; reason?: "insufficient" }> {
  if (points <= 0) return { ok: true };
  const balance = await adminBalance(userId);
  if (points > balance) return { ok: false, reason: "insufficient" };

  const ok = await addTransaction({
    userId,
    points: -points,
    type: "redeemed",
    referenceId: inquiryId,
    note: "Redeemed at checkout",
  });
  return ok ? { ok: true } : { ok: false, reason: "insufficient" };
}

/** Give redeemed points back when an order is cancelled. Idempotent. */
export async function refundRedemption(
  userId: string,
  inquiryId: string,
  points: number
): Promise<void> {
  if (points <= 0) return;
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("loyalty_transactions")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "redemption_refund")
    .eq("reference_id", inquiryId)
    .limit(1);
  if (existing?.length) return;

  await addTransaction({
    userId,
    points,
    type: "redemption_refund",
    referenceId: inquiryId,
    note: "Order cancelled — points returned",
  });
}

/**
 * Manual admin correction — the only way an "adjustment" transaction is
 * created. `points` can be positive (add) or negative (subtract); the caller
 * (the adjustUserPoints action) is responsible for admin authorization.
 */
export async function adjustLoyaltyPoints(
  userId: string,
  points: number,
  note?: string
): Promise<boolean> {
  if (points === 0) return true;
  return addTransaction({
    userId,
    points,
    type: "adjustment",
    note: note?.trim() || "Manual adjustment by admin",
  });
}

const REFERRAL_CODE_PREFIX = "SAP";

function generateReferralCode(): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = REFERRAL_CODE_PREFIX;
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

/** Get (or lazily create) a user's referral code. */
export async function ensureReferralCode(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("referral_code")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.referral_code) return profile.referral_code;

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode();
    const { error } = await admin
      .from("profiles")
      .update({ referral_code: code })
      .eq("id", userId);
    if (!error) return code;
  }
  logger.error("could not generate referral code", { userId });
  return null;
}

/**
 * Link a fresh signup to the referrer whose code they arrived with.
 * Self-referrals and unknown codes are ignored silently.
 */
export async function attachReferral(
  newUserId: string,
  referralCode: string
): Promise<void> {
  const code = referralCode.trim().toUpperCase();
  if (!code) return;

  const admin = createAdminClient();
  const { data: referrer } = await admin
    .from("profiles")
    .select("id")
    .eq("referral_code", code)
    .maybeSingle();
  if (!referrer || referrer.id === newUserId) return;

  const { error } = await admin
    .from("profiles")
    .update({ referred_by: referrer.id })
    .eq("id", newUserId)
    .is("referred_by", null);
  if (error) return;

  // referred_id is UNIQUE — a second insert for the same user is a no-op.
  await admin.from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: newUserId,
  });
}
