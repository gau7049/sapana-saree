import { CategoryManager } from "@/components/admin/category-manager";
import { getAllCategoriesAdmin } from "@/lib/queries/categories";

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesAdmin();

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
