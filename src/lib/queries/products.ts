import { createClient } from "@/lib/supabase/server";
import type { ProductWithImages } from "@/types";
import { PRODUCTS_PER_PAGE } from "@/lib/constants";

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
}

export async function getProducts(filters: ProductFilters = {}) {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const to = from + PRODUCTS_PER_PAGE - 1;

  let query = supabase
    .from("products")
    .select(
      `*, product_images(*), categories(*)`,
      { count: "exact" }
    )
    .eq("status", "published");

  if (filters.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .single();
    if (cat) {
      query = query.eq("category_id", cat.id);
    }
  }

  if (filters.minPrice) {
    query = query.gte("price", filters.minPrice);
  }
  if (filters.maxPrice) {
    query = query.lte("price", filters.maxPrice);
  }
  if (filters.material) {
    query = query.ilike("material", `%${filters.material}%`);
  }
  if (filters.occasion) {
    query = query.ilike("occasion", `%${filters.occasion}%`);
  }
  if (filters.featured) {
    query = query.eq("is_featured", true);
  }
  if (filters.search) {
    query = query.textSearch("title", filters.search, {
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
    case "newest":
      query = query.order("created_at", { ascending: false });
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

  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    console.error("Error fetching products:", error);
    return { products: [] as ProductWithImages[], total: 0, totalPages: 0 };
  }

  return {
    products: (data ?? []) as ProductWithImages[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / PRODUCTS_PER_PAGE),
  };
}

export async function getProductBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`*, product_images(*), categories(*)`)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (error) return null;

  // Increment view count (best-effort, ignore errors)
  supabase.from("products").update({ view_count: (data.view_count ?? 0) + 1 }).eq("slug", slug).then(() => {});

  return data as ProductWithImages;
}

export async function getRelatedProducts(productId: string, categoryId: string | null) {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select(`*, product_images(*), categories(*)`)
    .eq("status", "published")
    .neq("id", productId)
    .limit(4);

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  const { data } = await query;
  return (data ?? []) as ProductWithImages[];
}

export async function getFeaturedProducts() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select(`*, product_images(*), categories(*)`)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []) as ProductWithImages[];
}

export async function getProductFilterOptions() {
  const supabase = await createClient();

  const { data: materials } = await supabase
    .from("products")
    .select("material")
    .eq("status", "published")
    .not("material", "is", null);

  const { data: occasions } = await supabase
    .from("products")
    .select("occasion")
    .eq("status", "published")
    .not("occasion", "is", null);

  const uniqueMaterials = [...new Set(materials?.map((m) => m.material).filter(Boolean))] as string[];
  const uniqueOccasions = [...new Set(occasions?.map((o) => o.occasion).filter(Boolean))] as string[];

  return { materials: uniqueMaterials, occasions: uniqueOccasions };
}
