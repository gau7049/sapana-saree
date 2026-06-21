import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types";

export async function getCategories() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching categories:", error);
    return [];
  }

  return data as Category[];
}

export async function getCategoryBySlug(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data as Category;
}

export async function getCategoryTree() {
  const categories = await getCategories();

  const roots = categories.filter((c) => !c.parent_id);
  const children = categories.filter((c) => c.parent_id);

  return roots.map((root) => ({
    ...root,
    subcategories: children.filter((c) => c.parent_id === root.id),
  }));
}
