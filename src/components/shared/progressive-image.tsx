"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProgressiveImage({
  className,
  onLoad,
  alt,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  // A broken/expired Cloudinary URL or a locally-deleted upload otherwise
  // renders the browser's default broken-image icon — swap to a plain icon
  // tile instead so it reads as intentional rather than a bug.
  const [failed, setFailed] = useState(false);

  // placehold.co (used for seeded placeholder product images) serves SVG,
  // which Next's image optimizer refuses to process by default. Skip
  // optimization for just those URLs rather than allowing SVG globally.
  const isSvgPlaceholder =
    typeof props.src === "string" && props.src.includes("placehold.co");

  if (failed) {
    return (
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground",
          className
        )}
      >
        <ImageOff className="h-6 w-6" />
      </div>
    );
  }

  return (
    <>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <Image
        alt={alt}
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
        onError={() => setFailed(true)}
        {...props}
      />
    </>
  );
}
