import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StarRating } from "@/components/shared/star-rating";
import type { ReviewWithProfile } from "@/types";

export function ProductReviews({ reviews }: { reviews: ReviewWithProfile[] }) {
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        No reviews yet. Be the first to review this product!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div key={review.id} className="space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {review.profiles?.full_name?.[0]?.toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">
                {review.profiles?.full_name ?? "Anonymous"}
              </p>
              <StarRating rating={review.rating} />
            </div>
            <time className="ml-auto text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </time>
          </div>

          {review.title && (
            <p className="text-sm font-medium">{review.title}</p>
          )}

          {review.comment && (
            <p className="text-sm text-muted-foreground">{review.comment}</p>
          )}

          {review.admin_response && (
            <div className="ml-4 rounded-md border-l-2 border-primary/30 bg-muted/50 p-3">
              <p className="text-xs font-medium text-primary">Store Response</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {review.admin_response}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
