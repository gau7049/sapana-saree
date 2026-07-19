"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { awardWelcomePoints, attachReferral, ensureReferralCode } from "@/lib/loyalty";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionError, actionSuccess } from "@/lib/api/response";
import { common, auth as msg } from "@/lib/messages";
import { SITE_URL } from "@/lib/constants";
import { normalizeUsername, isValidUsername, synthesizeAuthEmail } from "@/lib/username";
import { sendPasswordResetEmail } from "@/lib/brevo/send-password-reset";
import { sendVerificationLinkFor } from "@/lib/email-verification";
import { requireAuth } from "@/lib/auth-guard";

function safeRedirectPath(url: string | null): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

export async function signUp(formData: FormData) {
  const username = normalizeUsername((formData.get("username") as string) ?? "");
  const fullName = ((formData.get("full_name") as string) ?? "").trim() || null;
  const realEmail = ((formData.get("email") as string) ?? "").trim() || null;
  const password = formData.get("password") as string;
  const verifyRedirect = (formData.get("verify_redirect") as string) || undefined;

  if (!isValidUsername(username)) return actionError(msg.INVALID_USERNAME);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: synthesizeAuthEmail(username),
    password,
    options: {
      data: { username, full_name: fullName, real_email: realEmail },
    },
  });

  if (error) {
    return actionError(
      error.message.toLowerCase().includes("already registered")
        ? msg.USERNAME_TAKEN
        : error.message
    );
  }

  if (realEmail) {
    try {
      await sendVerificationLinkFor(username, realEmail, verifyRedirect);
    } catch {
      // Non-blocking: email is optional, account creation must still succeed.
    }
  }

  if (data.user) {
    try {
      // Welcome bonus (idempotent — once per account ever) + a referral code
      // of their own so they can start sharing immediately.
      await awardWelcomePoints(data.user.id);
      await ensureReferralCode(data.user.id);

      // Referral attribution: explicit form field first, else the cookie the
      // proxy set when they arrived via a shared ?ref= link.
      const cookieStore = await cookies();
      const referralCode =
        ((formData.get("ref") as string) || "").trim() ||
        cookieStore.get("sapana_ref")?.value ||
        "";
      if (referralCode) {
        await attachReferral(data.user.id, referralCode);
        cookieStore.delete("sapana_ref");
      }
    } catch {
      // Loyalty must never block account creation.
    }
  }

  if (data.session) {
    const redirectField = formData.get("redirect") as string | null;
    if (redirectField !== "stay") redirect(safeRedirectPath(redirectField));
    return actionSuccess(msg.SIGNUP_SUCCESS);
  }

  return actionSuccess(msg.SIGNUP_SUCCESS);
}

export async function signIn(formData: FormData) {
  const username = normalizeUsername((formData.get("username") as string) ?? "");
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: synthesizeAuthEmail(username),
    password,
  });

  if (error) return actionError(error.message);

  const redirectField = formData.get("redirect") as string | null;
  if (redirectField !== "stay") redirect(safeRedirectPath(redirectField));
  return actionSuccess(msg.LOGIN_SUCCESS);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPassword(formData: FormData) {
  const username = normalizeUsername((formData.get("username") as string) ?? "");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, email_verified")
    .eq("username", username)
    .maybeSingle();

  if (!profile?.email || !profile.email_verified) {
    return actionError(msg.NO_RECOVERY_EMAIL);
  }

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: synthesizeAuthEmail(username),
    options: {
      redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    return actionError(common.SOMETHING_WENT_WRONG);
  }

  const sent = await sendPasswordResetEmail(profile.email, data.properties.action_link);
  if (!sent) return actionError(common.SOMETHING_WENT_WRONG);

  return actionSuccess(msg.PASSWORD_RESET_SENT);
}

export async function resetPassword(formData: FormData) {
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return actionError(error.message);

  redirect("/login?message=" + encodeURIComponent(msg.PASSWORD_UPDATED));
}

export async function resendVerificationEmail(formData?: FormData) {
  let profile;
  try {
    profile = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  if (!profile.email || profile.email_verified) {
    return actionError(msg.NO_EMAIL_TO_VERIFY);
  }

  const verifyRedirect = (formData?.get("verify_redirect") as string) || undefined;
  const sent = await sendVerificationLinkFor(profile.username, profile.email, verifyRedirect);
  if (!sent) return actionError(common.SOMETHING_WENT_WRONG);

  return actionSuccess(msg.VERIFICATION_EMAIL_SENT);
}
