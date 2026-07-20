import { WHATSAPP_NUMBER, COD_CHARGE, DELIVERY_ESTIMATE } from "./constants";
import type { PaymentMethod } from "@/types";

export interface WhatsAppAddress {
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface WhatsAppInquiry {
  productTitle: string;
  productUrl: string;
  category: string;
  price: number;
  userName: string;
  userPhone?: string;
  address?: WhatsAppAddress;
  selectedVariant?: string;
  selectedImageUrl?: string;
  paymentMethod?: PaymentMethod;
  pointsRedeemed?: number;
  pointValueInr?: number;
}

export function buildWhatsAppMessage(inquiry: WhatsAppInquiry): string {
  return [
    "Hello! I'm interested in buying a saree from Sapana Saree.",
    "",
    `Product: ${inquiry.productTitle}`,
    `Category: ${inquiry.category}`,
    `Price: ₹${inquiry.price.toLocaleString("en-IN")}`,
    `Link: ${inquiry.productUrl}`,
    inquiry.selectedVariant ? `Selected saree: ${inquiry.selectedVariant}` : "",
    inquiry.selectedImageUrl ? `Selected saree photo: ${inquiry.selectedImageUrl}` : "",
    "",
    `My Name: ${inquiry.userName}`,
    inquiry.userPhone ? `My Phone: ${inquiry.userPhone}` : "",
    inquiry.address
      ? [
          "",
          "Delivery Address:",
          inquiry.address.line1,
          inquiry.address.line2,
          `${inquiry.address.city}, ${inquiry.address.state} ${inquiry.address.postalCode}`,
          inquiry.address.country,
        ]
          .filter(Boolean)
          .join("\n")
      : "",
    inquiry.pointsRedeemed && inquiry.pointsRedeemed > 0
      ? `Redeeming: ${inquiry.pointsRedeemed} loyalty points (−₹${Math.round(
          inquiry.pointsRedeemed * (inquiry.pointValueInr ?? 1)
        ).toLocaleString("en-IN")})`
      : "",
    inquiry.paymentMethod
      ? [
          "",
          `Payment: ${
            inquiry.paymentMethod === "cod"
              ? `Cash on Delivery (+₹${COD_CHARGE} handling charge, collected upfront)`
              : "Online payment (UPI / bank transfer)"
          }`,
          // The customer sends the terms in their own opening message — this is
          // the reseller's proof that conditions were seen before ordering.
          `I understand: delivery in ${DELIVERY_ESTIMATE}, no returns/exchanges, and an uncut unboxing video is required for any claim.`,
        ].join("\n")
      : "",
    "",
    "Please share availability and delivery details.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildWhatsAppUrl(inquiry: WhatsAppInquiry): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildWhatsAppMessage(inquiry))}`;
}

/**
 * Share a product TO a friend — no phone number, so WhatsApp opens its
 * contact picker instead of the store's chat.
 */
export function buildProductShareUrl(
  title: string,
  price: number,
  productUrl: string
): string {
  const message = [
    "Found this beautiful saree at Sapana Saree 😍",
    "",
    `${title} — ₹${price.toLocaleString("en-IN")}`,
    productUrl,
  ].join("\n");
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function buildGenericWhatsAppUrl(): string {
  const message =
    "Hi! I'm browsing Sapana Saree and have a question.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
