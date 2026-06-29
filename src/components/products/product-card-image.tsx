"use client";

import { ProgressiveImage } from "@/components/shared/progressive-image";

export function ProductCardImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <ProgressiveImage
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className="object-cover transition-transform duration-300 group-hover:scale-105"
      priority={priority}
      loading={priority ? undefined : "lazy"}
    />
  );
}
