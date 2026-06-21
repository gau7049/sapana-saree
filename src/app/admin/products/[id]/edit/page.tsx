import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/product-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { Separator } from "@/components/ui/separator";
import type { Category, Product, ProductImage } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const [productRes, categoriesRes, imagesRes] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").eq("is_active", true).order("name"),
    supabase
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("sort_order"),
  ]);

  if (productRes.error || !productRes.data) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update product details and manage images.
      </p>

      <div className="mt-6 max-w-3xl space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Images</h2>
          <div className="mt-3">
            <ImageUpload
              productId={id}
              images={(imagesRes.data ?? []) as ProductImage[]}
            />
          </div>
        </div>

        <Separator />

        <ProductForm
          product={productRes.data as Product}
          categories={(categoriesRes.data ?? []) as Category[]}
        />
      </div>
    </div>
  );
}
