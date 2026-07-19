"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { deleteOwnReview } from "@/actions/reviews";
import { handleAction } from "@/lib/action-handler";

export function DeleteReviewButton({
  reviewId,
  earnedPoints,
}: {
  reviewId: string;
  /** Whether this review earned loyalty points (approved, rating qualified). */
  earnedPoints: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await handleAction(deleteOwnReview(reviewId), {
      onSuccess: () => {
        setOpen(false);
        router.refresh();
      },
    });
    setLoading(false);
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Delete review"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this review?</DialogTitle>
            <DialogDescription>
              {earnedPoints
                ? "The loyalty points this review earned will be removed from your balance. If you've already spent them, the review can't be deleted."
                : "This removes your review permanently."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button variant="destructive" disabled={loading} onClick={handleDelete}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete review
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
