"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { SITE_URL } from "@/lib/constants";
import { actionSuccess, actionError } from "@/lib/api/response";
import { auth as msg, common } from "@/lib/messages";

const LOCAL_AUTH_COOKIE = "local-auth-session";

function safeRedirectPath(url: string | null): string {
  if (!url || !url.startsWith("/") || url.startsWith("//")) return "/";
  return url;
}

export async function signUp(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return actionError(msg.SIGNUP_UNAVAILABLE);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirm_password") as string;
  const fullName = formData.get("full_name") as string;

  if (password !== confirmPassword) {
    return actionError("Passwords do not match.");
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    return actionError(error.message);
  }

  return actionSuccess(msg.SIGNUP_SUCCESS);
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!isSupabaseConfigured()) {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (email === adminEmail && password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set(LOCAL_AUTH_COOKIE, JSON.stringify({
        id: "local-admin",
        email: adminEmail,
        role: "admin",
      }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      const redirectTo = safeRedirectPath(formData.get("redirect") as string);
      redirect(redirectTo);
    }

    return actionError(msg.LOGIN_FAILED);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return actionError(error.message);
  }

  const redirectTo = safeRedirectPath(formData.get("redirect") as string);
  redirect(redirectTo);
}

export async function signOut() {
  if (!isSupabaseConfigured()) {
    const cookieStore = await cookies();
    cookieStore.delete(LOCAL_AUTH_COOKIE);
    redirect("/login");
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return actionError(msg.PASSWORD_RESET_UNAVAILABLE);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return actionError(error.message);
  }

  return actionSuccess(msg.PASSWORD_RESET_SENT);
}

export async function resetPassword(formData: FormData) {
  if (!isSupabaseConfigured()) {
    return actionError(msg.PASSWORD_RESET_UNAVAILABLE);
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return actionError(error.message);
  }

  redirect(`/login?message=${encodeURIComponent(msg.PASSWORD_UPDATED)}`);
}

export async function getLocalUser() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get(LOCAL_AUTH_COOKIE);
    if (!session?.value) return null;
    return JSON.parse(session.value) as { id: string; email: string; role: string };
  } catch {
    return null;
  }
}
