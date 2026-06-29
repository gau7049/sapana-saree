import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { contact as msg, common } from "@/lib/messages";
import { createLogger } from "@/lib/logger";
import { HTTP_STATUS } from "@/lib/constants";
import { contactSchema } from "@/lib/validators/contact";

const logger = createLogger("api:contact");

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") ?? "unknown";

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && !origin.includes(host)) {
    return apiError(common.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? common.MISSING_REQUIRED_FIELDS;
      return apiError(firstError, HTTP_STATUS.BAD_REQUEST);
    }

    const { name, email, subject, message } = parsed.data;

    const supabase = await createClient();

    const { error: dbError } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject: subject || null,
      message,
    });

    if (dbError) {
      logger.error("Failed to save contact message", { requestId, error: dbError.message });
      return apiError(msg.SEND_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Sapana Saree <onboarding@resend.dev>",
            to: ["delivered@resend.dev"],
            subject: `New Contact: ${subject || "No subject"}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Name:</strong> ${escapeHtml(name)}</p>
              <p><strong>Email:</strong> ${escapeHtml(email)}</p>
              ${subject ? `<p><strong>Subject:</strong> ${escapeHtml(subject)}</p>` : ""}
              <p><strong>Message:</strong></p>
              <p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>
            `,
          }),
        });
      } catch {
        logger.warn("Failed to send email notification", { requestId });
      }
    }

    logger.info("Contact message saved", { requestId });
    return apiSuccess(msg.SENT);
  } catch (error) {
    logger.error("Contact API error", {
      requestId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return apiError(common.SOMETHING_WENT_WRONG, HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
}
