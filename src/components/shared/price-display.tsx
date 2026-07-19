import { cn } from "@/lib/utils";

export function PriceDisplay({
  price,
  compareAtPrice,
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  className?: string;
}) {
  const formattedPrice = `₹${price.toLocaleString("en-IN")}`;
  const formattedCompare = compareAtPrice
    ? `₹${compareAtPrice.toLocaleString("en-IN")}`
    : null;

  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-lg font-bold">{formattedPrice}</span>
      {formattedCompare && compareAtPrice && compareAtPrice > price && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            {formattedCompare}
          </span>
          <span className="text-sm font-medium text-green-600 dark:text-green-400">
            {discount}% off
          </span>
        </>
      )}
    </div>
  );
}
