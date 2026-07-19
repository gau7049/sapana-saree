"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionError, actionSuccess } from "@/lib/api/response";
import type { InquiryStatus, PaymentMethod } from "@/types";
import { common, inquiries as msg } from "@/lib/messages";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import { redeemPoints, refundRedemption, processDeliveredOrder } from "@/lib/loyalty";

export async function createInquiry(
  productId: string,
  whatsappMessage: string,
  paymentMethod?: PaymentMethod,
  pointsToRedeem?: number
) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const supabase = await createClient();
  const { data: inquiry, error } = await supabase
    .from("inquiries")
    .insert({
      user_id: user.id,
      product_id: productId,
      whatsapp_message: whatsappMessage,
      payment_method: paymentMethod ?? null,
      // "initiated", not "sent": the client can't verify the WhatsApp tab
      // actually opened (popup blockers), so don't overstate what happened.
      status: "initiated",
    })
    .select("id")
    .single();

  if (error || !inquiry) return actionError(common.SOMETHING_WENT_WRONG);

  // Redemption is validated against the server-side ledger — a tampered client
  // can put anything in its message, but points only leave the ledger here,
  // and the admin card shows the ledger-backed amount.
  const requested = Math.max(0, Math.floor(pointsToRedeem ?? 0));
  if (requested > 0) {
    const redeemed = await redeemPoints(user.id, requested, inquiry.id);
    if (redeemed.ok) {
      await supabase
        .from("inquiries")
        .update({ points_redeemed: requested })
        .eq("id", inquiry.id);
    }
  }

  // Audit trail of system-generated WhatsApp messages.
  const admin = createAdminClient();
  await admin.from("whatsapp_logs").insert({
    user_id: user.id,
    kind: "order",
    message: whatsappMessage,
  });

  revalidatePath("/admin/inquiries");
  revalidatePath("/account/inquiries");
  return actionSuccess(msg.LOGGED);
}

export interface InquiryStatusExtras {
  notes?: string;
  trackingCourier?: string;
  trackingNumber?: string;
}

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
  extras?: InquiryStatusExtras
) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("inquiries")
    .update({
      status,
      ...(extras?.notes !== undefined ? { notes: extras.notes } : {}),
      ...(extras?.trackingCourier !== undefined
        ? { tracking_courier: extras.trackingCourier.trim() || null }
        : {}),
      ...(extras?.trackingNumber !== undefined
        ? { tracking_number: extras.trackingNumber.trim() || null }
        : {}),
      // Stamp lifecycle dates so the customer's timeline can show real dates.
      ...(status === "shipped" ? { shipped_at: new Date().toISOString() } : {}),
      ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .select("user_id, points_redeemed")
    .maybeSingle();

  if (error || !updated) return actionError(common.SOMETHING_WENT_WRONG);

  // Loyalty hooks (all idempotent):
  // delivered → referral reward for the customer's referrer (first delivery
  //             only) + every-Nth-order milestone bonus.
  // cancelled → any points redeemed on this order go back to the customer.
  if (status === "delivered") {
    await processDeliveredOrder(updated.user_id, id);
  } else if (status === "cancelled") {
    await refundRedemption(updated.user_id, id, updated.points_redeemed ?? 0);
  }

  revalidatePath("/admin/inquiries");
  revalidatePath("/account/inquiries");
  return actionSuccess(msg.STATUS_CHANGED(status));
}
