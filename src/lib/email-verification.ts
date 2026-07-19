import { createAdminClient } from "@/lib/supabase/admin";
import { synthesizeAuthEmail } from "@/lib/username";
import { sendVerificationEmail } from "@/lib/brevo/send-verification-email";
import { getServerSiteUrl } from "@/lib/site-url";
import { createLogger } from "@/lib/logger";

const logger = createLogger("email-verification");

export async function sendVerificationLinkFor(
  username: string,
  realEmail: string,
  redirectPath: string = "/account?verified=1"
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const siteUrl = await getServerSiteUrl();
    // "magiclink" is repurposed here as a verification link: generating it
    // produces a valid, clickable Supabase auth link without emailing
    // anything itself — sendVerificationEmail below delivers it via Brevo.
    const { data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: synthesizeAuthEmail(username),
      options: {
        redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
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
