"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import { useSelectedImage } from "@/components/products/selected-image-context";
import type { ProductImage } from "@/types";

// Minimum horizontal drag distance (px) before a touch gesture counts as a
// swipe rather than a tap/scroll.
const SWIPE_THRESHOLD = 40;

export function ProductGallery({ images }: { images: ProductImage[] }) {
  // Primary image always leads, regardless of its stored sort_order.
  const sorted = [...images].sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return a.sort_order - b.sort_order;
  });

  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = sorted[selectedIndex];
  const touchStartX = useRef<number | null>(null);
  const { setSelected } = useSelectedImage();

  useEffect(() => {
    setSelected(selectedIndex, sorted.length, selected?.alt_text ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, sorted.length, selected?.alt_text]);

  function showPrev() {
    setSelectedIndex((i) => (i - 1 + sorted.length) % sorted.length);
  }

  function showNext() {
    setSelectedIndex((i) => (i + 1) % sorted.length);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < SWIPE_THRESHOLD) return;
    if (delta > 0) showPrev();
    else showNext();
  }

  if (sorted.length === 0) {
    return (
      <div className="aspect-3/4 border border-border bg-muted flex items-center justify-center text-muted-foreground">
        No images available
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
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

        <div
          className="relative order-1 aspect-3/4 flex-1 overflow-hidden border border-border bg-muted sm:order-2"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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

          {sorted.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                aria-label="Previous image"
                className="absolute top-1/2 left-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Next image"
                className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2 py-0.5 text-xs text-foreground backdrop-blur-sm">
                {selectedIndex + 1} / {sorted.length}
              </div>
            </>
          )}
        </div>
      </div>

      {sorted.length > 1 && (
        <p className="text-xs text-muted-foreground">
          This listing has {sorted.length} sarees — tap a thumbnail to pick the exact one you
          want. It will be included with your order request.
        </p>
      )}
    </div>
  );
}
