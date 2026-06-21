import { createMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import { ProductGrid } from "@/components/products/product-grid";
import { EmptyState } from "@/components/shared/empty-state";
import { Heart } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import type { ProductWithImages } from "@/types";

export const metadata = createMetadata({
  title: "Wishlist",
  description: "Your saved sarees",
  path: "/wishlist",
});

export default async function WishlistPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          icon={Heart}
          title="Sign in to view your wishlist"
          description="Save your favorite sarees and come back to them anytime."
        >
          <Link href="/login?redirect=/wishlist" className={buttonVariants()}>
            Sign In
          </Link>
        </EmptyState>
      </div>
    );
  }

  const { data: wishlists } = await supabase
    .from("wishlists")
    .select("product_id, products(*, product_images(*), categories(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const products = (wishlists ?? [])
    .map((w) => w.products as unknown as ProductWithImages)
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My Wishlist
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {products.length} {products.length === 1 ? "item" : "items"}
      </p>

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Browse our collection and save your favorite sarees."
          >
            <Link href="/sarees" className={buttonVariants()}>
              Browse Sarees
            </Link>
          </EmptyState>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}
