"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { awardWelcomePoints, attachReferral, ensureReferralCode } from "@/lib/loyalty";
import { actionError, actionSuccess } from "@/lib/api/response";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { common, auth as msg } from "@/lib/messages";
import { normalizeUsername, isValidUsername, synthesizeAuthEmail } from "@/lib/username";

function safeRedirectPath(url: string | null): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

export async function signUp(formData: FormData) {
  const ip = await getClientIp();
  if (!checkRateLimit(`auth:signup:${ip}`, 5, 60_000).allowed) {
    return actionError(common.RATE_LIMIT_EXCEEDED);
  }

  const username = normalizeUsername((formData.get("username") as string) ?? "");
  const fullName = ((formData.get("full_name") as string) ?? "").trim() || null;
  const password = formData.get("password") as string;

  if (!isValidUsername(username)) return actionError(msg.INVALID_USERNAME);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: synthesizeAuthEmail(username),
    password,
    options: {
      data: { username, full_name: fullName },
    },
  });

  if (error) {
    return actionError(
      error.message.toLowerCase().includes("already registered")
        ? msg.USERNAME_TAKEN
        : error.message
    );
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
  }

  return actionSuccess(msg.SIGNUP_SUCCESS);
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

  // Password checked out, but a deactivated account still can't proceed —
  // this is the enforcement point for the admin "remove user" toggle.
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active")
    .eq("username", username)
    .maybeSingle();

  if (profile && !profile.is_active) {
    await supabase.auth.signOut();
    return actionError(msg.ACCOUNT_DISABLED);
  }

  const redirectField = formData.get("redirect") as string | null;
  if (redirectField !== "stay") redirect(safeRedirectPath(redirectField));
  return actionSuccess(msg.LOGIN_SUCCESS);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
