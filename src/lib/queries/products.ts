import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { ProductWithImages } from "@/types";
import { PRODUCTS_PER_PAGE, CACHE_TTL } from "@/lib/constants";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import { isSupabasePopulated } from "@/lib/supabase/populated";

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

const PRODUCT_IMAGE_FIELDS = "product_images(id, product_id, url, public_id, is_primary, sort_order, alt_text, width, height, created_at)";
const CATEGORY_REF_FIELDS = "categories(id, name, slug)";

async function getProductsFromDB(
  filters: ProductFilters
): Promise<{ products: ProductWithImages[]; total: number } | null> {
  if (!await isSupabasePopulated()) return null;

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();

    const selectQuery = filters.category
      ? `*, ${PRODUCT_IMAGE_FIELDS}, categories!inner(id, name, slug)`
      : `*, ${PRODUCT_IMAGE_FIELDS}, ${CATEGORY_REF_FIELDS}`;

    let query = supabase
      .from("products")
      .select(selectQuery, { count: "exact" })
      .eq("status", "published");

    if (filters.category) {
      query = query.eq("categories.slug", filters.category);
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
      const searchTerms = filters.search.trim().split(/\s+/).join(" & ");
      query = query.textSearch("search_vector", searchTerms, {
        type: "plain",
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

    const page = filters.page ?? 1;
    const from = (page - 1) * PRODUCTS_PER_PAGE;
    const to = from + PRODUCTS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error || !data) return null;

    return {
      products: data as ProductWithImages[],
      total: count ?? data.length,
    };
  } catch {
    return null;
  }
}

function getProductsFromMock(filters: ProductFilters) {
  let products = [...MOCK_PRODUCTS];

  if (filters.category) {
    products = products.filter(
      (p) => p.categories?.slug === filters.category
    );
  }
  if (filters.minPrice) {
    products = products.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice) {
    products = products.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.material) {
    products = products.filter((p) =>
      p.material?.toLowerCase().includes(filters.material!.toLowerCase())
    );
  }
  if (filters.occasion) {
    products = products.filter((p) =>
      p.occasion?.toLowerCase().includes(filters.occasion!.toLowerCase())
    );
  }
  if (filters.featured) {
    products = products.filter((p) => p.is_featured);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.material?.toLowerCase().includes(q)
    );
  }

  switch (filters.sort) {
    case "price-asc":
      products.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      products.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      products.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      break;
    case "rating":
      products.sort((a, b) => b.avg_rating - a.avg_rating);
      break;
    case "popular":
      products.sort((a, b) => b.view_count - a.view_count);
      break;
    default:
      products.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  const page = filters.page ?? 1;
  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const total = products.length;
  const paginated = products.slice(from, from + PRODUCTS_PER_PAGE);

  return { products: paginated as ProductWithImages[], total };
}

export async function getProducts(filters: ProductFilters = {}) {
  const dbResult = await getProductsFromDB(filters);
  const source = dbResult ?? getProductsFromMock(filters);

  return {
    products: source.products,
    total: source.total,
    totalPages: Math.ceil(source.total / PRODUCTS_PER_PAGE),
  };
}

export const getProductBySlug = cache(async (slug: string) => {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select(`*, ${PRODUCT_IMAGE_FIELDS}, ${CATEGORY_REF_FIELDS}`)
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (data) return data as ProductWithImages;
    } catch {}
  }
  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
});

export async function getRelatedProducts(
  productId: string,
  categoryId: string | null
) {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      let query = supabase
        .from("products")
        .select(`*, ${PRODUCT_IMAGE_FIELDS}, ${CATEGORY_REF_FIELDS}`)
        .eq("status", "published")
        .neq("id", productId)
        .limit(4);
      if (categoryId) query = query.eq("category_id", categoryId);
      const { data } = await query;
      if (data && data.length > 0) return data as ProductWithImages[];
    } catch {}
  }
  return MOCK_PRODUCTS.filter(
    (p) =>
      p.id !== productId && (categoryId ? p.category_id === categoryId : true)
  ).slice(0, 4);
}

async function fetchFeaturedProducts() {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select(`*, ${PRODUCT_IMAGE_FIELDS}, ${CATEGORY_REF_FIELDS}`)
        .eq("status", "published")
        .eq("is_featured", true)
        .limit(8);
      if (data && data.length > 0) return data as ProductWithImages[];
    } catch {}
  }
  return MOCK_PRODUCTS.filter((p) => p.is_featured).slice(0, 8);
}

export const getFeaturedProducts = cache(
  unstable_cache(fetchFeaturedProducts, ["featured-products"], {
    tags: ["featured-products"],
    revalidate: CACHE_TTL,
  })
);

async function fetchProductFilterOptions() {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("products")
        .select("material, occasion")
        .eq("status", "published");
      if (data && data.length > 0) {
        const materials = [
          ...new Set(data.map((p) => p.material).filter(Boolean)),
        ] as string[];
        const occasions = [
          ...new Set(data.map((p) => p.occasion).filter(Boolean)),
        ] as string[];
        return { materials, occasions };
      }
    } catch {}
  }

  const materials = [
    ...new Set(MOCK_PRODUCTS.map((p) => p.material).filter(Boolean)),
  ] as string[];
  const occasions = [
    ...new Set(MOCK_PRODUCTS.map((p) => p.occasion).filter(Boolean)),
  ] as string[];
  return { materials, occasions };
}

export const getProductFilterOptions = cache(
  unstable_cache(fetchProductFilterOptions, ["product-filters"], {
    tags: ["product-filters"],
    revalidate: CACHE_TTL,
  })
);
