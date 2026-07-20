import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getHomepageProducts } from "@/lib/queries/products";
import { ProductCard } from "@/components/products/product-card";

export async function FeaturedProducts() {
  const { products, isFeatured } = await getHomepageProducts();

  if (products.length === 0) return null;

  // "View All" only makes sense with the featured filter when these actually
  // are the admin-curated picks — otherwise ?featured=true would land on an
  // empty results page.
  const viewAllHref = isFeatured ? "/sarees?featured=true" : "/sarees";

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold sm:text-xl">
            {isFeatured ? "Featured Sarees" : "New Arrivals"}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {isFeatured
              ? "Handpicked favorites from our collection"
              : "Freshly added to our collection"}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden gap-1 text-primary sm:inline-flex"
          )}
        >
          View All
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Mobile: horizontal-scroll strip so the section stays a single row
          instead of adding another long wrapping grid to scroll past.
          sm and up: switches to the regular wrapping grid. */}
      <div className="mt-6 flex gap-3 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 10).map((product, index) => (
          <div key={product.id} className="w-[42vw] shrink-0 sm:w-auto">
            {/* Eagerly load only the images visible above the fold on first paint. */}
            <ProductCard product={product} priority={index < 4} />
          </div>
        ))}
      </div>

      <div className="mt-6 text-center sm:hidden">
        <Link
          href={viewAllHref}
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
