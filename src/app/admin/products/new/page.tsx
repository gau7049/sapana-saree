import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import type { Category } from "@/types";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("name");

  return (
    <div>
      <h1 className="text-2xl font-bold">Add Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Create a new product. You can add images after saving.
      </p>
      <div className="mt-6 max-w-3xl">
        <ProductForm categories={(categories ?? []) as Category[]} />
      </div>
    </div>
  );
}
