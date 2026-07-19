import { sendBrevoEmail } from "./client";
import { createLogger } from "@/lib/logger";
import type { ContactInput } from "@/lib/validators/contact";

const logger = createLogger("brevo:contact-notification");

export async function sendContactNotification(input: ContactInput) {
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;
  if (!to) return;

  const sent = await sendBrevoEmail({
    to,
    replyTo: input.email,
    subject: `New contact message: ${input.subject ?? "No subject"}`,
    text: [
      `From: ${input.name} <${input.email}>`,
      input.subject ? `Subject: ${input.subject}` : null,
      "",
      input.message,
    ]
      .filter(Boolean)
      .join("\n"),
  });

  if (!sent) {
    logger.error("Failed to send contact notification email");
  }
}
