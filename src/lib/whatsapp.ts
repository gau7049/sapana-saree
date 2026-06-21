import { WHATSAPP_NUMBER } from "./constants";

interface WhatsAppInquiry {
  productTitle: string;
  productId: string;
  category: string;
  price: number;
  userName: string;
  userPhone?: string;
}

export function buildWhatsAppUrl(inquiry: WhatsAppInquiry): string {
  const message = [
    "Hello! I'm interested in buying a saree from Sapana Saree.",
    "",
    `Product: ${inquiry.productTitle}`,
    `Category: ${inquiry.category}`,
    `Price: ₹${inquiry.price.toLocaleString("en-IN")}`,
    `Product ID: ${inquiry.productId}`,
    "",
    `My Name: ${inquiry.userName}`,
    inquiry.userPhone ? `My Phone: ${inquiry.userPhone}` : "",
    "",
    "Please share availability and delivery details.",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function buildGenericWhatsAppUrl(): string {
  const message =
    "Hi! I'm browsing Sapana Saree and have a question.";
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
