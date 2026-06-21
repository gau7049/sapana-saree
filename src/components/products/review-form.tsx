"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function ReviewForm({ productId }: { productId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!user) return null;
  if (submitted) {
    return (
      <div className="rounded-lg border bg-green-50 p-4 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
        Thank you for your review! It will appear after moderation.
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
    const form = e.currentTarget;
    const formData = new FormData(form);

    const supabase = createClient();
    const { error } = await supabase.from("reviews").insert({
      product_id: productId,
      user_id: user!.id,
      rating,
      title: (formData.get("title") as string) || null,
      comment: (formData.get("comment") as string) || null,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You've already reviewed this product");
      } else {
        toast.error(error.message);
      }
    } else {
      setSubmitted(true);
      toast.success("Review submitted for moderation");
      router.refresh();
    }

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
