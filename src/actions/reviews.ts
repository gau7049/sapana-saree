"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, reviews as msg } from "@/lib/messages";
import { requireAdmin, requireAuth } from "@/lib/auth-guard";
import { awardReviewPoints, revokeReviewPoints } from "@/lib/loyalty";

export async function createReview(productId: string, formData: FormData) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const rating = Number(formData.get("rating"));
  const title = (formData.get("title") as string) || null;
  const comment = (formData.get("comment") as string) || null;

  if (!rating || rating < 1 || rating > 5) {
    return actionError(common.MISSING_REQUIRED_FIELDS);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("reviews").insert({
    product_id: productId,
    user_id: user.id,
    rating,
    title,
    comment,
    status: "pending",
  });

  if (error) {
    return actionError(
      error.code === "23505" ? msg.ALREADY_REVIEWED : common.SOMETHING_WENT_WRONG
    );
  }

  revalidatePath("/admin/reviews");
  return actionSuccess(msg.SUBMITTED);
}

export async function moderateReview(
  id: string,
  status: "approved" | "rejected",
  adminResponse?: string
) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("user_id, product_id, rating, status")
    .eq("id", id)
    .maybeSingle();
  if (!review) return actionError(common.SOMETHING_WENT_WRONG);

  const { error } = await supabase
    .from("reviews")
    .update({ status, admin_response: adminResponse ?? null })
    .eq("id", id);

  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  // Loyalty: points are earned when a qualifying review is APPROVED (moderation
  // is the abuse gate) and taken back if a previously approved review is
  // rejected later. Both calls are idempotent.
  if (status === "approved") {
    await awardReviewPoints(review.user_id, review.product_id, review.rating, id);
  } else if (review.status === "approved") {
    await revokeReviewPoints(review.user_id, review.product_id, id, {
      enforceBalance: false,
    });
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/sarees");
  return actionSuccess(msg.MODERATED(status));
}

export async function deleteReview(id: string) {
  try {
    await requireAdmin();
  } catch {
    return actionError(common.FORBIDDEN);
  }

  const supabase = await createClient();
  const { data: review } = await supabase
    .from("reviews")
    .select("user_id, product_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("reviews").delete().eq("id", id);

  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  if (review) {
    // Admin removal always revokes, even if it drives the balance negative —
    // spending farmed points shouldn't shield them from being clawed back.
    await revokeReviewPoints(review.user_id, review.product_id, id, {
      enforceBalance: false,
    });
  }

  revalidatePath("/admin/reviews");
  revalidatePath("/sarees");
  return actionSuccess(msg.DELETED);
}

export async function deleteOwnReview(id: string) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const admin = createAdminClient();
  const { data: review } = await admin
    .from("reviews")
    .select("user_id, product_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!review || review.user_id !== user.id) {
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  // If the review earned points, the deletion must give them back — and if
  // they've already been spent, the review stays (spec: no delete-after-spend).
  if (review.status === "approved") {
    const revoked = await revokeReviewPoints(user.id, review.product_id, id, {
      enforceBalance: true,
    });
    if (!revoked.ok) {
      return actionError(msg.POINTS_ALREADY_SPENT);
    }
  }

  const { error } = await admin.from("reviews").delete().eq("id", id);
  if (error) return actionError(common.SOMETHING_WENT_WRONG);

  revalidatePath("/account/reviews");
  revalidatePath("/sarees");
  return actionSuccess(msg.DELETED);
}
