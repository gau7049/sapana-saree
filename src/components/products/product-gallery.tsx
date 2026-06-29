"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import type { ProductImage } from "@/types";

export function ProductGallery({ images }: { images: ProductImage[] }) {
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = sorted[selectedIndex];

  if (sorted.length === 0) {
    return (
      <div className="aspect-3/4 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-3/4 overflow-hidden rounded-xl bg-muted">
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

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                "relative h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                index === selectedIndex
                  ? "border-primary"
                  : "border-transparent hover:border-muted-foreground/30"
              )}
            >
              <ProgressiveImage
                src={image.url}
                alt={image.alt_text ?? `View ${index + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
