import { createClient } from "@/lib/supabase/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isSameOrigin } from "@/lib/api/origin-check";
import { common, contact as msg } from "@/lib/messages";
import { HTTP_STATUS } from "@/lib/constants";
import { contactSchema } from "@/lib/validators/contact";
import { sendContactNotification } from "@/lib/brevo/send-contact-notification";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return apiError(common.FORBIDDEN, HTTP_STATUS.FORBIDDEN);
  }

  const body = await request.json();
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? common.MISSING_REQUIRED_FIELDS;
    return apiError(firstError, HTTP_STATUS.BAD_REQUEST);
  }

  const { name, email, subject, message } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    subject: subject || null,
    message,
  });

  if (error) return apiError(msg.SEND_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR);

  await sendContactNotification(parsed.data);

  return apiSuccess(msg.SENT);
}
