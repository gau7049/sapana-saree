"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { awardWelcomePoints, attachReferral, ensureReferralCode } from "@/lib/loyalty";
import { createAdminClient } from "@/lib/supabase/admin";
import { actionError, actionSuccess } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { msSinceOtpSent } from "@/lib/otp-store";
import { common, auth as msg } from "@/lib/messages";
import { normalizeUsername, isValidUsername, synthesizeAuthEmail } from "@/lib/username";
import { sendVerificationOtp, sendPasswordResetOtp, type OtpDispatchResult } from "@/lib/otp-email";
import { requireAuth } from "@/lib/auth-guard";
import { OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/constants";

function safeRedirectPath(url: string | null): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

// Shared by the verification-OTP and password-reset-OTP resend paths: reject
// locally (no email sent, no Supabase call) if the last code for this key
// was sent under OTP_RESEND_COOLDOWN_SECONDS ago.
function tooSoonToResend(otpStoreKey: string): boolean {
  const msSince = msSinceOtpSent(otpStoreKey);
  return msSince !== null && msSince < OTP_RESEND_COOLDOWN_SECONDS * 1_000;
}

// True once the tracked send is missing (never sent / evicted) or older than
// the app's expiry window — checked before ever calling Supabase's verifyOtp.
function otpExpired(otpStoreKey: string): boolean {
  const msSince = msSinceOtpSent(otpStoreKey);
  return msSince === null || msSince > OTP_EXPIRY_MINUTES * 60_000;
}

export async function signUp(formData: FormData) {
  const ip = await getClientIp();
  if (!checkRateLimit(`auth:signup:${ip}`, 5, 60_000).allowed) {
    return actionError(common.RATE_LIMIT_EXCEEDED);
  }

  const username = normalizeUsername((formData.get("username") as string) ?? "");
  const fullName = ((formData.get("full_name") as string) ?? "").trim() || null;
  const realEmail = ((formData.get("email") as string) ?? "").trim() || null;
  const password = formData.get("password") as string;

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

  let expiresAt: number | null = null;
  if (realEmail) {
    try {
      const otp = await sendVerificationOtp(username, realEmail);
      if (otp.ok) expiresAt = otp.expiresAt;
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
    return actionSuccess<OtpDispatchResult>(msg.SIGNUP_SUCCESS, { expiresAt });
  }

  return actionSuccess<OtpDispatchResult>(msg.SIGNUP_SUCCESS, { expiresAt });
}

export async function signIn(formData: FormData) {
  const ip = await getClientIp();
  // Tighter than the default API limit — this guards password brute-forcing,
  // not general traffic.
  if (!checkRateLimit(`auth:signin:${ip}`, 10, 60_000).allowed) {
    return actionError(common.RATE_LIMIT_EXCEEDED);
  }

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

export interface ForgotPasswordResult {
  username: string;
  expiresAt: number;
}

export async function forgotPassword(formData: FormData) {
  const ip = await getClientIp();
  // Sends an email per successful call — keep this the strictest limit here.
  if (!checkRateLimit(`auth:forgot:${ip}`, 3, 60_000).allowed) {
    return actionError(common.RATE_LIMIT_EXCEEDED);
  }

  const username = normalizeUsername((formData.get("username") as string) ?? "");
  if (tooSoonToResend(`reset:${username}`)) {
    return actionError(msg.OTP_RESEND_TOO_SOON);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, email_verified")
    .eq("username", username)
    .maybeSingle();

  if (!profile?.email || !profile.email_verified) {
    return actionError(msg.NO_RECOVERY_EMAIL);
  }

  const otp = await sendPasswordResetOtp(username, profile.email);
  if (!otp.ok) return actionError(common.SOMETHING_WENT_WRONG);

  return actionSuccess<ForgotPasswordResult>(msg.OTP_SENT, {
    username,
    expiresAt: otp.expiresAt,
  });
}

export async function resendPasswordResetOtp(username: string) {
  const ip = await getClientIp();
  if (!checkRateLimit(`auth:forgot:${ip}`, 3, 60_000).allowed) {
    return actionError(common.RATE_LIMIT_EXCEEDED);
  }

  const normalized = normalizeUsername(username);
  if (tooSoonToResend(`reset:${normalized}`)) {
    return actionError(msg.OTP_RESEND_TOO_SOON);
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email, email_verified")
    .eq("username", normalized)
    .maybeSingle();

  if (!profile?.email || !profile.email_verified) {
    return actionError(msg.NO_RECOVERY_EMAIL);
  }

  const otp = await sendPasswordResetOtp(normalized, profile.email);
  if (!otp.ok) return actionError(common.SOMETHING_WENT_WRONG);

  return actionSuccess<OtpDispatchResult>(msg.OTP_SENT, { expiresAt: otp.expiresAt });
}

// Replaces the old link-based resetPassword: verifies the OTP AND sets the
// new password in one submission (the code's verifyOtp call is also what
// establishes the session updateUser needs — there's no separate "click the
// link" step creating it beforehand anymore).
export async function verifyPasswordResetOtp(
  username: string,
  code: string,
  newPassword: string
) {
  const ip = await getClientIp();
  if (!checkRateLimit(`auth:reset-verify:${ip}`, 10, 5 * 60_000).allowed) {
    return actionError(common.RATE_LIMIT_EXCEEDED);
  }

  const normalized = normalizeUsername(username);
  if (otpExpired(`reset:${normalized}`)) {
    return actionError(msg.OTP_EXPIRED);
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: synthesizeAuthEmail(normalized),
    token: code,
    type: "recovery",
  });

  if (verifyError) return actionError(msg.OTP_INVALID);

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) return actionError(updateError.message);

  redirect("/login?message=" + encodeURIComponent(msg.PASSWORD_RESET_SUCCESS));
}

export async function sendEmailVerificationOtp() {
  let profile;
  try {
    profile = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  if (!profile.email || profile.email_verified) {
    return actionError(msg.NO_EMAIL_TO_VERIFY);
  }

  if (tooSoonToResend(`verify:${profile.username}`)) {
    return actionError(msg.OTP_RESEND_TOO_SOON);
  }

  const otp = await sendVerificationOtp(profile.username, profile.email);
  if (!otp.ok) return actionError(common.SOMETHING_WENT_WRONG);

  return actionSuccess<OtpDispatchResult>(msg.OTP_SENT, { expiresAt: otp.expiresAt });
}

export async function verifyEmailOtp(code: string) {
  let profile;
  try {
    profile = await requireAuth();
  } catch {
    return actionError(common.NOT_AUTHENTICATED);
  }

  const ip = await getClientIp();
  if (!checkRateLimit(`auth:verify-otp:${ip}`, 10, 5 * 60_000).allowed) {
    return actionError(common.RATE_LIMIT_EXCEEDED);
  }

  if (otpExpired(`verify:${profile.username}`)) {
    return actionError(msg.OTP_EXPIRED);
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({
    email: synthesizeAuthEmail(profile.username),
    token: code,
    type: "email",
  });

  if (verifyError) return actionError(msg.OTP_INVALID);

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ email_verified: true })
    .eq("id", profile.id);

  if (updateError) return actionError(common.SOMETHING_WENT_WRONG);

  return actionSuccess(msg.EMAIL_VERIFIED);
}
