import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import type { Category } from "@/types";
import { CACHE_TTL } from "@/lib/constants";

async function fetchCategories() {
  const supabase = createStaticClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Category[];
}

export const getCategories = cache(
  unstable_cache(fetchCategories, ["categories"], {
    tags: ["categories"],
    revalidate: CACHE_TTL,
  })
);

export async function getAllCategoriesAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Category[];
}

export const getCategoryBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as Category;
});

// Builds a 2-level parent/subcategory tree from the flat, cached category
// list — cheap in memory, so no need for a separate recursive DB query.
export async function getCategoryTree() {
  const categories = await getCategories();

  const roots = categories.filter((c) => !c.parent_id);
  const children = categories.filter((c) => c.parent_id);

  return roots.map((root) => ({
    ...root,
    subcategories: children.filter((c) => c.parent_id === root.id),
  }));
}
