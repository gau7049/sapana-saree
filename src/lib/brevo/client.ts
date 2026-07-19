import { createLogger } from "@/lib/logger";

const logger = createLogger("brevo:client");

interface SendBrevoEmailInput {
  to: string;
  subject: string;
  text: string;
  /** Optional rich HTML body; `text` remains the plain-text fallback. */
  html?: string;
  replyTo?: string;
}

export async function sendBrevoEmail(input: SendBrevoEmailInput): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    logger.error("BREVO_API_KEY is not set — email not sent", { to: input.to });
    return false;
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL;
  if (!fromEmail) {
    // No silent fallback: an unverified sender is rejected by Brevo anyway,
    // and a fake default just hides the misconfiguration.
    logger.error("BREVO_FROM_EMAIL is not set — email not sent", { to: input.to });
    return false;
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Sapana Saree", email: fromEmail },
        to: [{ email: input.to }],
        replyTo: input.replyTo ? { email: input.replyTo } : undefined,
        subject: input.subject,
        textContent: input.text,
        htmlContent: input.html,
      }),
    });

    if (!res.ok) {
      logger.error("Brevo API responded with an error", {
        status: res.status,
        body: await res.text(),
      });
      return false;
    }

    return true;
  } catch (err) {
    logger.error("Failed to send email via Brevo", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return false;
  }
}
