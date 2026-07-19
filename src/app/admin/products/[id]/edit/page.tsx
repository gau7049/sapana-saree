import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { ImageUpload } from "@/components/admin/image-upload";
import { Separator } from "@/components/ui/separator";
import { getAllCategoriesAdmin } from "@/lib/queries/categories";
import { getProductByIdAdmin } from "@/lib/queries/products";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [categories, product] = await Promise.all([
    getAllCategoriesAdmin(),
    getProductByIdAdmin(id),
  ]);

  if (!product) notFound();

  const images = product.product_images ?? [];

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
