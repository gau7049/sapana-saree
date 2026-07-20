"use client";

import { useState, useCallback } from "react";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import { Button } from "@/components/ui/button";
import { Upload, X, Star, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { deleteProductImage, setPrimaryImage, updateImageOrder } from "@/actions/images";
import { handleAction, handleFetch } from "@/lib/action-handler";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types";
import { MAX_IMAGES_PER_PRODUCT, MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { toast } from "sonner";

function sortImages(images: ProductImage[]) {
  return [...images].sort((a, b) => a.sort_order - b.sort_order);
}

export function ImageUpload({
  productId,
  images: initialImages,
}: {
  productId: string;
  images: ProductImage[];
}) {
  const [images, setImages] = useState(() => sortImages(initialImages));
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      if (images.length + files.length > MAX_IMAGES_PER_PRODUCT) {
        toast.error(`Maximum ${MAX_IMAGES_PER_PRODUCT} images per product`);
        return;
      }

      for (const file of Array.from(files)) {
        if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
          toast.error(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`);
          return;
        }
        if (file.size > MAX_IMAGE_SIZE_BYTES) {
          toast.error(`${file.name}: File too large. Maximum size is 5MB.`);
          return;
        }
      }

      setUploading(true);

      // One request per file (not one multi-file request) so a failure on
      // any single image doesn't block the others from uploading.
      await Promise.all(
        Array.from(files).map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("product_id", productId);

          const result = await handleFetch<ProductImage>(
            "/api/images/upload",
            { method: "POST", body: formData },
            { showToast: false }
          );

          if (result.status && result.result) {
            setImages((prev) => [...prev, result.result!]);
            toast.success(`Uploaded ${file.name}`);
          } else {
            toast.error(`${file.name}: ${result.message}`);
          }
        })
      );

      setUploading(false);
      e.target.value = "";
    },
    [productId, images.length]
  );

  async function handleDelete(imageId: string, publicId: string) {
    await handleAction(deleteProductImage(imageId, publicId), {
      onSuccess: () => setImages((prev) => prev.filter((img) => img.id !== imageId)),
    });
  }

  async function handleSetPrimary(imageId: string) {
    await handleAction(setPrimaryImage(imageId, productId), {
      onSuccess: () =>
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            is_primary: img.id === imageId,
          }))
        ),
    });
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    // Optimistic swap: update local state immediately, persist sort_order for
    // every image (indexes shifted for all of them, not just the swapped pair).
    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];

    setReordering(true);
    await handleAction(
      updateImageOrder(
        reordered.map((img, i) => ({ id: img.id, sort_order: i }))
      ),
      {
        showToast: false,
        onSuccess: () =>
          setImages(reordered.map((img, i) => ({ ...img, sort_order: i }))),
      }
    );
    setReordering(false);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((image, index) => (
          <div key={image.id} className="group relative aspect-3/4 overflow-hidden rounded-lg border">
            <ProgressiveImage
              src={image.url}
              alt={image.alt_text ?? "Product image"}
              fill
              sizes="200px"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40">
              <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={() => handleSetPrimary(image.id)}
                  title="Set as primary"
                >
                  <Star
                    className={cn(
                      "h-3 w-3",
                      image.is_primary && "fill-amber-400 text-amber-400"
                    )}
                  />
                </Button>
                <Button
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => handleDelete(image.id, image.public_id)}
                  title="Delete image"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={() => handleMove(index, -1)}
                  disabled={reordering || index === 0}
                  title="Move earlier"
                >
                  <ChevronLeft className="h-3 w-3" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon-xs"
                  onClick={() => handleMove(index, 1)}
                  disabled={reordering || index === images.length - 1}
                  title="Move later"
                >
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
            {image.is_primary && (
              <span className="absolute bottom-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                Primary
              </span>
            )}
          </div>
        ))}

        <label
          className={cn(
            "flex aspect-3/4 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:border-primary hover:bg-primary/5",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <Upload className="h-6 w-6 text-muted-foreground" />
              <span className="mt-1 text-xs text-muted-foreground">Upload</span>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Max {MAX_IMAGES_PER_PRODUCT} images. JPEG, PNG, or WebP. Max 5MB each.
      </p>
    </div>
  );
}
