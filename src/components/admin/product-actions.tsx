"use client";

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
import { MoreHorizontal, Pencil, Trash2, ExternalLink } from "lucide-react";
import { deleteProduct } from "@/actions/products";
import { toast } from "sonner";

export function AdminProductActions({ productId }: { productId: string }) {
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const result = await deleteProduct(productId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Product deleted");
      router.refresh();
    }
  }

  return (
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
        <DropdownMenuItem render={<Link href={`/sarees/${productId}`} target="_blank" />}>
          <ExternalLink className="mr-2 h-4 w-4" />
          View
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={handleDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
