import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { Separator } from "@/components/ui/separator";
import { getCategories } from "@/lib/queries/categories";
import { isSupabaseConfigured } from "@/lib/supabase/helpers";
import { MOCK_PRODUCTS } from "@/lib/mock-data";
import type { Product, ProductImage } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const categories = await getCategories();

  let product: Product | null = null;
  let images: ProductImage[] = [];

  if (isSupabaseConfigured()) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const [productRes, imagesRes] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase
          .from("product_images")
          .select("*")
          .eq("product_id", id)
          .order("sort_order"),
      ]);
      product = (productRes.data as Product) ?? null;
      images = (imagesRes.data as ProductImage[]) ?? [];
    } catch {}
  } else {
    const mock = MOCK_PRODUCTS.find((p) => p.id === id);
    if (mock) {
      product = mock as Product;
      images = mock.product_images as ProductImage[];
    }

    try {
      const { readLocalImages } = await import("@/lib/local-storage");
      const localImages = await readLocalImages();
      const productLocalImages = localImages.filter((img) => img.product_id === id);
      if (productLocalImages.length > 0) {
        images = [...images, ...productLocalImages];
      }
    } catch {}
  }

  if (!product) notFound();

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
            <ImageUpload productId={id} images={images} />
          </div>
        </div>

        <Separator />

        <ProductForm product={product} categories={categories} />
      </div>
    </div>
  );
}
