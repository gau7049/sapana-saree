"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

export function ProgressiveImage({
  className,
  onLoad,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  // placehold.co (used for seeded placeholder product images) serves SVG,
  // which Next's image optimizer refuses to process by default. Skip
  // optimization for just those URLs rather than allowing SVG globally.
  const isSvgPlaceholder =
    typeof props.src === "string" && props.src.includes("placehold.co");

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <Image
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        unoptimized={isSvgPlaceholder || props.unoptimized}
        onLoad={(e) => {
          setLoaded(true);
          if (typeof onLoad === "function") {
            onLoad(e as React.SyntheticEvent<HTMLImageElement>);
          }
        }}
        {...props}
      />
    </>
  );
}
