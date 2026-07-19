import { sendBrevoEmail } from "./client";
import { SITE_NAME } from "@/lib/constants";

export async function sendVerificationEmail(
  to: string,
  verifyLink: string
): Promise<boolean> {
  return sendBrevoEmail({
    to,
    subject: `Verify your email for ${SITE_NAME}`,
    text: [
      `Confirm this email address to enable password recovery on your ${SITE_NAME} account.`,
      "",
      `Verification link: ${verifyLink}`,
      "",
      "If you didn't request this, you can safely ignore this email.",
    ].join("\n"),
  });
}
