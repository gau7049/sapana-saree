import { createAdminClient } from "@/lib/supabase/admin";
import { synthesizeAuthEmail } from "@/lib/username";
import { sendVerificationEmail } from "@/lib/brevo/send-verification-email";
import { SITE_URL } from "@/lib/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("email-verification");

export async function sendVerificationLinkFor(
  username: string,
  realEmail: string,
  redirectPath: string = "/account?verified=1"
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: synthesizeAuthEmail(username),
      options: {
        redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
      },
    });

    if (error || !data?.properties?.action_link) {
      logger.error("Failed to generate verification link", {
        error: error?.message,
      });
      return false;
    }

    return await sendVerificationEmail(realEmail, data.properties.action_link);
  } catch (err) {
    logger.error("Failed to send verification link", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return false;
  }
}
