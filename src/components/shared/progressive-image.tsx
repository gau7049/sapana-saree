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
