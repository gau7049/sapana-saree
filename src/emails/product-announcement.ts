import { SITE_NAME, SITE_URL } from "@/lib/constants";

export interface ProductAnnouncement {
  title: string;
  slug: string;
  price: number;
  shortDescription?: string | null;
  imageUrl?: string | null;
}

/**
 * Interactive HTML email announcing a newly added saree. Inline styles only —
 * email clients strip stylesheets. Table layout for Outlook compatibility.
 */
export function buildProductAnnouncementEmail(product: ProductAnnouncement): {
  subject: string;
  html: string;
  text: string;
} {
  const productUrl = `${SITE_URL}/sarees/${product.slug}`;
  const priceText = `₹${product.price.toLocaleString("en-IN")}`;
  const subject = `New arrival: ${product.title}`;

  const html = `
<div style="margin:0;padding:24px 12px;background-color:#faf7f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #eee;">
    <tr>
      <td style="padding:20px 24px;text-align:center;background:#d63384;">
        <span style="font-size:20px;font-weight:bold;color:#ffffff;">${SITE_NAME}</span>
      </td>
    </tr>
    <tr>
      <td style="padding:24px;">
        <p style="margin:0 0 4px;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#d63384;font-weight:bold;">Just added</p>
        <h1 style="margin:0 0 12px;font-size:22px;color:#1a1a1a;">${escapeHtml(product.title)}</h1>
        ${
          product.imageUrl
            ? `<a href="${productUrl}" style="text-decoration:none;"><img src="${product.imageUrl}" alt="${escapeHtml(product.title)}" width="432" style="width:100%;max-width:432px;border-radius:8px;display:block;" /></a>`
            : ""
        }
        ${
          product.shortDescription
            ? `<p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#555;">${escapeHtml(product.shortDescription)}</p>`
            : ""
        }
        <p style="margin:16px 0 0;font-size:24px;font-weight:bold;color:#1a1a1a;">${priceText}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0;">
          <tr>
            <td style="border-radius:8px;background:#d63384;">
              <a href="${productUrl}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">View this saree</a>
            </td>
          </tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#999;">
          Free delivery across India · Order easily on WhatsApp
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px;background:#faf7f5;text-align:center;">
        <p style="margin:0;font-size:11px;color:#999;">
          You're receiving this because you have an account at
          <a href="${SITE_URL}" style="color:#d63384;">${SITE_NAME}</a>.
        </p>
      </td>
    </tr>
  </table>
</div>`.trim();

  const text = [
    `New arrival at ${SITE_NAME}!`,
    "",
    `${product.title} — ${priceText}`,
    product.shortDescription ?? "",
    "",
    `View it here: ${productUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, html, text };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
