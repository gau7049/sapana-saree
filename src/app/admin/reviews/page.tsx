import { createClient } from "@/lib/supabase/server";
import { ReviewModerator } from "@/components/admin/review-moderator";
import { EmptyState } from "@/components/shared/empty-state";
import { Star } from "lucide-react";

export default async function AdminReviewsPage() {
  const supabase = await createClient();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles(full_name, email), products(title, slug)")
    .order("created_at", { ascending: false });

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
