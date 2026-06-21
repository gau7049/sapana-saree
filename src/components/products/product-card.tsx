import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/star-rating";
import { PriceDisplay } from "@/components/shared/price-display";
import type { ProductWithImages } from "@/types";

export function ProductCard({ product }: { product: ProductWithImages }) {
  const primaryImage = product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0];

  return (
    <Link
      href={`/sarees/${product.slug}`}
      className="group overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No Image
          </div>
        )}

        {product.compare_at_price && product.compare_at_price > product.price && (
          <Badge className="absolute left-2 top-2" variant="secondary">
            {Math.round(
              ((product.compare_at_price - product.price) /
                product.compare_at_price) *
                100
            )}
            % OFF
          </Badge>
        )}

        {product.is_featured && (
          <Badge className="absolute right-2 top-2">Featured</Badge>
        )}
      </div>

      <div className="p-4">
        {product.categories && (
          <p className="text-xs text-muted-foreground">
            {product.categories.name}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-medium group-hover:text-primary">
          {product.title}
        </h3>

        {product.review_count > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating rating={product.avg_rating} />
            <span className="text-xs text-muted-foreground">
              ({product.review_count})
            </span>
          </div>
        )}

        <PriceDisplay
          price={product.price}
          compareAtPrice={product.compare_at_price}
          className="mt-2"
        />
      </div>
    </Link>
  );
}
