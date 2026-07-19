import { ProductCard } from "./product-card";
import { EmptyState } from "@/components/shared/empty-state";
import { Search } from "lucide-react";
import type { ProductWithImages } from "@/types";

export function ProductGrid({
  products,
  allWishlisted = false,
}: {
  products: ProductWithImages[];
  /** Set on the Wishlist page, where every card is trivially already saved. */
  allWishlisted?: boolean;
}) {
  if (products.length === 0) {
    return (
      <EmptyState
        icon={Search}
        title="No sarees found"
        description="Try adjusting your filters or search terms to find what you're looking for."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          priority={index < 4}
          wishlisted={allWishlisted}
        />
      ))}
    </div>
  );
}
