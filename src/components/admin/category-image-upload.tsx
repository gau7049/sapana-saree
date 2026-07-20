"use client";

import { useState } from "react";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { handleFetch } from "@/lib/action-handler";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { toast } from "sonner";

/**
 * Image control inside the category edit dialog. Uploads/removes immediately
 * (separate from the name/description form, which saves via its own button) —
 * matches how product images work, so admins don't lose an upload by
 * cancelling the text form.
 */
export function CategoryImageUpload({
  categoryId,
  imageUrl,
}: {
  categoryId: string;
  imageUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(imageUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
      toast.error("Invalid file type. Only JPEG, PNG, and WebP are allowed.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error("File too large. Maximum size is 5MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("category_id", categoryId);

    const result = await handleFetch<{ url: string }>("/api/categories/image", {
      method: "POST",
      body: formData,
    });

    if (result.status && result.result) {
      setUrl(result.result.url);
      router.refresh();
    }
    setUploading(false);
    e.target.value = "";
  }

  async function handleRemove() {
    setRemoving(true);
    const result = await handleFetch(
      `/api/categories/image?category_id=${encodeURIComponent(categoryId)}`,
      { method: "DELETE" }
    );
    if (result.status) {
      setUrl(null);
      router.refresh();
    }
    setRemoving(false);
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative aspect-4/3 w-24 shrink-0 overflow-hidden rounded-md border bg-muted">
        {url ? (
          <ProgressiveImage src={url} alt="Category image" fill sizes="96px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xl">🪡</div>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-accent",
            uploading && "pointer-events-none opacity-50"
          )}
        >
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" />
          )}
          {url ? "Replace image" : "Upload image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        {url && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto justify-start px-2.5 py-1 text-xs text-destructive hover:text-destructive"
            onClick={handleRemove}
            disabled={removing}
          >
            {removing ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <X className="mr-1.5 h-3.5 w-3.5" />
            )}
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
