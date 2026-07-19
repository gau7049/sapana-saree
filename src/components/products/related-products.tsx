import { ProductCard } from "./product-card";
import type { ProductWithImages } from "@/types";

export function RelatedProducts({
  products,
}: {
  products: ProductWithImages[];
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-xl font-bold">You May Also Like</h2>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
