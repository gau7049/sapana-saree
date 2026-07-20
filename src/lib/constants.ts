export const SITE_NAME = "Sapana Saree";
export const SITE_DESCRIPTION =
  "Discover exquisite sarees — from Banarasi silk to designer collections. Shop the finest Indian sarees at Sapana Saree.";

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Order terms — single source of truth for the product page strip, the payment
// step, the /policies page, and the WhatsApp order message.
export const DELIVERY_ESTIMATE = "7–10 days";
export const COD_CHARGE = 150;
export const ORDER_TERMS = [
  `Delivery in ${DELIVERY_ESTIMATE} across India`,
  `Cash on Delivery available (+₹${COD_CHARGE} handling charge)`,
  "No returns or exchanges — please review details and ask questions before ordering",
  "An uncut, unpaused unboxing video is required for any damage or wrong-item claim",
] as const;

export const MAX_IMAGES_PER_PRODUCT = 12;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const PRODUCTS_PER_PAGE = 12;
export const REVIEWS_PER_PAGE = 10;
export const DEFAULT_PAGE = 1;

export const ADMIN_ROLES = ["admin", "super_admin"] as const;

export const RATE_LIMIT_MAX = 50;
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const API_TIMEOUT_MS = 8_000;

export const ISR_REVALIDATE_INTERVAL = 3600;
export const CACHE_TTL = 3600;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Sarees", href: "/sarees" },
  { label: "Categories", href: "/categories" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

// Read by the middleware (src/proxy.ts) to decide which requests need a
// session redirect before the route itself ever runs.
export const PROTECTED_ROUTES = ["/account", "/wishlist"];
export const ADMIN_ROUTES = ["/admin"];
export const AUTH_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password"];
