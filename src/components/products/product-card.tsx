import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/star-rating";
import { PriceDisplay } from "@/components/shared/price-display";
import { ProductCardImage } from "./product-card-image";
import type { ProductWithImages } from "@/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: ProductWithImages;
  priority?: boolean;
}) {
  const primaryImage = product.product_images?.find((img) => img.is_primary) ??
    product.product_images?.[0];

  const discountPercent =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round(
          ((product.compare_at_price - product.price) /
            product.compare_at_price) *
            100
        )
      : null;

  return (
    <Link
      href={`/sarees/${product.slug}`}
      className="group relative overflow-hidden rounded-xl border bg-card transition-shadow duration-200 hover:shadow-md"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-muted">
        {primaryImage ? (
          <ProductCardImage
            src={primaryImage.url}
            alt={primaryImage.alt_text ?? product.title}
            priority={priority}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
            <span className="text-3xl">🪡</span>
            <span className="text-xs">No Image</span>
          </div>
        )}

        {discountPercent && (
          <Badge
            variant="secondary"
            className="absolute left-2 top-2 bg-green-100 text-xs font-semibold text-green-800 hover:bg-green-100"
          >
            {discountPercent}% OFF
          </Badge>
        )}
      </div>

      <div className="p-3">
        {product.categories && (
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {product.categories.name}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm font-medium leading-snug">
          {product.title}
        </h3>

        <PriceDisplay
          price={product.price}
          compareAtPrice={product.compare_at_price}
          className="mt-2"
        />

        {product.review_count > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <StarRating rating={product.avg_rating} />
            <span className="text-[11px] text-muted-foreground">
              ({product.review_count})
            </span>
          </div>
        )}

        <p className="mt-2 text-[11px] font-medium text-green-700">
          Free Delivery
        </p>
      </div>
    </Link>
  );
}
