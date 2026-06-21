import { createClient } from "@/lib/supabase/server";
import { CategoryManager } from "@/components/admin/category-manager";
import type { Category } from "@/types";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage product categories and subcategories.
      </p>
      <div className="mt-6 max-w-2xl">
        <CategoryManager categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
