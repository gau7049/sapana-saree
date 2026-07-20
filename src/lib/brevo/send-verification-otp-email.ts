import { sendBrevoEmail } from "./client";
import { SITE_NAME, OTP_EXPIRY_MINUTES } from "@/lib/constants";

export async function sendVerificationOtpEmail(
  to: string,
  code: string
): Promise<boolean> {
  return sendBrevoEmail({
    to,
    subject: `Your ${SITE_NAME} verification code`,
    text: [
      `Confirm this email address to enable password recovery on your ${SITE_NAME} account.`,
      "",
      `Your verification code: ${code}`,
      "",
      `This code expires in ${OTP_EXPIRY_MINUTES} minutes.`,
      "",
      "If you didn't request this, you can safely ignore this email.",
    ].join("\n"),
  });
}
