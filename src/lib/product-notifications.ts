import { createAdminClient } from "@/lib/supabase/admin";
import { sendBrevoEmail } from "@/lib/brevo/client";
import { buildProductAnnouncementEmail } from "@/emails/product-announcement";
import { createLogger } from "@/lib/logger";

const logger = createLogger("product-notifications");

// Stay well inside Brevo's free-tier daily cap even if the store grows.
const MAX_RECIPIENTS_PER_ANNOUNCEMENT = 200;

/**
 * Email every registered customer (with a verified email) when a product goes
 * live. Guarded by products.notified_at so a product is announced at most
 * once, no matter how many times it's edited or re-published. Runs inside
 * `after()` from the publish action, so it never blocks the admin's save.
 */
export async function sendNewProductAnnouncement(productId: string): Promise<void> {
  const admin = createAdminClient();

  // Claim the announcement atomically: only the caller that flips
  // notified_at from NULL sends, so concurrent publishes can't double-send.
  const { data: product, error } = await admin
    .from("products")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", productId)
    .eq("status", "published")
    .is("notified_at", null)
    .select("id, title, slug, price, short_description, product_images(url, is_primary)")
    .maybeSingle();

  if (error) {
    logger.error("announcement claim failed", { productId, error: error.message });
    return;
  }
  if (!product) return; // already announced, or not published

  const { data: recipients } = await admin
    .from("profiles")
    .select("email")
    .eq("email_verified", true)
    .not("email", "is", null)
    .limit(MAX_RECIPIENTS_PER_ANNOUNCEMENT);

  if (!recipients?.length) {
    logger.info("no recipients for product announcement", { productId });
    return;
  }

  const images = (product.product_images ?? []) as { url: string; is_primary: boolean }[];
  const primaryImage = images.find((img) => img.is_primary) ?? images[0];

  const email = buildProductAnnouncementEmail({
    title: product.title,
    slug: product.slug,
    price: Number(product.price),
    shortDescription: product.short_description,
    imageUrl: primaryImage?.url ?? null,
  });

  let sent = 0;
  for (const recipient of recipients) {
    if (!recipient.email) continue;
    const ok = await sendBrevoEmail({
      to: recipient.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    if (ok) sent++;
  }

  logger.info("product announcement sent", {
    productId,
    recipients: recipients.length,
    sent,
  });
}
