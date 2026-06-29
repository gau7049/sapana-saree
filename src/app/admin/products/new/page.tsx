import { ProductForm } from "@/components/admin/product-form";
import { getCategories } from "@/lib/queries/categories";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="text-2xl font-bold">Add Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a new product. You can add images after saving.
      </p>
      <div className="mt-6 max-w-3xl">
        <ProductForm categories={categories} />
      </div>
    </div>
  );
}
