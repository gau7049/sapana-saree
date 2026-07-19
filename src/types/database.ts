export type UserRole = "customer" | "admin" | "super_admin";
export type ProductStatus = "draft" | "published" | "archived";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type InquiryStatus =
  | "initiated"
  | "sent"
  | "responded"
  | "shipped"
  | "delivered"
  | "completed"
  | "cancelled";

export type PaymentMethod = "online" | "cod";

export interface Profile {
  id: string;
  username: string;
  email: string | null;
  email_verified: boolean;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  avatar_url: string | null;
  role: UserRole;
  referral_code: string | null;
  referred_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  status: ProductStatus;
  is_featured: boolean;
  is_available: boolean;
  material: string | null;
  color: string | null;
  occasion: string | null;
  work_type: string | null;
  avg_rating: number;
  review_count: number;
  view_count: number;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  public_id: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: ReviewStatus;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inquiry {
  id: string;
  user_id: string;
  product_id: string;
  status: InquiryStatus;
  whatsapp_message: string;
  notes: string | null;
  payment_method: PaymentMethod | null;
  tracking_courier: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  points_redeemed: number;
  created_at: string;
  updated_at: string;
}

export type LoyaltyTransactionType =
  | "welcome"
  | "review"
  | "review_revoked"
  | "referral"
  | "orders_milestone"
  | "redeemed"
  | "redemption_refund"
  | "adjustment";

export interface LoyaltySettings {
  id: number;
  welcome_points: number;
  review_points: number;
  review_min_rating: number;
  referral_points: number;
  orders_milestone_count: number;
  orders_milestone_points: number;
  point_value_inr: number;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  points: number;
  type: LoyaltyTransactionType;
  reference_id: string | null;
  note: string | null;
  created_at: string;
}

export type ReferralStatus = "pending" | "rewarded";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: ReferralStatus;
  rewarded_at: string | null;
  created_at: string;
}

export type WhatsAppLogKind =
  | "order"
  | "inquiry_reopen"
  | "unboxing"
  | "share"
  | "support";

export interface WhatsAppLog {
  id: string;
  user_id: string | null;
  kind: WhatsAppLogKind;
  message: string;
  status: string;
  created_at: string;
}

export interface Wishlist {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  categories: Category | null;
}

export interface ReviewWithProfile extends Review {
  profiles: Pick<Profile, "full_name" | "avatar_url">;
}
