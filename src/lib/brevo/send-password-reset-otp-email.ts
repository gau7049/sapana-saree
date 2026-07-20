import { sendBrevoEmail } from "./client";
import { SITE_NAME, OTP_EXPIRY_MINUTES } from "@/lib/constants";

export async function sendPasswordResetOtpEmail(
  to: string,
  code: string
): Promise<boolean> {
  return sendBrevoEmail({
    to,
    subject: `Your ${SITE_NAME} password reset code`,
    text: [
      `We received a request to reset your ${SITE_NAME} password.`,
      "",
      `Your reset code: ${code}`,
      "",
      `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      "",
      "If you didn't request this, you can safely ignore this email.",
    ].join("\n"),
  });
}
