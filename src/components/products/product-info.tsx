import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StarRating } from "@/components/shared/star-rating";
import { PriceDisplay } from "@/components/shared/price-display";
import type { ProductWithImages } from "@/types";

export function ProductInfo({ product }: { product: ProductWithImages }) {
  return (
    <div className="space-y-4">
      {product.categories && (
        <Badge variant="secondary">{product.categories.name}</Badge>
      )}

      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {product.title}
      </h1>

      {product.review_count > 0 && (
        <div className="flex items-center gap-2">
          <StarRating rating={product.avg_rating} size="md" showValue />
          <span className="text-sm text-muted-foreground">
            ({product.review_count} {product.review_count === 1 ? "review" : "reviews"})
          </span>
        </div>
      )}

      <PriceDisplay
        price={product.price}
        compareAtPrice={product.compare_at_price}
      />

      <Separator />

      {product.short_description && (
        <p className="text-muted-foreground">{product.short_description}</p>
      )}

      {product.description && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p>{product.description}</p>
        </div>
      )}

      <Separator />

      <dl className="grid grid-cols-2 gap-3 text-sm">
        {product.material && (
          <div>
            <dt className="text-muted-foreground">Material</dt>
            <dd className="font-medium">{product.material}</dd>
          </div>
        )}
        {product.color && (
          <div>
            <dt className="text-muted-foreground">Color</dt>
            <dd className="font-medium">{product.color}</dd>
          </div>
        )}
        {product.occasion && (
          <div>
            <dt className="text-muted-foreground">Occasion</dt>
            <dd className="font-medium">{product.occasion}</dd>
          </div>
        )}
        {product.work_type && (
          <div>
            <dt className="text-muted-foreground">Work Type</dt>
            <dd className="font-medium">{product.work_type}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
