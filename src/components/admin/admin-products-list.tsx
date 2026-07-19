"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Package, Trash2, Loader2 } from "lucide-react";
import { AdminProductActions } from "@/components/admin/product-actions";
import { bulkUpdateStatus, bulkDeleteProducts } from "@/actions/products";
import { handleAction } from "@/lib/action-handler";
import type { ProductWithImages, ProductStatus } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
};

export function AdminProductsList({ products }: { products: ProductWithImages[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [loading, setLoading] = useState<ProductStatus | "delete" | null>(null);

  const allSelected = products.length > 0 && selected.size === products.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkStatus(status: ProductStatus) {
    setLoading(status);
    await handleAction(bulkUpdateStatus(Array.from(selected), status), {
      onSuccess: () => {
        setSelected(new Set());
        router.refresh();
      },
    });
    setLoading(null);
  }

  async function handleBulkDelete() {
    setLoading("delete");
    await handleAction(bulkDeleteProducts(Array.from(selected)), {
      onSuccess: () => {
        setSelected(new Set());
        setBulkDeleteOpen(false);
        router.refresh();
      },
    });
    setLoading(null);
  }

  return (
    <div>
      <div className="mt-6 flex items-center gap-3">
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleAll}
          aria-label="Select all products"
        />
        <span className="text-sm text-muted-foreground">
          {selected.size > 0 ? `${selected.size} selected` : "Select all"}
        </span>

        {selected.size > 0 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleBulkStatus("published")}
            >
              {loading === "published" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleBulkStatus("draft")}
            >
              {loading === "draft" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Mark Draft
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading !== null}
              onClick={() => handleBulkStatus("archived")}
            >
              {loading === "archived" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Archive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={loading !== null}
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {products.map((product) => {
          const primaryImage =
            product.product_images?.find((img) => img.is_primary) ??
            product.product_images?.[0];

          return (
            <div
              key={product.id}
              className="flex items-center gap-3 rounded-lg border bg-card p-4"
            >
              <Checkbox
                checked={selected.has(product.id)}
                onCheckedChange={() => toggleOne(product.id)}
                aria-label={`Select ${product.title}`}
              />

              <div className="relative aspect-3/4 w-12 shrink-0 overflow-hidden rounded-md bg-muted">
                {primaryImage ? (
                  <Image
                    src={primaryImage.url}
                    alt={primaryImage.alt_text ?? product.title}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Package className="h-4 w-4" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="truncate font-medium hover:text-primary"
                  >
                    {product.title}
                  </Link>
                  <Badge
                    variant="secondary"
                    className={STATUS_STYLE[product.status] ?? ""}
                  >
                    {product.status}
                  </Badge>
                  {product.is_featured && (
                    <Badge variant="secondary">Featured</Badge>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-3 text-sm text-muted-foreground">
                  <span>₹{Number(product.price).toLocaleString("en-IN")}</span>
                  {product.categories && <span>{product.categories.name}</span>}
                  <span>{new Date(product.created_at).toLocaleDateString("en-IN")}</span>
                </div>
              </div>
              <AdminProductActions
                productId={product.id}
                productTitle={product.title}
                productSlug={product.slug}
              />
            </div>
          );
        })}
      </div>

      <Dialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {selected.size} products?</DialogTitle>
            <DialogDescription>
              This permanently removes these products, their images, and all reviews,
              wishlist saves, and inquiry history tied to them. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={loading !== null}
            >
              {loading === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
