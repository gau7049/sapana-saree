import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getFeaturedProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/products/product-card";

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">
            Featured Sarees
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Handpicked favorites from our collection
          </p>
        </div>
        <Link
          href="/sarees?featured=true"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden gap-1 text-primary sm:inline-flex"
          )}
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 10).map((product, index) => (
          // Eagerly load only the images visible above the fold on first paint.
          <ProductCard key={product.id} product={product} priority={index < 4} />
        ))}
      </div>

      <div className="mt-6 text-center sm:hidden">
        <Link
          href="/sarees?featured=true"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1"
          )}
        >
          View All Sarees
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
