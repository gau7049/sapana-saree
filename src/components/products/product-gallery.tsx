"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import type { ProductImage } from "@/types";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  // Primary image always leads, regardless of its stored sort_order.
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = sorted[selectedIndex];

  if (sorted.length === 0) {
    return (
      <div className="aspect-3/4 border border-border bg-muted flex items-center justify-center text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
      {sorted.length > 1 && (
        <div className="order-2 flex gap-2 overflow-x-auto pb-1 sm:order-1 sm:w-[70px] sm:shrink-0 sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:pb-0 lg:w-20">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-16 w-16 flex-shrink-0 overflow-hidden border transition-colors sm:h-[70px] sm:w-[70px] lg:h-20 lg:w-20",
                index === selectedIndex
                  ? "border-foreground"
                  : "border-border hover:border-foreground/40"
              )}
            >
              <ProgressiveImage
                src={image.url}
                alt={image.alt_text ?? `View ${index + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <div className="relative order-1 aspect-3/4 flex-1 overflow-hidden border border-border bg-muted sm:order-2">
        {selected && (
          <ProgressiveImage
            key={selected.id}
            src={selected.url}
            alt={selected.alt_text ?? "Product image"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        )}
      </div>
    </div>
  );
}
