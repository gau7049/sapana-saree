export const SITE_NAME = "Sapana Saree";
export const SITE_DESCRIPTION =
  "Discover exquisite sarees — from Banarasi silk to designer collections. Shop the finest Indian sarees at Sapana Saree.";

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const MAX_IMAGES_PER_PRODUCT = 8;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const PRODUCTS_PER_PAGE = 12;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Sarees", href: "/sarees" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const PROTECTED_ROUTES = ["/account", "/wishlist"];
export const ADMIN_ROUTES = ["/admin"];
export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
