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
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="w-[42vw] shrink-0 sm:w-auto">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
