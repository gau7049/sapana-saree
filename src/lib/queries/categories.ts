import { cache } from "react";
import { unstable_cache } from "next/cache";
import type { Category } from "@/types";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { isSupabasePopulated } from "@/lib/supabase/populated";
import { CACHE_TTL } from "@/lib/constants";

const CATEGORY_FIELDS = "id, name, slug, description, image_url, parent_id, sort_order, is_active, created_at, updated_at";

async function fetchCategories() {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("categories")
        .select(CATEGORY_FIELDS)
        .eq("is_active", true)
        .order("sort_order");
      if (data && data.length > 0) return data as Category[];
    } catch {}
  }
  return MOCK_CATEGORIES.filter((c) => c.is_active).sort(
    (a, b) => a.sort_order - b.sort_order
  ) as Category[];
}

export const getCategories = cache(
  unstable_cache(fetchCategories, ["categories"], {
    tags: ["categories"],
    revalidate: CACHE_TTL,
  })
);

export const getCategoryBySlug = cache(async (slug: string) => {
  if (await isSupabasePopulated()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("categories")
        .select(CATEGORY_FIELDS)
        .eq("slug", slug)
        .eq("is_active", true)
        .single();
      if (data) return data as Category;
    } catch {}
  }
  return MOCK_CATEGORIES.find((c) => c.slug === slug && c.is_active) ?? null;
});

export async function getCategoryTree() {
  const categories = await getCategories();

  const roots = categories.filter((c) => !c.parent_id);
  const children = categories.filter((c) => c.parent_id);

  return roots.map((root) => ({
    ...root,
    subcategories: children.filter((c) => c.parent_id === root.id),
  }));
}
