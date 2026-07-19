import Link from "next/link";
import { createMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/auth-guard";
import { getUserReviews } from "@/lib/queries/reviews";
import { EmptyState } from "@/components/shared/empty-state";
import { StarRating } from "@/components/shared/star-rating";
import { DeleteReviewButton } from "@/components/shared/delete-review-button";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export const metadata = createMetadata({
  title: "My Reviews",
  description: "View your product reviews",
  path: "/account/reviews",
});

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  approved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default async function AccountReviewsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const reviews = await getUserReviews(profile.id);

  if (reviews.length === 0) {
    return (
      <EmptyState
        icon={Star}
        title="No reviews yet"
        description="Reviews you write on products will show up here."
      />
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <div key={review.id} className="rounded-lg border bg-card p-4">
          <div className="flex items-start justify-between">
            <Link
              href={`/sarees/${review.products?.slug ?? ""}`}
              className="font-medium hover:text-primary"
            >
              {review.products?.title ?? "Unknown product"}
            </Link>
            <div className="flex items-center gap-1">
              <Badge variant="secondary" className={STATUS_STYLE[review.status] ?? ""}>
                {review.status}
              </Badge>
              <DeleteReviewButton
                reviewId={review.id}
                earnedPoints={review.status === "approved" && review.rating >= 3}
              />
            </div>
          </div>
          <div className="mt-2">
            <StarRating rating={review.rating} />
          </div>
          {review.title && <p className="mt-1 text-sm font-medium">{review.title}</p>}
          {review.comment && (
            <p className="mt-0.5 text-sm text-muted-foreground">{review.comment}</p>
          )}
          {review.admin_response && (
            <p className="mt-2 rounded bg-muted p-2 text-sm">
              <span className="font-medium">Response: </span>
              {review.admin_response}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
