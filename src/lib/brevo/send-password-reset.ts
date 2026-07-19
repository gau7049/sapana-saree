import { sendBrevoEmail } from "./client";
import { SITE_NAME } from "@/lib/constants";

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<boolean> {
  return sendBrevoEmail({
    to,
    subject: `Reset your ${SITE_NAME} password`,
    text: [
      `We received a request to reset your ${SITE_NAME} password.`,
      "",
      `Reset link: ${resetLink}`,
      "",
      "If you didn't request this, you can safely ignore this email.",
    ].join("\n"),
  });
}
