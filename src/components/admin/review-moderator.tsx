"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/shared/star-rating";
import { Check, X, Trash2 } from "lucide-react";
import { moderateReview, deleteReview } from "@/actions/reviews";
import { handleAction } from "@/lib/action-handler";

interface ReviewRow {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; username: string } | null;
  products: { title: string; slug: string } | null;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export function ReviewModerator({ reviews }: { reviews: ReviewRow[] }) {
  const router = useRouter();

  async function handleModerate(id: string, status: "approved" | "rejected") {
    await handleAction(moderateReview(id, status), {
      onSuccess: () => router.refresh(),
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this review?")) return;
    await handleAction(deleteReview(id), {
      onSuccess: () => router.refresh(),
    });
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {review.profiles?.full_name ?? review.profiles?.username ?? "Unknown"}
                </span>
                <Badge
                  variant="secondary"
                  className={STATUS_STYLE[review.status] ?? ""}
                >
                  {review.status}
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                on {review.products?.title ?? "Unknown product"} &middot;{" "}
                {new Date(review.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>
            <div className="flex gap-1">
              {review.status === "pending" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleModerate(review.id, "approved")}
                    title="Approve"
                  >
                    <Check className="h-3.5 w-3.5 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleModerate(review.id, "rejected")}
                    title="Reject"
                  >
                    <X className="h-3.5 w-3.5 text-red-600" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleDelete(review.id)}
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="mt-2">
            <StarRating rating={review.rating} />
          </div>

          {review.title && (
            <p className="mt-1 text-sm font-medium">{review.title}</p>
          )}
          {review.comment && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {review.comment}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
