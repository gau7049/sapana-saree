"use client";

import { useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlists";
import { handleAction } from "@/lib/action-handler";
import { cn } from "@/lib/utils";
import { SignInModal } from "@/components/auth/sign-in-modal";

/**
 * Compact circular wishlist toggle overlaid on a ProductCard's image corner —
 * the wireframe shows this on every card, not just the product detail page.
 * Reuses the exact same wishlist server actions as the full-width
 * WishlistButton on the detail page; this is a separate component only so a
 * change here can never affect that already-verified button.
 */
export function ProductCardWishlistToggle({
  productId,
  initialWishlisted = false,
}: {
  productId: string;
  initialWishlisted?: boolean;
}) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  async function toggle() {
    setLoading(true);
    const action = isWishlisted
      ? removeFromWishlist(productId)
      : addToWishlist(productId);
    await handleAction(action, {
      onSuccess: () => setIsWishlisted(!isWishlisted),
    });
    setLoading(false);
  }

  function handleClick(e: React.MouseEvent) {
    // Card wraps this in a <Link> to the product page — the toggle must not
    // also navigate.
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setSignInOpen(true);
      return;
    }
    toggle();
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
        aria-pressed={isWishlisted}
        disabled={loading}
        className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card/90 backdrop-blur-sm transition-colors hover:border-foreground/30"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Heart
            className={cn(
              "h-3.5 w-3.5",
              isWishlisted ? "fill-red-500 text-red-500" : "text-foreground"
            )}
          />
        )}
      </button>
      <SignInModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSuccess={() => toggle()}
      />
    </>
  );
}
