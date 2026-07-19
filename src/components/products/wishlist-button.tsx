"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { addToWishlist, removeFromWishlist } from "@/actions/wishlists";
import { handleAction } from "@/lib/action-handler";
import { cn } from "@/lib/utils";
import { SignInModal } from "@/components/auth/sign-in-modal";

export function WishlistButton({
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

  function handleToggle() {
    if (!user) {
      setSignInOpen(true);
      return;
    }
    toggle();
  }

  return (
    <>
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
      <SignInModal
        open={signInOpen}
        onOpenChange={setSignInOpen}
        onSuccess={() => toggle()}
      />
    </>
  );
}
