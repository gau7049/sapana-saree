import { createAdminClient } from "@/lib/supabase/admin";
import { synthesizeAuthEmail } from "@/lib/username";
import { sendVerificationOtpEmail } from "@/lib/brevo/send-verification-otp-email";
import { sendPasswordResetOtpEmail } from "@/lib/brevo/send-password-reset-otp-email";
import { markOtpSent } from "@/lib/otp-store";
import { OTP_EXPIRY_MINUTES } from "@/lib/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("otp-email");

export interface OtpSendResult {
  ok: boolean;
  expiresAt: number;
}

// Shape returned to the client by any Server Action that fires off an OTP
// email as a side effect (signup, profile email change) — null expiresAt
// means the send failed and there's nothing for the client to count down to.
export interface OtpDispatchResult {
  expiresAt: number | null;
}

// Supabase's admin.generateLink() — already used for the app's other admin
// auth operations — returns a ready-to-use `email_otp` alongside the link it
// generates. Reusing it means Supabase owns the code's hashing/storage; we
// just relay the digits over email and track our own (tighter) expiry.
async function sendOtp(
  linkType: "magiclink" | "recovery",
  username: string,
  realEmail: string,
  otpStoreKey: string,
  deliver: (to: string, code: string) => Promise<boolean>
): Promise<OtpSendResult> {
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60_000;

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: linkType,
      email: synthesizeAuthEmail(username),
    });

    if (error || !data?.properties?.email_otp) {
      logger.error("Failed to generate OTP", { linkType, error: error?.message });
      return { ok: false, expiresAt };
    }

    const sent = await deliver(realEmail, data.properties.email_otp);
    if (sent) markOtpSent(otpStoreKey);
    return { ok: sent, expiresAt };
  } catch (err) {
    logger.error("Failed to send OTP", {
      linkType,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return { ok: false, expiresAt };
  }
}

export function sendVerificationOtp(
  username: string,
  realEmail: string
): Promise<OtpSendResult> {
  return sendOtp(
    "magiclink",
    username,
    realEmail,
    `verify:${username}`,
    sendVerificationOtpEmail
  );
}

export function sendPasswordResetOtp(
  username: string,
  realEmail: string
): Promise<OtpSendResult> {
  return sendOtp(
    "recovery",
    username,
    realEmail,
    `reset:${username}`,
    sendPasswordResetOtpEmail
  );
}
