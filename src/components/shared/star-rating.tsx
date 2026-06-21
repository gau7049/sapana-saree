import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  maxRating = 5,
  size = "sm",
  showValue = false,
}: {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md";
  showValue?: boolean;
}) {
  const sizeClass = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i < Math.floor(rating)
                ? "fill-amber-400 text-amber-400"
                : i < rating
                  ? "fill-amber-400/50 text-amber-400"
                  : "text-muted-foreground/30"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
