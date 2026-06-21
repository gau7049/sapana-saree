import { redirect } from "next/navigation";
import { createMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { StarRating } from "@/components/shared/star-rating";
import { EmptyState } from "@/components/shared/empty-state";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = createMetadata({
  title: "My Reviews",
  description: "View your product reviews",
  path: "/account/reviews",
});

export default async function ReviewsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirect=/account/reviews");

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, products(title, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My Reviews
      </h1>

      <div className="mt-8 space-y-4">
        {!reviews || reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews yet"
            description="Share your thoughts on products you've purchased."
          >
            <Link href="/sarees" className={buttonVariants()}>
              Browse Sarees
            </Link>
          </EmptyState>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border bg-card p-4 space-y-2"
            >
              <div className="flex items-start justify-between">
                <Link
                  href={`/sarees/${(review.products as { slug: string })?.slug}`}
                  className="font-medium hover:text-primary"
                >
                  {(review.products as { title: string })?.title}
                </Link>
                <Badge variant="secondary">{review.status}</Badge>
              </div>
              <StarRating rating={review.rating} />
              {review.title && <p className="text-sm font-medium">{review.title}</p>}
              {review.comment && (
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString("en-IN")}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
