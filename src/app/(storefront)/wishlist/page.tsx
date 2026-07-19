import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { createMetadata } from "@/lib/seo";
import { getCurrentProfile } from "@/lib/auth-guard";
import { getWishlist } from "@/lib/queries/wishlists";
import { ProductGrid } from "@/components/products/product-grid";
import { EmptyState } from "@/components/shared/empty-state";

export const metadata = createMetadata({
  title: "Wishlist",
  description: "Your saved sarees",
  path: "/wishlist",
});

export default async function WishlistPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?redirect=/wishlist");

  const products = await getWishlist(profile.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My Wishlist
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {products.length} {products.length === 1 ? "saree" : "sarees"} saved
      </p>

      <div className="mt-8">
        {products.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Save sarees you love so you can find them again easily."
            actionLabel="Explore Sarees"
            actionHref="/sarees"
          />
        ) : (
          <ProductGrid products={products} allWishlisted />
        )}
      </div>
    </div>
  );
}
