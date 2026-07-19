"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, profile as msg } from "@/lib/messages";
import { requireAuth } from "@/lib/auth-guard";
import { sendVerificationLinkFor } from "@/lib/email-verification";

export async function updateProfile(formData: FormData) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const fullName = ((formData.get("full_name") as string) ?? "").trim() || null;
  const email = ((formData.get("email") as string) ?? "").trim() || null;
  const emailChanged = email !== user.email;
  const verifyRedirect = (formData.get("verify_redirect") as string) || undefined;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      email,
      // Changing the email invalidates any prior verification — must be
      // re-confirmed before it can be used for password recovery again.
      email_verified: emailChanged ? false : user.email_verified,
    })
    .eq("id", user.id);

  if (error) return actionError(msg.UPDATE_ERROR);

  if (emailChanged && email) {
    try {
      await sendVerificationLinkFor(user.username, email, verifyRedirect);
    } catch {
      // Non-blocking: profile update must still succeed.
    }
  }

  revalidatePath("/account");
  return actionSuccess(msg.UPDATED);
}

export async function saveAddress(formData: FormData) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const line1 = ((formData.get("address_line1") as string) ?? "").trim();
  const line2 = ((formData.get("address_line2") as string) ?? "").trim() || null;
  const city = ((formData.get("city") as string) ?? "").trim();
  const state = ((formData.get("state") as string) ?? "").trim();
  const country = ((formData.get("country") as string) ?? "").trim() || "India";
  const postalCode = ((formData.get("postal_code") as string) ?? "").trim();
  const phone = ((formData.get("phone") as string) ?? "").trim();

  if (!line1 || !city || !state || !postalCode || !phone) {
    return actionError(common.MISSING_REQUIRED_FIELDS);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      address_line1: line1,
      address_line2: line2,
      city,
      state,
      country,
      postal_code: postalCode,
      phone,
    })
    .eq("id", user.id);

  if (error) return actionError(msg.UPDATE_ERROR);

  revalidatePath("/account/address");
  return actionSuccess(msg.ADDRESS_SAVED);
}
