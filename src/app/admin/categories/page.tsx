import { CategoryManager } from "@/components/admin/category-manager";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import type { Category } from "@/types";

async function getAdminCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (data) return data as Category[];
    } catch {}
  }
  return MOCK_CATEGORIES as Category[];
}

export default async function AdminCategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage product categories and subcategories.
      </p>
      <div className="mt-6 max-w-2xl">
        <CategoryManager categories={categories} />
      </div>
    </div>
  );
}
