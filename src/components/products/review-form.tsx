"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createReview } from "@/actions/reviews";
import { handleAction } from "@/lib/action-handler";
import type { Review } from "@/types";

export function ReviewForm({
  productId,
  existingReview = null,
}: {
  productId: string;
  existingReview?: Review | null;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  // Immediate feedback after submit, before router.refresh() delivers the
  // server-rendered `existingReview`.
  const [justSubmitted, setJustSubmitted] = useState(false);

  if (!user) return null;

  // The user already has a review on file (one per product) — show its status
  // instead of an empty form that looks like the submission vanished.
  if (existingReview || justSubmitted) {
    const isApproved = existingReview?.status === "approved";
    return (
      <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
        {isApproved ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
        ) : (
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
        )}
        <div>
          <p className="font-medium">
            {isApproved ? "Thanks for your review!" : "Your review is awaiting approval"}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isApproved
              ? "Your review is live on this page."
              : "We review submissions before publishing them. It will appear here once approved."}
          </p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("rating", String(rating));

    await handleAction(createReview(productId, formData), {
      onSuccess: () => {
        setJustSubmitted(true);
        router.refresh();
      },
    });

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">Write a Review</h3>

      <div className="space-y-2">
        <Label>Rating *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              aria-label={`Rate ${value} ${value === 1 ? "star" : "stars"}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-6 w-6 transition-colors",
                  value <= (hoveredRating || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-muted-foreground/30"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-title">Title (optional)</Label>
        <Input id="review-title" name="title" placeholder="Summarize your experience" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Review (optional)</Label>
        <Textarea
          id="review-comment"
          name="comment"
          rows={3}
          placeholder="Tell others about this saree..."
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Submit Review
      </Button>
    </form>
  );
}
