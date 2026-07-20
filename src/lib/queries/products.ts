import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import type { ProductWithImages, ProductStatus } from "@/types";
import { PRODUCTS_PER_PAGE, CACHE_TTL } from "@/lib/constants";

const PRODUCT_SELECT = "*, product_images(*), categories(*)";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  material?: string;
  occasion?: string;
  sort?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  status?: ProductStatus;
}

async function resolveCategoryId(
  supabase: SupabaseClient,
  slug: string
): Promise<string | null> {
  const { data } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  return data?.id ?? null;
}

// Shared filter/sort/paginate logic behind both the public listing (publicOnly)
// and the admin product table (sees drafts/archived too via filters.status).

async function queryProducts(filters: ProductFilters, publicOnly: boolean) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const to = from + PRODUCTS_PER_PAGE - 1;

  let query = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });

  if (publicOnly) {
    query = query.eq("status", "published");
  } else if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.category) {
    // Unknown slug -> filter on a UUID that can never match, so the query
    // safely returns zero rows instead of accidentally dropping the filter.
    const categoryId = await resolveCategoryId(supabase, filters.category);
    query = query.eq("category_id", categoryId ?? "00000000-0000-0000-0000-000000000000");
  }
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);
  if (filters.material) query = query.ilike("material", `%${filters.material}%`);
  if (filters.occasion) query = query.ilike("occasion", `%${filters.occasion}%`);
  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.search) {
    query = query.textSearch("search_vector", filters.search, {
      type: "websearch",
      config: "english",
    });
  }

  switch (filters.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "rating":
      query = query.order("avg_rating", { ascending: false });
      break;
    case "popular":
      query = query.order("view_count", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const total = count ?? 0;
  return {
    products: (data ?? []) as ProductWithImages[],
    total,
    totalPages: Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE)),
  };
}

export async function getProducts(filters: ProductFilters = {}) {
  return queryProducts(filters, true);
}

export async function getAdminProducts(filters: ProductFilters = {}) {
  return queryProducts(filters, false);
}

export const getProductBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;
  return data as ProductWithImages;
});

export const getProductByIdAdmin = cache(async (id: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .single();

  if (error) return null;
  return data as ProductWithImages;
});

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null
) {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .neq("id", productId)
    .limit(4);

  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;
  if (error) return [];
  return (data ?? []) as ProductWithImages[];
}

export interface HomepageProducts {
  products: ProductWithImages[];
  // false when there were no admin-curated picks and the list below is a
  // fallback of recent arrivals instead — callers use this to adjust the
  // section heading and "View All" link (?featured=true would show nothing).
  isFeatured: boolean;
}

// createStaticClient (no cookies) + unstable_cache below: this runs inside a
// cache scope, where Next disallows the cookie-aware server client — see
// lib/supabase/static.ts. Safe here since featured products are public data.
async function fetchHomepageProducts(): Promise<HomepageProducts> {
  const supabase = createStaticClient();
  const { data: featured, error: featuredError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_featured", true)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  if (!featuredError && featured && featured.length > 0) {
    return { products: featured as ProductWithImages[], isFeatured: true };
  }

  // No products marked featured yet (a manual admin step store owners often
  // never get to) — fall back to newest arrivals so the homepage always has
  // a products section instead of silently showing nothing below Categories.
  const { data: recent, error: recentError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(10);

  if (recentError) return { products: [], isFeatured: false };
  return { products: (recent ?? []) as ProductWithImages[], isFeatured: false };
}

export const getHomepageProducts = cache(
  unstable_cache(fetchHomepageProducts, ["featured-products"], {
    tags: ["featured-products"],
    revalidate: CACHE_TTL,
  })
);

async function fetchProductFilterOptions() {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("products")
    .select("material, occasion")
    .eq("status", "published");

  if (error) return { materials: [], occasions: [] };

  const materials = [
    ...new Set(data.map((p) => p.material).filter(Boolean)),
  ] as string[];
  const occasions = [
    ...new Set(data.map((p) => p.occasion).filter(Boolean)),
  ] as string[];

  return { materials, occasions };
}

export const getProductFilterOptions = cache(
  unstable_cache(fetchProductFilterOptions, ["product-filters"], {
    tags: ["product-filters"],
    revalidate: CACHE_TTL,
  })
);
