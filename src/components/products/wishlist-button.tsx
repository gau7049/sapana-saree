"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlists";
import { createClient } from "@/lib/supabase/client";
import { handleAction } from "@/lib/action-handler";
import { cn } from "@/lib/utils";

export function WishlistButton({ productId }: { productId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("wishlists")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", productId)
      .maybeSingle()
      .then(({ data }) => setIsWishlisted(!!data));
  }, [user, productId]);

  async function handleToggle() {
    if (!user) {
      router.push("/login?redirect=" + encodeURIComponent(window.location.pathname));
      return;
    }

    setLoading(true);

    const action = isWishlisted
      ? removeFromWishlist(productId)
      : addToWishlist(productId);

    await handleAction(action, {
      onSuccess: () => setIsWishlisted(!isWishlisted),
    });

    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-full gap-2"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Heart
          className={cn(
            "h-5 w-5",
            isWishlisted && "fill-red-500 text-red-500"
          )}
        />
      )}
      {isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
    </Button>
  );
}
