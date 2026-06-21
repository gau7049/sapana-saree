export type UserRole = "customer" | "admin" | "super_admin";
export type ProductStatus = "draft" | "published" | "archived";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type InquiryStatus = "sent" | "responded" | "completed" | "cancelled";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
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
  created_at: string;
  updated_at: string;
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
