import { ReviewModerator } from "@/components/admin/review-moderator";
import { EmptyState } from "@/components/shared/empty-state";
import { Star } from "lucide-react";
import { getAdminReviews } from "@/lib/queries/reviews";

export default async function AdminReviewsPage() {
  const reviews = await getAdminReviews();

  return (
    <div>
      <h1 className="text-2xl font-bold">Reviews</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Moderate product reviews.
      </p>

      <div className="mt-6">
        {!reviews || reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Reviews will appear here when customers submit them."
          />
        ) : (
          <ReviewModerator reviews={reviews} />
        )}
      </div>
    </div>
  );
}
