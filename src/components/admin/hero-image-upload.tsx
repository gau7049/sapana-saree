"use client";

import { useState, useCallback } from "react";
import { ProgressiveImage } from "@/components/shared/progressive-image";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { handleFetch } from "@/lib/action-handler";
import { cn } from "@/lib/utils";
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES } from "@/lib/constants";
import { toast } from "sonner";

export function HeroImageUpload({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const result = await handleFetch<{ url: string }>(
      "/api/site-settings/hero-image",
      { method: "POST", body: formData }
    );

    if (result.status && result.result) {
      setUrl(result.result.url);
    }

    setUploading(false);
    e.target.value = "";
  }, []);

  async function handleRemove() {
    setRemoving(true);
    const result = await handleFetch("/api/site-settings/hero-image", { method: "DELETE" });
    if (result.status) setUrl(null);
    setRemoving(false);
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-4/3 w-full max-w-xs overflow-hidden rounded-lg border bg-muted sm:aspect-video sm:max-w-md">
        {url ? (
          <>
            <ProgressiveImage src={url} alt="Hero image" fill sizes="400px" className="object-cover" />
            <Button
              type="button"
              variant="destructive"
              size="icon-xs"
              className="absolute right-2 top-2"
              onClick={handleRemove}
              disabled={removing}
              title="Remove hero image"
            >
              {removing ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-muted-foreground">
            <span className="text-3xl">🪡</span>
            <span className="px-3 text-center text-xs">
              No custom hero uploaded — the default photo is shown on the homepage
            </span>
          </div>
        )}
      </div>

      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-accent",
          uploading && "pointer-events-none opacity-50"
        )}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
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
    </div>
  );
}
