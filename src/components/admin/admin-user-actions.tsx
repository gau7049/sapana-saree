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
import { MoreHorizontal, Eye, Ban, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { deactivateUser, reactivateUser, deleteUserPermanently } from "@/actions/users";
import { handleAction } from "@/lib/action-handler";

export function AdminUserActions({
  userId,
  userName,
  isActive,
}: {
  userId: string;
  userName: string;
  isActive: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [loading, setLoading] = useState<"toggle" | "delete" | null>(null);

  async function handleToggleActive() {
    setLoading("toggle");
    await handleAction((isActive ? deactivateUser : reactivateUser)(userId), {
      onSuccess: () => router.refresh(),
    });
    setLoading(null);
  }

  async function handleDelete() {
    setLoading("delete");
    await handleAction(deleteUserPermanently(userId), {
      onSuccess: () => {
        setDeleteOpen(false);
        router.refresh();
      },
    });
    setLoading(null);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href={`/admin/users/${userId}`} />}>
            <Eye className="mr-2 h-4 w-4" />
            View details
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleActive} disabled={loading !== null}>
            {isActive ? (
              <Ban className="mr-2 h-4 w-4" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            {isActive ? "Deactivate" : "Reactivate"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete permanently
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{userName}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently deletes the account and everything tied to it —
              order history, loyalty points, and reviews. This cannot be undone.
              If you just want to block them from ordering, deactivate instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={loading !== null}>
              {loading === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
