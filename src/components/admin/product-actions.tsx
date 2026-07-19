"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { MoreHorizontal, Pencil, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { deleteProduct, archiveProduct } from "@/actions/products";
import { handleAction } from "@/lib/action-handler";

export function AdminProductActions({
  productId,
  productTitle,
  productSlug,
}: {
  productId: string;
  productTitle: string;
  productSlug: string;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState<"archive" | "delete" | null>(null);

  async function handleArchive() {
    setLoading("archive");
    await handleAction(archiveProduct(productId), {
      onSuccess: () => {
        setDialogOpen(false);
        router.refresh();
      },
    });
    setLoading(null);
  }

  async function handleDelete() {
    setLoading("delete");
    await handleAction(deleteProduct(productId), {
      onSuccess: () => {
        setDialogOpen(false);
        router.refresh();
      },
    });
    setLoading(null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon" />}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/products/${productId}/edit`} />}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href={`/sarees/${productSlug}`} target="_blank" />}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{productTitle}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently removes the product, its images, and all reviews,
              wishlist saves, and inquiry history tied to it. This cannot be undone.
              If you just want to hide it from the store, archive it instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant="outline"
              onClick={handleArchive}
              disabled={loading !== null}
            >
              {loading === "archive" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Archive instead
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading !== null}
            >
              {loading === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
